import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/auth/customer";
import { createCustomPrintRequestSchema } from "@/lib/validations/custom-print";

export async function GET(request: Request) {
  try {
    const auth = await requireCustomer(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const { user, supabase } = auth;
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const offset = (page - 1) * limit;
    const status = searchParams.get("status");

    let query = supabase
      .from("custom_print_requests")
      .select(
        `
        *,
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
      .eq("user_id", user.id)
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

export async function POST(request: Request) {
  try {
    const auth = await requireCustomer(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const { user, supabase } = auth;
    const body = await request.json();

    const parseResult = createCustomPrintRequestSchema.safeParse(body);
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

    const data = parseResult.data;

    // Insert request record
    const { data: newRequest, error: insertError } = await supabase
      .from("custom_print_requests")
      .insert({
        user_id: user.id,
        title: data.title || null,
        description: data.description,
        quantity: data.quantity,
        preferred_material: data.preferred_material || null,
        preferred_color: data.preferred_color || null,
        reference_url: data.reference_url || null,
        customer_notes: data.customer_notes || null,
        status: "submitted",
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Custom print request created successfully. You can now attach 3D model files (STL/3MF) or reference images.",
        data: { request: newRequest },
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

