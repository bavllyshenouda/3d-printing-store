import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/auth/customer";
import { resolveOrderItemImages } from "@/lib/orders/order-item-image";

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
      .from("orders")
      .select(
        `
        id,
        order_number,
        status,
        payment_method,
        payment_status,
        currency,
        subtotal,
        shipping_fee,
        discount_amount,
        total,
        created_at,
        updated_at,
        items:order_items (
          id,
          product_id,
          product_name,
          product_image_url,
          color,
          quantity,
          unit_price,
          line_total
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

    const { data: orders, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    // Resolve line-item images (see /api/orders/[id]) so the orders list thumbnails
    // never pass a raw private Storage path to next/image.
    const ordersWithImages = await Promise.all(
      (orders || []).map(async (order) => ({
        ...order,
        items: await resolveOrderItemImages(supabase, order.items),
      }))
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          orders: ordersWithImages,
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

