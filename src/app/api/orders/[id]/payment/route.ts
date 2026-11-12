import { NextResponse } from "next/server";
import { requireCustomerOrAdmin } from "@/lib/auth";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id: orderId } = await context.params;

    const auth = await requireCustomerOrAdmin(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const { supabase, isAdmin } = auth;

    // Retrieve or create payment record via secure RPC
    const { data: paymentResult, error: rpcError } = await supabase.rpc(
      "get_or_create_order_payment",
      { p_order_id: orderId }
    );

    if (rpcError) {
      const isNotFound = rpcError.message.includes("Order not found");
      const isForbidden = rpcError.message.includes("Access denied");

      return NextResponse.json(
        { success: false, error: rpcError.message },
        { status: isNotFound ? 404 : isForbidden ? 403 : 500 }
      );
    }

    const payment =
      typeof paymentResult === "string"
        ? JSON.parse(paymentResult)
        : paymentResult;

    return NextResponse.json(
      {
        success: true,
        data: { payment },
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

