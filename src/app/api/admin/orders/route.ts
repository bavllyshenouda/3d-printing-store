import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { sanitizePostgrestFilter } from "@/lib/utils/postgrest";
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
      const sanitized = sanitizePostgrestFilter(search);
      if (sanitized) {
        // If numeric, check order_number
        const numericOrderNumber = parseInt(sanitized, 10);
        if (!isNaN(numericOrderNumber) && String(numericOrderNumber) === sanitized) {
          query = query.or(
            `order_number.eq.${numericOrderNumber},customer_phone.ilike.%${sanitized}%,customer_first_name.ilike.%${sanitized}%,customer_last_name.ilike.%${sanitized}%`
          );
        } else {
          query = query.or(
            `customer_first_name.ilike.%${sanitized}%,customer_last_name.ilike.%${sanitized}%,customer_phone.ilike.%${sanitized}%,customer_email.ilike.%${sanitized}%`
          );
        }
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

