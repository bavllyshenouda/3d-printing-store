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
    const search = searchParams.get("search")?.trim();

    let query = supabase
      .from("profiles")
      .select("id, first_name, last_name, email, phone, created_at, updated_at", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
      );
    }

    const { data: profiles, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Enrich with order statistics for each customer
    const customerIds = (profiles || []).map((p) => p.id);
    let ordersByCustomer: Record<string, { count: number; total_spent: number }> = {};

    if (customerIds.length > 0) {
      const { data: customerOrders } = await supabase
        .from("orders")
        .select("user_id, total, status")
        .in("user_id", customerIds)
        .neq("status", "cancelled");

      if (customerOrders) {
        customerOrders.forEach((o) => {
          if (o.user_id) {
            if (!ordersByCustomer[o.user_id]) {
              ordersByCustomer[o.user_id] = { count: 0, total_spent: 0 };
            }
            ordersByCustomer[o.user_id].count += 1;
            ordersByCustomer[o.user_id].total_spent += Number(o.total || 0);
          }
        });
      }
    }

    const sanitizedCustomers = (profiles || []).map((profile) => ({
      id: profile.id,
      first_name: profile.first_name,
      last_name: profile.last_name,
      email: profile.email,
      phone: profile.phone,
      order_count: ordersByCustomer[profile.id]?.count || 0,
      total_spent: Number((ordersByCustomer[profile.id]?.total_spent || 0).toFixed(2)),
      created_at: profile.created_at,
    }));

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json(
      {
        success: true,
        data: {
          customers: sanitizedCustomers,
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

