import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { adminReviewPaymentSchema } from "@/lib/validations/payment";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id: paymentId } = await context.params;

    // 1. Enforce administrator authorization
    const auth = await requireAdmin(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const { supabase } = auth;

    // 2. Validate request body
    const body = await request.json();
    const parseResult = adminReviewPaymentSchema.safeParse(body);

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

    const { action, notes, transaction_reference } = parseResult.data;

    // 3. Execute atomic review transaction via RPC
    // Enforces state consistency across payments, orders, and shipping_events
    const { data: reviewResult, error: rpcError } = await supabase.rpc(
      "admin_review_payment",
      {
        p_payment_id: paymentId,
        p_action: action,
        p_notes: notes || null,
        p_transaction_reference: transaction_reference || null,
      }
    );

    if (rpcError) {
      const isNotFound = rpcError.message.includes("not found");
      const isForbidden = rpcError.message.includes("privileges required");
      const isDuplicateOrInvalid =
        rpcError.message.includes("already approved") ||
        rpcError.message.includes("Cannot review") ||
        rpcError.message.includes("rejection reason is required");

      const status = isNotFound ? 404 : isForbidden ? 403 : isDuplicateOrInvalid ? 400 : 500;

      return NextResponse.json(
        { success: false, error: rpcError.message },
        { status }
      );
    }

    const result =
      typeof reviewResult === "string"
        ? JSON.parse(reviewResult)
        : reviewResult;

    return NextResponse.json(
      {
        success: true,
        message: result.message,
        data: result,
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

