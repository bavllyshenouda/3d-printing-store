import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { Database } from "@/types/database";
import {
  adminUpdateOrderStatusSchema,
  isValidStatusTransition,
} from "@/lib/validations/order";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const auth = await requireAdmin(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const { supabase } = auth;

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
          line_total,
          created_at
        ),
        shipping_events:shipping_events (
          id,
          status,
          carrier,
          tracking_number,
          description,
          event_time,
          created_at
        )
      `
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Sort shipping events chronologically
    const shippingEvents = Array.isArray(order.shipping_events)
      ? [...order.shipping_events].sort(
          (a, b) => new Date(a.event_time).getTime() - new Date(b.event_time).getTime()
        )
      : [];

    return NextResponse.json(
      {
        success: true,
        data: {
          order: {
            ...order,
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

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const auth = await requireAdmin(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const { supabase } = auth;
    const body = await request.json();

    const parseResult = adminUpdateOrderStatusSchema.safeParse(body);
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

    const { status, payment_status, carrier, tracking_number, status_note } =
      parseResult.data;

    // Fetch current order to check current status and state transition
    const { data: currentOrder, error: fetchError } = await supabase
      .from("orders")
      .select("id, status, payment_status, order_number")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !currentOrder) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // 1. Enforce valid state transition if status is being updated
    if (status && status !== currentOrder.status) {
      if (!isValidStatusTransition(currentOrder.status, status)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid status transition from '${currentOrder.status}' to '${status}'. Terminal or invalid states cannot be transitioned.`,
          },
          { status: 400 }
        );
      }

      // If transitioning to cancelled or rejected, execute cancellation RPC to restore inventory
      if (status === "cancelled" || status === "rejected") {
        const { error: cancelError } = await supabase.rpc(
          "cancel_order_and_restore_stock",
          {
            p_order_id: id,
            p_reason: status_note || `Administrator marked order as ${status}`,
          }
        );

        if (cancelError) {
          return NextResponse.json(
            { success: false, error: cancelError.message },
            { status: 400 }
          );
        }
      }
    }

    // 2. Prepare update payload
    const now = new Date().toISOString();
    const updatePayload: Database["public"]["Tables"]["orders"]["Update"] = {
      updated_at: now,
    };

    if (status) {
      updatePayload.status = status;
      if (status === "confirmed" && !currentOrder.status) {
        updatePayload.confirmed_at = now;
      }
      if (status === "cancelled") {
        updatePayload.cancelled_at = now;
      }
    }

    if (payment_status) {
      updatePayload.payment_status = payment_status;
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    // 3. Insert shipping event if status or tracking updated
    if (status || tracking_number || carrier) {
      await supabase.from("shipping_events").insert({
        order_id: id,
        status: status || currentOrder.status,
        carrier: carrier || null,
        tracking_number: tracking_number || null,
        description:
          status_note ||
          `Order status updated to ${status || currentOrder.status}${
            tracking_number ? ` with tracking ${tracking_number}` : ""
          }.`,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Order updated successfully",
        data: { order: updatedOrder },
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
