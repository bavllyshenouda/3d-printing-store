import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/auth/customer";
import { checkoutSchema } from "@/lib/validations/order";

export async function POST(request: Request) {
  try {
    // 1. Enforce authenticated customer
    const auth = await requireCustomer(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const { user, supabase } = auth;

    // 2. Validate request body
    const body = await request.json();
    const parseResult = checkoutSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      address_id,
      address,
      save_address,
      payment_method,
      shipping_fee = 0,
      discount_amount = 0,
      address_notes,
    } = parseResult.data;

    // 3. Resolve shipping address
    let resolvedFirstName = "";
    let resolvedLastName = "";
    let resolvedPhone = "";
    let resolvedEmail: string | null = null;
    let resolvedGovernorate = "";
    let resolvedRegion = "";
    let resolvedStreetAddress = "";
    let resolvedBuilding: string | null = null;
    let resolvedFloor: string | null = null;
    let resolvedApartment: string | null = null;
    let resolvedNotes: string | null = address_notes || null;

    if (address_id) {
      // Validate existing address ownership
      const { data: savedAddress, error: addressError } = await supabase
        .from("customer_addresses")
        .select("*")
        .eq("id", address_id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (addressError || !savedAddress) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid shipping address. Address not found or does not belong to your account",
          },
          { status: 400 }
        );
      }

      resolvedFirstName = savedAddress.first_name;
      resolvedLastName = savedAddress.last_name;
      resolvedPhone = savedAddress.phone;
      resolvedEmail = savedAddress.email;
      resolvedGovernorate = savedAddress.governorate;
      resolvedRegion = savedAddress.region;
      resolvedStreetAddress = savedAddress.street_address;
      resolvedBuilding = savedAddress.building;
      resolvedFloor = savedAddress.floor;
      resolvedApartment = savedAddress.apartment;
      resolvedNotes = address_notes || savedAddress.notes;
    } else if (address) {
      resolvedFirstName = address.first_name;
      resolvedLastName = address.last_name;
      resolvedPhone = address.phone;
      resolvedEmail = address.email || user.email || null;
      resolvedGovernorate = address.governorate;
      resolvedRegion = address.region;
      resolvedStreetAddress = address.street_address;
      resolvedBuilding = address.building || null;
      resolvedFloor = address.floor || null;
      resolvedApartment = address.apartment || null;
      resolvedNotes = address_notes || address.notes || null;

      // Optionally save to customer's address book
      if (save_address) {
        if (address.is_default) {
          await supabase
            .from("customer_addresses")
            .update({ is_default: false, updated_at: new Date().toISOString() })
            .eq("user_id", user.id)
            .eq("is_default", true);
        }

        await supabase.from("customer_addresses").insert({
          user_id: user.id,
          first_name: address.first_name,
          last_name: address.last_name,
          phone: address.phone,
          email: resolvedEmail,
          country: address.country || "Egypt",
          governorate: address.governorate,
          region: address.region,
          street_address: address.street_address,
          building: address.building || null,
          floor: address.floor || null,
          apartment: address.apartment || null,
          notes: address.notes || null,
          is_default: address.is_default,
        });
      }
    }

    // 4. Verify cart has items before invoking RPC
    const { count: cartCount, error: countError } = await supabase
      .from("cart_items")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (countError) {
      return NextResponse.json(
        { success: false, error: countError.message },
        { status: 500 }
      );
    }

    if (!cartCount || cartCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Your cart is empty. Add products to your cart before checking out.",
        },
        { status: 400 }
      );
    }

    // 5. Execute atomic checkout transaction via PostgreSQL RPC function
    // All prices, inventory locks (FOR UPDATE), deductions, order and line-item creation,
    // and cart deletion execute inside a single atomic database transaction.
    const { data: checkoutResult, error: checkoutError } = await supabase.rpc(
      "create_checkout_order",
      {
        p_customer_first_name: resolvedFirstName,
        p_customer_last_name: resolvedLastName,
        p_customer_phone: resolvedPhone,
        p_customer_email: resolvedEmail,
        p_governorate: resolvedGovernorate,
        p_region: resolvedRegion,
        p_street_address: resolvedStreetAddress,
        p_building: resolvedBuilding,
        p_floor: resolvedFloor,
        p_apartment: resolvedApartment,
        p_address_notes: resolvedNotes,
        p_payment_method: payment_method,
        p_shipping_fee: shipping_fee,
        p_discount_amount: discount_amount,
      }
    );

    if (checkoutError) {
      // Map PostgreSQL business rule and constraint errors cleanly
      const isBusinessRuleError =
        checkoutError.message.includes("Insufficient stock") ||
        checkoutError.message.includes("unpublished") ||
        checkoutError.message.includes("no longer exists") ||
        checkoutError.message.includes("Invalid Egyptian phone") ||
        checkoutError.message.includes("Cart is empty");

      return NextResponse.json(
        {
          success: false,
          error: checkoutError.message,
        },
        { status: isBusinessRuleError ? 400 : 500 }
      );
    }

    // Retrieve the created order with line items and shipping event snapshot
    const resultObj = typeof checkoutResult === "string" ? JSON.parse(checkoutResult) : checkoutResult;
    const orderId = (resultObj as { order_id?: string })?.order_id;

    if (!orderId) {
      return NextResponse.json(
        {
          success: true,
          message: "Order placed successfully",
          data: resultObj,
        },
        { status: 201 }
      );
    }

    const { data: orderDetails, error: fetchError } = await supabase
      .from("orders")
      .select(
        `
        *,
        items:order_items (
          id,
          product_id,
          product_name,
          product_image_url,
          color,
          quantity,
          unit_price,
          line_total
        ),
        shipping_events:shipping_events (
          id,
          status,
          description,
          event_time
        )
      `
      )
      .eq("id", orderId)
      .single();

    if (fetchError || !orderDetails) {
      return NextResponse.json(
        {
          success: true,
          message: "Order placed successfully",
          data: resultObj,
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Order placed successfully",
        data: {
          order: orderDetails,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
