import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/auth/customer";
import { requireAdmin } from "@/lib/auth/admin";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id: orderId } = await context.params;

    // Check if customer or admin
    let auth = await requireCustomer(request);
    let isAdmin = false;

    if (!auth.authorized) {
      const adminAuth = await requireAdmin(request);
      if (!adminAuth.authorized) {
        return auth.response;
      }
      isAdmin = true;
      auth = adminAuth;
    }

    const { user, supabase } = auth;

    // Retrieve order to verify ownership
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, user_id")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Ownership check: must be owner or admin
    if (!isAdmin && order.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Access denied. You do not own this order" },
        { status: 403 }
      );
    }

    // Retrieve payment record to get proof_storage_path
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("id, proof_storage_path, status")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (paymentError || !payment || !payment.proof_storage_path) {
      return NextResponse.json(
        {
          success: false,
          error: "No payment proof has been uploaded for this order",
        },
        { status: 404 }
      );
    }

    // Generate a secure, short-lived signed URL (15 minutes = 900 seconds)
    const { data: signedData, error: signError } = await supabase.storage
      .from("payment-proofs")
      .createSignedUrl(payment.proof_storage_path, 900);

    if (signError || !signedData) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to generate signed preview URL: ${signError?.message || "Unknown error"}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          signed_url: signedData.signedUrl,
          expires_in: 900,
          proof_storage_path: payment.proof_storage_path,
        },
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

