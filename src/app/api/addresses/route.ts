import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/auth/customer";
import { addressSchema } from "@/lib/validations/order";

export async function GET(request: Request) {
  try {
    const auth = await requireCustomer(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const { user, supabase } = auth;

    const { data: addresses, error } = await supabase
      .from("customer_addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: { addresses: addresses || [] },
      },
      { status: 200 }
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

export async function POST(request: Request) {
  try {
    const auth = await requireCustomer(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const { user, supabase } = auth;
    const body = await request.json();

    const parseResult = addressSchema.safeParse(body);
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

    const data = parseResult.data;

    // If setting as default, remove default from other addresses
    if (data.is_default) {
      await supabase
        .from("customer_addresses")
        .update({ is_default: false, updated_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("is_default", true);
    }

    const { data: newAddress, error: insertError } = await supabase
      .from("customer_addresses")
      .insert({
        user_id: user.id,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        email: data.email || null,
        country: data.country || "Egypt",
        governorate: data.governorate,
        region: data.region,
        street_address: data.street_address,
        building: data.building || null,
        floor: data.floor || null,
        apartment: data.apartment || null,
        notes: data.notes || null,
        is_default: data.is_default,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Address saved successfully",
        data: { address: newAddress },
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

