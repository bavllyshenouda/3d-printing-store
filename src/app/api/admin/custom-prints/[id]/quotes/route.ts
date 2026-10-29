import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { adminCreateQuoteSchema } from "@/lib/validations/custom-print";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id: requestId } = await context.params;

    // 1. Authenticate administrator
    const auth = await requireAdmin(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const { supabase } = auth;

    // 2. Validate quote payload
    const body = await request.json();
    const parseResult = adminCreateQuoteSchema.safeParse(body);

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
      description,
      material,
      color,
      quantity,
      unit_price,
      estimated_days,
      valid_days,
      status,
    } = parseResult.data;

    // 3. Invoke atomic RPC to create quote and advance request status
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      "admin_create_or_send_quote",
      {
        p_request_id: requestId,
        p_description: description,
        p_material: material || null,
        p_color: color || null,
        p_quantity: quantity,
        p_unit_price: unit_price,
        p_estimated_days: estimated_days,
        p_valid_days: valid_days,
        p_status: status,
      }
    );

    if (rpcError) {
      const isNotFound = rpcError.message.includes("not found");
      const isForbidden = rpcError.message.includes("privileges required");
      const isBadState =
        rpcError.message.includes("Cannot quote") ||
        rpcError.message.includes("Quantity must be") ||
        rpcError.message.includes("price cannot be negative");

      const httpStatus = isNotFound ? 404 : isForbidden ? 403 : isBadState ? 400 : 500;

      return NextResponse.json(
        { success: false, error: rpcError.message },
        { status: httpStatus }
      );
    }

    const quote =
      typeof rpcResult === "string" ? JSON.parse(rpcResult) : rpcResult;

    return NextResponse.json(
      {
        success: true,
        message:
          status === "sent"
            ? "Quote sent to customer successfully. Customer can now review, accept, or reject the quote."
            : "Quote draft saved successfully.",
        data: { quote },
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

