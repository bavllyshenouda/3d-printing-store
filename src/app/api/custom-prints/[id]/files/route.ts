import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/auth/customer";
import { validateCustomPrintFile } from "@/lib/validations/custom-print";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id: requestId } = await context.params;

    // 1. Authenticate customer
    const auth = await requireCustomer(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const { user, supabase } = auth;

    // 2. Verify request exists, belongs to user, and is in 'submitted' status
    const { data: printRequest, error: fetchError } = await supabase
      .from("custom_print_requests")
      .select("id, user_id, status")
      .eq("id", requestId)
      .maybeSingle();

    if (fetchError || !printRequest) {
      return NextResponse.json(
        { success: false, error: "Custom print request not found" },
        { status: 404 }
      );
    }

    if (printRequest.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Access denied. You do not own this request" },
        { status: 403 }
      );
    }

    // According to Storage & Table RLS, files can only be attached while status is 'submitted'
    if (printRequest.status !== "submitted") {
      return NextResponse.json(
        {
          success: false,
          error: `Files can only be attached to requests in 'submitted' status. Current status is '${printRequest.status}'.`,
        },
        { status: 400 }
      );
    }

    // 3. Parse and validate file upload from multipart/form-data
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "A 3D model (STL/3MF) or reference image file is required" },
        { status: 400 }
      );
    }

    const fileValidation = validateCustomPrintFile(file);
    if (!fileValidation.valid) {
      return NextResponse.json(
        { success: false, error: fileValidation.error },
        { status: 400 }
      );
    }

    // 4. Construct secure storage path matching storage RLS policy:
    // (storage.foldername(name))[1] = user_id AND (storage.foldername(name))[2] = request_id
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const timestamp = Date.now();
    const storagePath = `${user.id}/${printRequest.id}/${timestamp}-${sanitizedFileName}`;

    // Read buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // 5. Upload to private custom-print-files bucket
    const { error: uploadError } = await supabase.storage
      .from("custom-print-files")
      .upload(storagePath, fileBuffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
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

    // 6. Insert metadata record in custom_print_files
    const { data: fileRecord, error: insertError } = await supabase
      .from("custom_print_files")
      .insert({
        request_id: printRequest.id,
        storage_path: storagePath,
        original_filename: file.name,
        mime_type: file.type || null,
        file_size_bytes: file.size,
      })
      .select()
      .single();

    if (insertError) {
      // Clean up uploaded file if metadata insert failed
      await supabase.storage.from("custom-print-files").remove([storagePath]);

      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Design file attached successfully",
        data: { file: fileRecord },
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

