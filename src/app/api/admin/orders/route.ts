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
    const paymentStatus = searchParams.get("payment_status");
    const paymentMethod = searchParams.get("payment_method");
    const search = searchParams.get("search")?.trim();

    let query = supabase
      .from("orders")
      .select(
        `
        *,
        items:order_items (
          id,
          product_id,
          product_name,
          color,
          quantity,
          unit_price,
          line_total
        )
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }
    if (paymentStatus) {
      query = query.eq("payment_status", paymentStatus);
    }
    if (paymentMethod) {
      query = query.eq("payment_method", paymentMethod);
    }

    if (search) {
      // If numeric, check order_number
      const numericOrderNumber = parseInt(search, 10);
      if (!isNaN(numericOrderNumber)) {
        query = query.or(
          `order_number.eq.${numericOrderNumber},customer_phone.ilike.%${search}%,customer_first_name.ilike.%${search}%,customer_last_name.ilike.%${search}%`
        );
      } else {
        query = query.or(
          `customer_first_name.ilike.%${search}%,customer_last_name.ilike.%${search}%,customer_phone.ilike.%${search}%,customer_email.ilike.%${search}%`
        );
      }
    }

    const { data: orders, error, count } = await query;

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
          orders: orders || [],
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

