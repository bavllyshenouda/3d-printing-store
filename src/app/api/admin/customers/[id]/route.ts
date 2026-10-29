import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id: customerId } = await context.params;

    const auth = await requireAdmin(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const { supabase } = auth;

    // Fetch customer profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email, phone, created_at, updated_at")
      .eq("id", customerId)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );
    }

    // Fetch saved addresses
    const { data: addresses } = await supabase
      .from("customer_addresses")
      .select("*")
      .eq("user_id", customerId)
      .order("is_default", { ascending: false });

    // Fetch recent orders
    const { data: orders } = await supabase
      .from("orders")
      .select("id, order_number, status, payment_method, payment_status, total, created_at")
      .eq("user_id", customerId)
      .order("created_at", { ascending: false })
      .limit(10);

    return NextResponse.json(
      {
        success: true,
        data: {
          customer: {
            ...profile,
            addresses: addresses || [],
            recent_orders: orders || [],
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

