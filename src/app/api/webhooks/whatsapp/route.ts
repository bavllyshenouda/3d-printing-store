import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  defaultWhatsAppProvider,
  InboundMessageEvent,
} from "@/lib/whatsapp/provider";
import { processInboundWhatsAppMessage } from "@/lib/whatsapp/service";

let hasLoggedMissingConfig = false;

function checkWebhookConfig(): boolean {
  const isDevMock =
    process.env.NODE_ENV === "development" &&
    process.env.WHATSAPP_MOCK_MODE === "true";

  if (isDevMock) {
    return true;
  }

  if (!process.env.WHATSAPP_APP_SECRET || !process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    if (!hasLoggedMissingConfig) {
      console.error(
        "WhatsApp Webhook configuration error: WHATSAPP_APP_SECRET or WHATSAPP_WEBHOOK_VERIFY_TOKEN is missing."
      );
      hasLoggedMissingConfig = true;
    }
    return false;
  }

  return true;
}

/**
 * GET: Webhook verification challenge for Meta WhatsApp Business Platform
 */
export async function GET(request: Request) {
  if (!checkWebhookConfig()) {
    return NextResponse.json(
      { error: "Service Unavailable: WhatsApp webhook is not configured" },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expectedToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && token && expectedToken) {
    const tokenBuf = Buffer.from(token);
    const expectedBuf = Buffer.from(expectedToken);
    if (
      tokenBuf.length === expectedBuf.length &&
      crypto.timingSafeEqual(tokenBuf, expectedBuf)
    ) {
      return new Response(challenge || "", { status: 200 });
    }
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
  if (!checkWebhookConfig()) {
    return NextResponse.json(
      { error: "Service Unavailable: WhatsApp webhook is not configured" },
      { status: 503 }
    );
  }

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

    // Simulated test payloads only allowed in dev + mock mode
    const isDevMock =
      process.env.NODE_ENV === "development" &&
      process.env.WHATSAPP_MOCK_MODE === "true";

    if (
      isDevMock &&
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
        contextMessageId:
          typeof payload.contextMessageId === "string"
            ? payload.contextMessageId
            : undefined,
      });
    }

    // Always return 200 quickly for valid-signature payloads even if one event fails (log the error)
    const supabase = createAdminClient();
    const results = [];
    for (const event of events) {
      try {
        if (event.providerMessageId) {
          const { data: alreadyProcessed } = await supabase
            .from("whatsapp_messages")
            .select("id")
            .eq("provider_message_id", event.providerMessageId)
            .maybeSingle();

          if (alreadyProcessed) {
            results.push({
              status: "already_processed",
              message_id: alreadyProcessed.id,
            });
            continue;
          }
        }

        const result = await processInboundWhatsAppMessage(event);
        results.push(result);
      } catch (eventErr) {
        console.error("Error processing inbound WhatsApp message event:", eventErr);
        results.push({
          status: "error",
          error: eventErr instanceof Error ? eventErr.message : "Internal processing error",
        });
      }
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
    console.error("WhatsApp webhook unexpected fatal error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}

