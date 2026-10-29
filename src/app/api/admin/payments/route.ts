import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const { supabase } = auth;
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const offset = (page - 1) * limit;

    const status = searchParams.get("status");
    const paymentMethod = searchParams.get("payment_method");

    let query = supabase
      .from("payments")
      .select(
        `
        *,
        order:orders (
          id,
          order_number,
          status,
          payment_method,
          payment_status,
          total,
          customer_first_name,
          customer_last_name,
          customer_phone,
          customer_email
        )
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    if (paymentMethod) {
      query = query.eq("payment_method", paymentMethod);
    }

    const { data: payments, error, count } = await query;

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
          payments: payments || [],
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

