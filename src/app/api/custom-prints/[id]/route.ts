import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/auth/customer";
import { requireAdmin } from "@/lib/auth/admin";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id: requestId } = await context.params;

    // Resolve admin FIRST. An admin is also an authenticated user, so calling
    // requireCustomer first would succeed and leave isAdmin = false, which scopes
    // the query below to the admin's own user_id and makes every customer request
    // return 404 ("Request Not Found"). Admins must be able to read any request.
    const adminAuth = await requireAdmin(request);
    const isAdmin = adminAuth.authorized;
    const auth = isAdmin ? adminAuth : await requireCustomer(request);

    if (!auth.authorized) {
      return auth.response;
    }

    const { user, supabase } = auth;

    let query = supabase
      .from("custom_print_requests")
      .select(
        `
        *,
        profile:profiles (
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        files:custom_print_files (
          id,
          storage_path,
          original_filename,
          mime_type,
          file_size_bytes,
          created_at
        ),
        quotes:custom_print_quotes (
          id,
          version,
          description,
          material,
          color,
          quantity,
          unit_price,
          total_price,
          estimated_days,
          status,
          valid_until,
          sent_at,
          responded_at,
          created_at
        )
      `
      )
      .eq("id", requestId);

    if (!isAdmin) {
      query = query.eq("user_id", user.id);
    }

    const { data: requestRecord, error } = await query.maybeSingle();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (!requestRecord) {
      return NextResponse.json(
        { success: false, error: "Custom print request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: { request: requestRecord },
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

