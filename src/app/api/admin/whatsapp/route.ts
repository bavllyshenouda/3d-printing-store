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

    const orderId = searchParams.get("order_id");
    const phone = searchParams.get("phone");
    const direction = searchParams.get("direction");
    const messageStatus = searchParams.get("status");
    const messageType = searchParams.get("type");

    let query = supabase
      .from("whatsapp_messages")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (orderId) {
      query = query.eq("order_id", orderId);
    }
    if (phone) {
      query = query.ilike("phone", `%${phone}%`);
    }
    if (direction) {
      query = query.eq("direction", direction);
    }
    if (messageStatus) {
      query = query.eq("message_status", messageStatus);
    }
    if (messageType) {
      query = query.eq("message_type", messageType);
    }

    const { data: messages, count, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch WhatsApp audit logs", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messages: messages || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

