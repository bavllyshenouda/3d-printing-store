import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/auth/customer";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const auth = await requireCustomer(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const { user, supabase } = auth;

    // Verify order exists and belongs to this customer
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("id, status, user_id, order_number")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchError || !order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Only orders in 'pending_customer_confirmation' can be confirmed by customer
    if (order.status !== "pending_customer_confirmation") {
      return NextResponse.json(
        {
          success: false,
          error: `Order cannot be confirmed. Current status is '${order.status}'`,
        },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update({
        status: "confirmed",
        customer_confirmation_at: now,
        confirmed_at: now,
        updated_at: now,
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    // Record shipping / status event
    await supabase.from("shipping_events").insert({
      order_id: id,
      status: "confirmed",
      description: "Customer confirmed the order. Order is now queued for processing.",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Order confirmed successfully. Your order is now queued for processing.",
        data: { order: updatedOrder },
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

