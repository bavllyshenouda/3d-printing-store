import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/auth/customer";
import { requireAdmin } from "@/lib/auth/admin";

interface RouteContext {
  params: Promise<{ id: string; fileId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id: requestId, fileId } = await context.params;

    // Resolve admin FIRST (see api/custom-prints/[id]/route.ts). Checking
    // requireCustomer first would leave isAdmin = false for admins, causing the
    // ownership check below to reject them with 403 and break file preview/download.
    const adminAuth = await requireAdmin(request);
    const isAdmin = adminAuth.authorized;
    const auth = isAdmin ? adminAuth : await requireCustomer(request);

    if (!auth.authorized) {
      return auth.response;
    }

    const { user, supabase } = auth;

    // Verify request ownership
    const { data: printRequest, error: requestError } = await supabase
      .from("custom_print_requests")
      .select("id, user_id")
      .eq("id", requestId)
      .maybeSingle();

    if (requestError || !printRequest) {
      return NextResponse.json(
        { success: false, error: "Custom print request not found" },
        { status: 404 }
      );
    }

    if (!isAdmin && printRequest.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Access denied. You do not own this request" },
        { status: 403 }
      );
    }

    // Retrieve file record
    const { data: fileRecord, error: fileError } = await supabase
      .from("custom_print_files")
      .select("id, storage_path, original_filename, mime_type")
      .eq("id", fileId)
      .eq("request_id", requestId)
      .maybeSingle();

    if (fileError || !fileRecord) {
      return NextResponse.json(
        { success: false, error: "File not found" },
        { status: 404 }
      );
    }

    // Generate short-lived signed preview URL (15 minutes = 900s)
    const { data: signedData, error: signError } = await supabase.storage
      .from("custom-print-files")
      .createSignedUrl(fileRecord.storage_path, 900);

    if (signError || !signedData) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to generate preview URL: ${signError?.message || "Unknown error"}`,
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
          original_filename: fileRecord.original_filename,
          mime_type: fileRecord.mime_type,
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

