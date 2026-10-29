import { createClient } from "@/lib/supabase/server";
import { defaultWhatsAppProvider, InboundMessageEvent } from "@/lib/whatsapp/provider";

export async function sendOrderConfirmationWhatsApp(orderId: string) {
  const supabase = await createClient();

  // 1. Fetch order details
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(
      "id, order_number, customer_first_name, customer_last_name, customer_phone, total, currency, payment_method, status"
    )
    .eq("id", orderId)
    .maybeSingle();

  if (orderError || !order) {
    return { success: false, error: "Order not found" };
  }

  // 2. Idempotency check: prevent duplicate confirmation messages for the same order
  const { data: existingMessage } = await supabase
    .from("whatsapp_messages")
    .select("id, provider_message_id, message_status")
    .eq("order_id", orderId)
    .eq("direction", "outbound")
    .eq("message_type", "order_confirmation")
    .maybeSingle();

  if (existingMessage) {
    return {
      success: true,
      already_sent: true,
      message_id: existingMessage.id,
      provider_message_id: existingMessage.provider_message_id,
    };
  }

  // 3. Dispatch message via provider abstraction
  const sendResult = await defaultWhatsAppProvider.sendOrderConfirmation({
    toPhone: order.customer_phone,
    orderNumber: order.order_number,
    customerName: order.customer_first_name,
    total: Number(order.total),
    currency: order.currency,
    paymentMethod: order.payment_method,
  });

  const bodyText = `Order #${order.order_number} confirmation request sent to ${order.customer_phone}`;

  // 4. Log message in whatsapp_messages table
  const { data: messageRecord, error: insertError } = await supabase
    .from("whatsapp_messages")
    .insert({
      order_id: order.id,
      phone: order.customer_phone,
      direction: "outbound",
      message_type: "order_confirmation",
      provider_message_id: sendResult.providerMessageId || null,
      message_status: sendResult.success ? "sent" : "failed",
      message_body: bodyText,
    })
    .select()
    .single();

  if (insertError) {
    return {
      success: sendResult.success,
      warning: "Message dispatched but database record failed to insert",
      error: insertError.message,
    };
  }

  return {
    success: sendResult.success,
    message: messageRecord,
    mock: sendResult.mock,
    provider_message_id: sendResult.providerMessageId,
  };
}

export async function processInboundWhatsAppMessage(event: InboundMessageEvent) {
  const supabase = await createClient();

  // 1. Idempotency check: verify this provider_message_id was not already processed
  if (event.providerMessageId) {
    const { data: existing } = await supabase
      .from("whatsapp_messages")
      .select("id")
      .eq("provider_message_id", event.providerMessageId)
      .maybeSingle();

    if (existing) {
      return { status: "already_processed", message_id: existing.id };
    }
  }

  // 2. Parse text and intent
  const text = event.messageText.trim().toLowerCase();
  const rawSender = event.senderPhone.replace(/[^0-9]/g, "");

  // Normalize Egyptian phone variants: 201xxxxxxxxx or 01xxxxxxxxx
  let normalizedPhone = rawSender;
  if (rawSender.startsWith("201") && rawSender.length === 12) {
    normalizedPhone = "0" + rawSender.substring(2);
  }

  // Check for explicit order number in the text (e.g. "CONFIRM 100001" or "#100001")
  const orderNumberMatch = text.match(/#?(\d{5,8})/);
  const explicitOrderNumber = orderNumberMatch ? parseInt(orderNumberMatch[1], 10) : null;

  // Classify intent
  const isConfirm =
    text.includes("confirm") ||
    text.includes("yes") ||
    text.includes("ok") ||
    text.includes("approve") ||
    text === "1" ||
    text.includes("تأكيد") ||
    text.includes("موافق") ||
    text.includes("نعم");

  const isCancel =
    text.includes("cancel") ||
    text.includes("no") ||
    text.includes("reject") ||
    text === "2" ||
    text.includes("إلغاء") ||
    text.includes("رفض") ||
    text.includes("لا");

  // 3. Locate pending order(s) for this customer
  let orderQuery = supabase
    .from("orders")
    .select("id, order_number, user_id, status, payment_status, customer_phone")
    .eq("status", "pending_customer_confirmation");

  if (explicitOrderNumber) {
    orderQuery = orderQuery.eq("order_number", explicitOrderNumber);
  } else {
    // Search by both phone formats
    orderQuery = orderQuery.or(
      `customer_phone.eq.${normalizedPhone},customer_phone.eq.${rawSender}`
    );
  }

  const { data: candidateOrders } = await orderQuery.order("created_at", { ascending: false });

  // Handle ambiguous multiple orders when no explicit order number is provided
  if (!explicitOrderNumber && candidateOrders && candidateOrders.length > 1) {
    await supabase.from("whatsapp_messages").insert({
      phone: event.senderPhone,
      direction: "inbound",
      message_type: "customer_reply",
      provider_message_id: event.providerMessageId || null,
      message_status: "received",
      received_reply: event.messageText,
      processed_at: new Date().toISOString(),
    });

    return {
      status: "ambiguous_orders",
      message: `Multiple pending orders found for this sender (${candidateOrders.length}). Explicit order number required.`,
    };
  }

  const targetOrder = candidateOrders?.[0] || null;

  if (!targetOrder) {
    // Unmatched order or unsupported message
    await supabase.from("whatsapp_messages").insert({
      phone: event.senderPhone,
      direction: "inbound",
      message_type: "customer_reply",
      provider_message_id: event.providerMessageId || null,
      message_status: "received",
      received_reply: event.messageText,
      processed_at: new Date().toISOString(),
    });

    return {
      status: "no_matching_order",
      message: "No pending order found matching this customer phone number or order reference.",
    };
  }

  // 4. Execute state transition
  const now = new Date().toISOString();
  let actionResult = "unrecognized_command";

  if (isConfirm) {
    // Transition to confirmed. Never mark payment as paid!
    await supabase
      .from("orders")
      .update({
        status: "confirmed",
        customer_confirmation_at: now,
        confirmed_at: now,
        updated_at: now,
      })
      .eq("id", targetOrder.id);

    await supabase.from("shipping_events").insert({
      order_id: targetOrder.id,
      status: "confirmed",
      description: `Order confirmed by customer via WhatsApp (From: ${event.senderPhone}).`,
    });

    actionResult = "order_confirmed";
  } else if (isCancel) {
    // Restore inventory and cancel order via RPC
    await supabase.rpc("cancel_order_and_restore_stock", {
      p_order_id: targetOrder.id,
      p_reason: `Cancelled by customer via WhatsApp (From: ${event.senderPhone})`,
    });

    actionResult = "order_cancelled";
  }

  // 5. Record inbound message
  const { data: recordedMessage } = await supabase
    .from("whatsapp_messages")
    .insert({
      order_id: targetOrder.id,
      phone: event.senderPhone,
      direction: "inbound",
      message_type: "customer_reply",
      provider_message_id: event.providerMessageId || null,
      message_status: "received",
      received_reply: event.messageText,
      processed_at: now,
    })
    .select()
    .single();

  return {
    status: actionResult,
    order_id: targetOrder.id,
    order_number: targetOrder.order_number,
    message: recordedMessage,
  };
}

