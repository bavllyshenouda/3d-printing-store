import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/auth/customer";
import { validateProofFile, submitProofSchema } from "@/lib/validations/payment";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id: orderId } = await context.params;

    // 1. Authenticate customer
    const auth = await requireCustomer(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const { user, supabase } = auth;

    // 2. Fetch order to verify ownership, payment method, and status before processing file
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, user_id, payment_method, payment_status, status, total, currency")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Ownership check
    if (order.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Access denied. You do not own this order" },
        { status: 403 }
      );
    }

    // COD check: Cash on Delivery does not require or accept payment proofs
    if (order.payment_method === "cod") {
      return NextResponse.json(
        {
          success: false,
          error: "Cash on Delivery orders do not require proof of payment",
        },
        { status: 400 }
      );
    }

    // Allowed payment methods for proof upload
    if (!["instapay", "vodafone_cash"].includes(order.payment_method)) {
      return NextResponse.json(
        {
          success: false,
          error: `Payment method '${order.payment_method}' does not support payment proof upload`,
        },
        { status: 400 }
      );
    }

    // Order status check
    if (["cancelled", "rejected", "delivered"].includes(order.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot submit payment proof for order in status '${order.status}'`,
        },
        { status: 400 }
      );
    }

    // Payment status check: cannot upload if already paid
    if (order.payment_status === "paid") {
      return NextResponse.json(
        {
          success: false,
          error: "Order is already verified as paid. No further payment proof required.",
        },
        { status: 400 }
      );
    }

    // 3. Parse and validate multipart/form-data
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "A payment proof file is required" },
        { status: 400 }
      );
    }

    const fileValidation = validateProofFile(file);
    if (!fileValidation.valid) {
      return NextResponse.json(
        { success: false, error: fileValidation.error },
        { status: 400 }
      );
    }

    // Parse optional metadata text fields
    const rawRef = formData.get("transaction_reference")?.toString() || null;
    const rawNotes = formData.get("notes")?.toString() || null;

    const metadataParse = submitProofSchema.safeParse({
      transaction_reference: rawRef,
      notes: rawNotes,
    });

    if (!metadataParse.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: metadataParse.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { transaction_reference, notes } = metadataParse.data;

    // 4. Construct secure, deterministic storage path matching bucket RLS policy:
    // Policy expects: (storage.foldername(name))[1] = auth.uid() AND (storage.foldername(name))[2] = order.id
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const timestamp = Date.now();
    const storagePath = `${user.id}/${order.id}/${timestamp}-${sanitizedFileName}`;

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // 5. Upload file to private payment-proofs Supabase Storage bucket
    const { error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        {
          success: false,
          error: `Storage upload failed: ${uploadError.message}`,
        },
        { status: 500 }
      );
    }

    // 6. Invoke atomic RPC to update payments and orders table records
    // Uploading a proof moves payment_status to 'awaiting_verification'.
    // It NEVER marks the payment as 'paid'.
    const { data: paymentResult, error: rpcError } = await supabase.rpc(
      "submit_payment_proof",
      {
        p_order_id: order.id,
        p_proof_storage_path: storagePath,
        p_transaction_reference: transaction_reference || null,
        p_notes: notes || null,
      }
    );

    if (rpcError) {
      return NextResponse.json(
        { success: false, error: rpcError.message },
        { status: 400 }
      );
    }

    const updatedPayment =
      typeof paymentResult === "string"
        ? JSON.parse(paymentResult)
        : paymentResult;

    return NextResponse.json(
      {
        success: true,
        message:
          "Payment proof uploaded successfully and is awaiting administrator verification. The payment will not be marked as paid until reviewed.",
        data: {
          payment: updatedPayment,
          proof_storage_path: storagePath,
          order_id: order.id,
          payment_status: "awaiting_verification",
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

