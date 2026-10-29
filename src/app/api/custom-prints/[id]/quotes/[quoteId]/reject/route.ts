import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/auth/customer";
import { rejectQuoteSchema } from "@/lib/validations/custom-print";

interface RouteContext {
  params: Promise<{ id: string; quoteId: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id: requestId, quoteId } = await context.params;

    const auth = await requireCustomer(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const { supabase } = auth;

    let reason = "Customer declined quote terms";
    try {
      const body = await request.json();
      const parseResult = rejectQuoteSchema.safeParse(body);
      if (parseResult.success && parseResult.data.reason) {
        reason = parseResult.data.reason;
      }
    } catch {
      // Body is optional
    }

    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      "reject_custom_print_quote",
      {
        p_quote_id: quoteId,
        p_reason: reason,
      }
    );

    if (rpcError) {
      const isNotFound = rpcError.message.includes("not found");
      const isForbidden = rpcError.message.includes("Access denied");
      const isBadState = rpcError.message.includes("cannot be rejected");

      const status = isNotFound ? 404 : isForbidden ? 403 : isBadState ? 400 : 500;

      return NextResponse.json(
        { success: false, error: rpcError.message },
        { status }
      );
    }

    const result =
      typeof rpcResult === "string" ? JSON.parse(rpcResult) : rpcResult;

    return NextResponse.json(
      {
        success: true,
        message: "Quote rejected. Request has returned to under review.",
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

