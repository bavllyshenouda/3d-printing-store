import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { defaultWhatsAppProvider, InboundMessageEvent } from "@/lib/whatsapp/provider";

/**
 * Normalizes Egyptian mobile numbers for uniform comparison.
 * Maps between national (01xxxxxxxxx) and international (201xxxxxxxxx).
 */
export function normalizeEgyptianPhone(phone: string): { national: string; international: string } {
  const digits = phone.replace(/[^0-9]/g, "");
  let national = digits;
  let international = digits;

  if (digits.startsWith("20") && digits.length === 12 && digits[2] === "1") {
    // 201012345678 -> national 01012345678
    national = "0" + digits.substring(2);
    international = digits;
  } else if (digits.startsWith("01") && digits.length === 11) {
    // 01012345678 -> international 201012345678
    national = digits;
    international = "20" + digits.substring(1);
  } else if (digits.startsWith("1") && digits.length === 10) {
    // 1012345678
    national = "0" + digits;
    international = "20" + digits;
  }

  return { national, international };
}

/**
 * Checks whether two Egyptian phone numbers are equivalent under national or international format.
 */
export function phoneMatches(phoneA: string, phoneB: string): boolean {
  if (!phoneA || !phoneB) return false;
  const a = normalizeEgyptianPhone(phoneA);
  const b = normalizeEgyptianPhone(phoneB);
  return (
    a.national === b.national ||
    a.international === b.international ||
    a.national === b.international ||
    a.international === b.national
  );
}

const CONFIRM_KEYWORDS = new Set(["1", "confirm", "yes", "تأكيد", "تاكيد", "موافق", "نعم"]);
const CANCEL_KEYWORDS = new Set(["2", "cancel", "no", "إلغاء", "الغاء", "رفض", "لا"]);
const ORDER_TOKEN_REGEX = /^#?(\d{5,8})$/;

/**
 * Parses user message into strict intent ("confirm" | "cancel" | "unrecognized")
 * and extracts an optional standalone 5-8 digit order number token.
 */
export function parseWhatsAppIntent(text: string): {
  intent: "confirm" | "cancel" | "unrecognized";
  orderNumber: number | null;
} {
  if (!text || typeof text !== "string") {
    return { intent: "unrecognized", orderNumber: null };
  }

  const trimmed = text.trim().toLowerCase();
  const tokens = trimmed.split(/\s+/).filter(Boolean);

  let intent: "confirm" | "cancel" | "unrecognized" = "unrecognized";
  let orderNumber: number | null = null;

  if (tokens.length === 1) {
    const t = tokens[0];
    if (CONFIRM_KEYWORDS.has(t)) {
      intent = "confirm";
    } else if (CANCEL_KEYWORDS.has(t)) {
      intent = "cancel";
    }
  } else if (tokens.length === 2) {
    const [t1, t2] = tokens;
    if (CONFIRM_KEYWORDS.has(t1) && ORDER_TOKEN_REGEX.test(t2)) {
      intent = "confirm";
      orderNumber = parseInt(t2.replace("#", ""), 10);
    } else if (CANCEL_KEYWORDS.has(t1) && ORDER_TOKEN_REGEX.test(t2)) {
      intent = "cancel";
      orderNumber = parseInt(t2.replace("#", ""), 10);
    } else if (ORDER_TOKEN_REGEX.test(t1) && CONFIRM_KEYWORDS.has(t2)) {
      intent = "confirm";
      orderNumber = parseInt(t1.replace("#", ""), 10);
    } else if (ORDER_TOKEN_REGEX.test(t1) && CANCEL_KEYWORDS.has(t2)) {
      intent = "cancel";
      orderNumber = parseInt(t1.replace("#", ""), 10);
    }
  }

  return { intent, orderNumber };
}

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
  // Only treat an existing outbound row as "already sent" when its status is not "failed".
  const { data: existingMessage } = await supabase
    .from("whatsapp_messages")
    .select("id, provider_message_id, message_status")
    .eq("order_id", orderId)
    .eq("direction", "outbound")
    .eq("message_type", "order_confirmation")
    .neq("message_status", "failed")
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

  if (!sendResult.success) {
    console.warn(
      `WhatsApp order confirmation failed to send for order #${order.order_number}: ${sendResult.error || "Missing configuration or dispatch failure"}. Recording message as failed.`
    );
  }

  const bodyText = `Order #${order.order_number} confirmation request sent to ${order.customer_phone}`;

  // 4. Log message in whatsapp_messages table
  // TODO(db): Add unique index on whatsapp_messages.provider_message_id to enforce database-level deduplication.
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
    if (
      insertError.code === "23505" ||
      insertError.message.includes("unique") ||
      insertError.message.includes("duplicate key")
    ) {
      return {
        success: true,
        already_processed: true,
        provider_message_id: sendResult.providerMessageId,
      };
    }

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
  // Use server-only admin client for webhook execution with no user session
  const supabase = createAdminClient();

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

  // 2. Strict Intent & Order Number Parsing
  const { intent, orderNumber: explicitOrderNumber } = parseWhatsAppIntent(event.messageText);

  // If unrecognized intent, record inbound message and exit without any order state changes
  if (intent === "unrecognized") {
    // TODO(db): Add unique index on whatsapp_messages.provider_message_id to enforce database-level deduplication.
    const { error: insertErr } = await supabase.from("whatsapp_messages").insert({
      phone: event.senderPhone,
      direction: "inbound",
      message_type: "customer_reply",
      provider_message_id: event.providerMessageId || null,
      message_status: "received",
      received_reply: event.messageText,
      processed_at: new Date().toISOString(),
    });

    if (
      insertErr &&
      (insertErr.code === "23505" ||
        insertErr.message.includes("unique") ||
        insertErr.message.includes("duplicate key"))
    ) {
      return { status: "already_processed" };
    }

    return {
      status: "unrecognized",
      reply_type: "unrecognized",
      message: "Unrecognized message intent. No state changes applied.",
    };
  }

  // 3. Locate Target Order with Strict Ownership Verification
  let targetOrder: {
    id: string;
    order_number: number;
    user_id: string | null;
    status: string;
    payment_status: string;
    customer_phone: string;
  } | null = null;

  // 3a. Prefer mapping reply to order through context.id (reply to our outbound message)
  if (event.contextMessageId) {
    const { data: contextOutbound } = await supabase
      .from("whatsapp_messages")
      .select("order_id")
      .eq("provider_message_id", event.contextMessageId)
      .eq("direction", "outbound")
      .maybeSingle();

    if (contextOutbound?.order_id) {
      const { data: contextOrder } = await supabase
        .from("orders")
        .select("id, order_number, user_id, status, payment_status, customer_phone")
        .eq("id", contextOutbound.order_id)
        .maybeSingle();

      if (contextOrder && phoneMatches(event.senderPhone, contextOrder.customer_phone)) {
        targetOrder = contextOrder;
      }
    }
  }

  // 3b. If explicit order number was provided in the text ("confirm 100001"), find and enforce ownership
  if (!targetOrder && explicitOrderNumber) {
    const { data: orderCandidate } = await supabase
      .from("orders")
      .select("id, order_number, user_id, status, payment_status, customer_phone")
      .eq("order_number", explicitOrderNumber)
      .maybeSingle();

    if (orderCandidate) {
      if (phoneMatches(event.senderPhone, orderCandidate.customer_phone)) {
        targetOrder = orderCandidate;
      } else {
        // Sender phone does NOT match order's customer_phone! Fail safe: do not alter order!
        console.warn(
          `WhatsApp unauthorized attempt: sender ${event.senderPhone} does not match order owner ${orderCandidate.customer_phone} for order #${explicitOrderNumber}`
        );

        // TODO(db): Add unique index on whatsapp_messages.provider_message_id to enforce database-level deduplication.
        const { error: insertErr } = await supabase.from("whatsapp_messages").insert({
          phone: event.senderPhone,
          direction: "inbound",
          message_type: "customer_reply",
          provider_message_id: event.providerMessageId || null,
          message_status: "received",
          received_reply: event.messageText,
          processed_at: new Date().toISOString(),
        });

        if (
          insertErr &&
          (insertErr.code === "23505" ||
            insertErr.message.includes("unique") ||
            insertErr.message.includes("duplicate key"))
        ) {
          return { status: "already_processed" };
        }

        return {
          status: "unauthorized",
          message: "Sender phone does not match order customer phone. No state changes applied.",
        };
      }
    }
  }

  // 3c. If no explicit order number and no context match, search pending orders by sender phone
  if (!targetOrder && !explicitOrderNumber) {
    const { national, international } = normalizeEgyptianPhone(event.senderPhone);

    const { data: candidateOrders } = await supabase
      .from("orders")
      .select("id, order_number, user_id, status, payment_status, customer_phone")
      .eq("status", "pending_customer_confirmation")
      .or(`customer_phone.eq.${national},customer_phone.eq.${international},customer_phone.eq.${event.senderPhone}`)
      .order("created_at", { ascending: false });

    // Handle ambiguous multiple orders when no explicit order number is provided
    if (candidateOrders && candidateOrders.length > 1) {
      // TODO(db): Add unique index on whatsapp_messages.provider_message_id to enforce database-level deduplication.
      const { error: insertErr } = await supabase.from("whatsapp_messages").insert({
        phone: event.senderPhone,
        direction: "inbound",
        message_type: "customer_reply",
        provider_message_id: event.providerMessageId || null,
        message_status: "received",
        received_reply: event.messageText,
        processed_at: new Date().toISOString(),
      });

      if (
        insertErr &&
        (insertErr.code === "23505" ||
          insertErr.message.includes("unique") ||
          insertErr.message.includes("duplicate key"))
      ) {
        return { status: "already_processed" };
      }

      return {
        status: "ambiguous_orders",
        message: `Multiple pending orders found for this sender (${candidateOrders.length}). Explicit order number required.`,
      };
    }

    if (candidateOrders && candidateOrders.length === 1) {
      if (phoneMatches(event.senderPhone, candidateOrders[0].customer_phone)) {
        targetOrder = candidateOrders[0];
      }
    }
  }

  if (!targetOrder) {
    // Unmatched order or unsupported message
    // TODO(db): Add unique index on whatsapp_messages.provider_message_id to enforce database-level deduplication.
    const { error: insertErr } = await supabase.from("whatsapp_messages").insert({
      phone: event.senderPhone,
      direction: "inbound",
      message_type: "customer_reply",
      provider_message_id: event.providerMessageId || null,
      message_status: "received",
      received_reply: event.messageText,
      processed_at: new Date().toISOString(),
    });

    if (
      insertErr &&
      (insertErr.code === "23505" ||
        insertErr.message.includes("unique") ||
        insertErr.message.includes("duplicate key"))
    ) {
      return { status: "already_processed" };
    }

    return {
      status: "no_matching_order",
      message: "No pending order found matching this customer phone number or order reference.",
    };
  }

  // 4. Execute State Transition
  const now = new Date().toISOString();
  let actionResult = "unrecognized_command";

  if (intent === "confirm") {
    // Only transition orders whose status is still pending_customer_confirmation
    const { data: updatedOrders, error: updateError } = await supabase
      .from("orders")
      .update({
        status: "confirmed",
        customer_confirmation_at: now,
        confirmed_at: now,
        updated_at: now,
      })
      .eq("id", targetOrder.id)
      .eq("status", "pending_customer_confirmation")
      .select("id");

    if (updateError) {
      console.error("Failed to update order status to confirmed:", updateError);
      return { status: "error", error: updateError.message };
    }

    if (!updatedOrders || updatedOrders.length === 0) {
      actionResult = "order_no_longer_pending";
    } else {
      const { error: shippingEventError } = await supabase.from("shipping_events").insert({
        order_id: targetOrder.id,
        status: "confirmed",
        description: `Order confirmed by customer via WhatsApp (From: ${event.senderPhone}).`,
      });

      if (shippingEventError) {
        console.error("Failed to create shipping event for confirmed order:", shippingEventError);
      }

      actionResult = "order_confirmed";
    }
  } else if (intent === "cancel") {
    // Only cancel if still pending_customer_confirmation
    if (targetOrder.status !== "pending_customer_confirmation") {
      actionResult = "order_no_longer_pending";
    } else {
      const { error: cancelError } = await supabase.rpc("cancel_order_and_restore_stock", {
        p_order_id: targetOrder.id,
        p_reason: `Cancelled by customer via WhatsApp (From: ${event.senderPhone})`,
      });

      if (cancelError) {
        console.error("Failed to cancel order via RPC:", cancelError);
        return { status: "error", error: cancelError.message };
      }

      actionResult = "order_cancelled";
    }
  }

  // 5. Record inbound message with graceful unique violation handling
  // TODO(db): Add unique index on whatsapp_messages.provider_message_id to enforce database-level deduplication.
  const { data: recordedMessage, error: insertError } = await supabase
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
    .maybeSingle();

  if (insertError) {
    if (
      insertError.code === "23505" ||
      insertError.message.includes("unique") ||
      insertError.message.includes("duplicate key")
    ) {
      return {
        status: "already_processed",
        order_id: targetOrder.id,
        order_number: targetOrder.order_number,
      };
    }

    console.error("Failed to record inbound WhatsApp message:", insertError);
  }

  return {
    status: actionResult,
    order_id: targetOrder.id,
    order_number: targetOrder.order_number,
    message: recordedMessage,
  };
}

