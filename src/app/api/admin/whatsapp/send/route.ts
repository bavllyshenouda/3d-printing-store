import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { sendOrderConfirmationWhatsApp } from "@/lib/whatsapp/service";

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) {
      return auth.response;
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { order_id, message_type = "order_confirmation" } = body;

    if (!order_id || typeof order_id !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing or invalid order_id" },
        { status: 400 }
      );
    }

    if (message_type !== "order_confirmation") {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported message_type: '${message_type}'. Currently supported: 'order_confirmation'`,
        },
        { status: 400 }
      );
    }

    const result = await sendOrderConfirmationWhatsApp(order_id);

    if (!result.success) {
      const status = result.error === "Order not found" ? 404 : 500;
      return NextResponse.json(
        { success: false, error: result.error, warning: result.warning },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

