import { NextResponse } from "next/server";
import {
  defaultWhatsAppProvider,
  InboundMessageEvent,
} from "@/lib/whatsapp/provider";
import { processInboundWhatsAppMessage } from "@/lib/whatsapp/service";

/**
 * GET: Webhook verification challenge for Meta WhatsApp Business Platform
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expectedToken =
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "whatsapp_verify_token_sample";

  if (mode === "subscribe" && token === expectedToken) {
    return new Response(challenge || "", { status: 200 });
  }

  return NextResponse.json(
    { error: "Webhook verification failed: Invalid verify token" },
    { status: 403 }
  );
}

/**
 * POST: Inbound WhatsApp messages & status updates webhook
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-hub-signature-256");

    // 1. Verify cryptographic HMAC-SHA256 signature
    const isValidSignature = defaultWhatsAppProvider.verifySignature(
      rawBody,
      signature
    );

    if (!isValidSignature) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid webhook signature" },
        { status: 401 }
      );
    }

    // 2. Parse payload safely
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    // 3. Extract inbound messages
    const events: InboundMessageEvent[] =
      defaultWhatsAppProvider.parseInboundPayload(payload);

    // Also support direct simulated/test payloads in Postman: { senderPhone, messageText, providerMessageId }
    if (
      events.length === 0 &&
      typeof payload?.senderPhone === "string" &&
      typeof payload?.messageText === "string"
    ) {
      events.push({
        senderPhone: payload.senderPhone,
        messageText: payload.messageText,
        providerMessageId:
          typeof payload.providerMessageId === "string"
            ? payload.providerMessageId
            : `sim_${Date.now()}`,
        timestamp: new Date().toISOString(),
      });
    }

    const results = [];
    for (const event of events) {
      const result = await processInboundWhatsAppMessage(event);
      results.push(result);
    }

    return NextResponse.json(
      {
        success: true,
        processed_count: events.length,
        results,
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

