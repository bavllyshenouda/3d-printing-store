import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/auth/customer";
import { resolveOrderItemImages } from "@/lib/orders/order-item-image";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const auth = await requireCustomer(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const { user, supabase } = auth;

    // Retrieve order scoped strictly to user_id = user.id
    const { data: order, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        items:order_items (
          id,
          product_id,
          product_name,
          product_image_url,
          color,
          quantity,
          unit_price,
          line_total
        ),
        shipping_events:shipping_events (
          id,
          status,
          carrier,
          tracking_number,
          description,
          event_time
        )
      `
      )
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: "Order not found",
        },
        { status: 404 }
      );
    }

    // Sort shipping events chronologically
    const shippingEvents = Array.isArray(order.shipping_events)
      ? [...order.shipping_events].sort(
          (a, b) => new Date(a.event_time).getTime() - new Date(b.event_time).getTime()
        )
      : [];

    // Resolve line-item images so next/image never receives a raw Storage path:
    // absolute URLs pass through, private custom-print paths become short-lived
    // signed URLs, and invalid/missing values fall back to null.
    const items = await resolveOrderItemImages(supabase, order.items);

    return NextResponse.json(
      {
        success: true,
        data: {
          order: {
            ...order,
            items,
            shipping_events: shippingEvents,
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

