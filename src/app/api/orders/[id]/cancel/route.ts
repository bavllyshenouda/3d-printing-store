import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/auth/customer";
import { customerCancelOrderSchema } from "@/lib/validations/order";

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

    let reason = "Customer requested cancellation";
    try {
      const body = await request.json();
      const parseResult = customerCancelOrderSchema.safeParse(body);
      if (parseResult.success && parseResult.data.reason) {
        reason = parseResult.data.reason;
      }
    } catch {
      // Body is optional; fallback to default cancellation reason
    }

    // Call atomic RPC: validates ownership, verifies cancellable state,
    // restores inventory to products.stock, marks status as cancelled,
    // and logs cancellation event to shipping_events.
    const { data: cancelResult, error: cancelError } = await supabase.rpc(
      "cancel_order_and_restore_stock",
      {
        p_order_id: id,
        p_reason: reason,
      }
    );

    if (cancelError) {
      const isNotFound = cancelError.message.includes("Order not found");
      const isForbidden = cancelError.message.includes("Access denied");
      const isBadState = cancelError.message.includes("cannot be cancelled");

      const status = isNotFound ? 404 : isForbidden ? 403 : isBadState ? 400 : 500;

      return NextResponse.json(
        {
          success: false,
          error: cancelError.message,
        },
        { status }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Order cancelled and inventory restored successfully",
        data: typeof cancelResult === "string" ? JSON.parse(cancelResult) : cancelResult,
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

