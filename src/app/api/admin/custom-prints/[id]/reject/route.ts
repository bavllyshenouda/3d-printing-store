import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { adminRejectRequestSchema } from "@/lib/validations/custom-print";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id: requestId } = await context.params;

    // 1. Authenticate administrator (server-side authorization; also enforced in the RPC)
    const auth = await requireAdmin(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const { supabase } = auth;

    // 2. Validate rejection reason (rejects empty / whitespace-only via trim + min length)
    const body = await request.json();
    const parseResult = adminRejectRequestSchema.safeParse(body);

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

    const { reason } = parseResult.data;

    // 3. Invoke atomic RPC: sets status='rejected' + reason, expires open quotes
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      "admin_reject_custom_print_request",
      {
        p_request_id: requestId,
        p_reason: reason,
      }
    );

    if (rpcError) {
      const isNotFound = rpcError.message.includes("not found");
      const isForbidden = rpcError.message.includes("privileges required");
      const isBadState =
        rpcError.message.includes("Cannot reject") ||
        rpcError.message.includes("Rejection reason is required");

      const httpStatus = isNotFound ? 404 : isForbidden ? 403 : isBadState ? 400 : 500;

      return NextResponse.json(
        { success: false, error: rpcError.message },
        { status: httpStatus }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Request rejected. The customer can now see your reason.",
        data: rpcResult,
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
