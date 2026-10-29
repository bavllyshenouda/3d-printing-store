import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/auth/customer";
import { updateAddressSchema } from "@/lib/validations/order";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const auth = await requireCustomer(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const { user, supabase } = auth;

    const { data: address, error } = await supabase
      .from("customer_addresses")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (!address) {
      return NextResponse.json(
        { success: false, error: "Address not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: { address } },
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

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const auth = await requireCustomer(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const { user, supabase } = auth;
    const body = await request.json();

    const parseResult = updateAddressSchema.safeParse(body);
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

    const updates = parseResult.data;

    // Check address ownership
    const { data: existing, error: fetchError } = await supabase
      .from("customer_addresses")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchError || !existing) {
      return NextResponse.json(
        { success: false, error: "Address not found" },
        { status: 404 }
      );
    }

    if (updates.is_default) {
      await supabase
        .from("customer_addresses")
        .update({ is_default: false, updated_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("is_default", true);
    }

    const { data: updatedAddress, error: updateError } = await supabase
      .from("customer_addresses")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Address updated successfully",
        data: { address: updatedAddress },
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

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const auth = await requireCustomer(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const { user, supabase } = auth;

    const { data: deleted, error } = await supabase
      .from("customer_addresses")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Address not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Address deleted successfully" },
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

