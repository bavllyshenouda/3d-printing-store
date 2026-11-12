import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { parsePaginationParams } from "@/lib/utils/pagination";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const { supabase } = auth;
    const { searchParams } = new URL(request.url);

    const { page, limit, offset } = parsePaginationParams(searchParams, {
      defaultPage: 1,
      defaultLimit: 20,
      maxLimit: 100,
    });
    const status = searchParams.get("status");

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
          responded_at
        )
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    const { data: requests, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json(
      {
        success: true,
        data: {
          requests: requests || [],
          pagination: {
            page,
            limit,
            total_items: totalCount,
            total_pages: totalPages,
            has_next_page: page < totalPages,
            has_prev_page: page > 1,
          },
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

