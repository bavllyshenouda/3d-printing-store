import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/auth/customer";
import { acceptQuoteSchema } from "@/lib/validations/custom-print";

interface RouteContext {
  params: Promise<{ id: string; quoteId: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id: requestId, quoteId } = await context.params;

    // 1. Authenticate customer
    const auth = await requireCustomer(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const { user, supabase } = auth;

    // 2. Validate request body
    const body = await request.json();
    const parseResult = acceptQuoteSchema.safeParse(body);

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
      payment_method,
      shipping_fee = 50,
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
    }

    // 4. Invoke atomic RPC to accept quote and create order
    // Validates quote ownership, expiration, status, creates order and order_items atomically.
    // Idempotent: If quote was already accepted, returns existing order without creating duplicates.
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      "accept_custom_print_quote",
      {
        p_quote_id: quoteId,
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
      }
    );

    if (rpcError) {
      const isNotFound = rpcError.message.includes("not found");
      const isForbidden = rpcError.message.includes("Access denied");
      const isBadState =
        rpcError.message.includes("cannot be accepted") ||
        rpcError.message.includes("expired") ||
        rpcError.message.includes("Invalid Egyptian phone");

      const status = isNotFound ? 404 : isForbidden ? 403 : isBadState ? 400 : 500;

      return NextResponse.json(
        { success: false, error: rpcError.message },
        { status }
      );
    }

    const result =
      typeof rpcResult === "string" ? JSON.parse(rpcResult) : rpcResult;

    const isAlreadyAccepted = Boolean(result.already_accepted);

    return NextResponse.json(
      {
        success: true,
        message: isAlreadyAccepted
          ? "Quote has already been accepted. Associated order retrieved."
          : "Quote accepted successfully and order created. Proceed to payment workflow.",
        data: result,
      },
      { status: isAlreadyAccepted ? 200 : 201 }
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

