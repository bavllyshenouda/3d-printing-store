import crypto from "crypto";

export interface OutboundMessageParams {
  toPhone: string;
  orderNumber: number | string;
  customerName: string;
  total: number;
  currency?: string;
  paymentMethod: string;
  itemsSummary?: string;
}

export interface InboundMessageEvent {
  senderPhone: string;
  messageText: string;
  providerMessageId: string;
  timestamp: string;
}

export interface WhatsAppSendResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
  mock?: boolean;
}

export interface WhatsAppProvider {
  sendOrderConfirmation(params: OutboundMessageParams): Promise<WhatsAppSendResult>;
  verifySignature(rawBody: string, signatureHeader: string | null): boolean;
  parseInboundPayload(body: unknown): InboundMessageEvent[];
}

export class MetaWhatsAppProvider implements WhatsAppProvider {
  private apiToken = process.env.WHATSAPP_API_TOKEN;
  private phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  private appSecret = process.env.WHATSAPP_APP_SECRET;
  private isMockMode =
    process.env.WHATSAPP_MOCK_MODE === "true" || !this.apiToken || !this.phoneNumberId;

  /**
   * Cryptographically verifies the incoming HMAC-SHA256 signature from Meta webhook.
   */
  verifySignature(rawBody: string, signatureHeader: string | null): boolean {
    if (!signatureHeader) {
      return false;
    }

    if (!this.appSecret) {
      // In development/test mock mode without configured secret, allow testing with mock signature
      return signatureHeader === "sha256=mock_valid_signature";
    }

    const parts = signatureHeader.split("=");
    if (parts.length !== 2 || parts[0] !== "sha256") {
      return false;
    }

    const providedSignature = parts[1];
    const expectedSignature = crypto
      .createHmac("sha256", this.appSecret)
      .update(rawBody, "utf8")
      .digest("hex");

    try {
      return crypto.timingSafeEqual(
        Buffer.from(providedSignature, "hex"),
        Buffer.from(expectedSignature, "hex")
      );
    } catch {
      return false;
    }
  }

  /**
   * Dispatches order confirmation message to customer via WhatsApp Cloud API or simulated mock.
   */
  async sendOrderConfirmation(params: OutboundMessageParams): Promise<WhatsAppSendResult> {
    const formattedPhone = params.toPhone.replace(/[^0-9]/g, "");

    const bodyText =
      `Hello ${params.customerName}! 🛠️\n` +
      `Thank you for your order #${params.orderNumber} with our 3D Printing Store.\n\n` +
      `💰 Total: ${params.total} ${params.currency || "EGP"}\n` +
      `💳 Payment Method: ${params.paymentMethod.toUpperCase()}\n\n` +
      `Please reply:\n` +
      `✅ CONFIRM (or 1) to confirm your order and begin production.\n` +
      `❌ CANCEL (or 2) to cancel this order.`;

    // Simulated / mock delivery if credentials are not configured
    if (this.isMockMode) {
      const mockMessageId = `wamid.mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      return {
        success: true,
        providerMessageId: mockMessageId,
        mock: true,
      };
    }

    try {
      const url = `https://graph.facebook.com/v21.0/${this.phoneNumberId}/messages`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: formattedPhone,
          type: "text",
          text: {
            preview_url: false,
            body: bodyText,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error?.message || `WhatsApp API error: HTTP ${response.status}`,
        };
      }

      const data = await response.json();
      const messageId = data.messages?.[0]?.id || `wamid.${Date.now()}`;

      return {
        success: true,
        providerMessageId: messageId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error contacting WhatsApp API",
      };
    }
  }

  /**
   * Parses incoming webhook payload from WhatsApp Cloud API format.
   */
  parseInboundPayload(body: unknown): InboundMessageEvent[] {
    const events: InboundMessageEvent[] = [];
    const payload = body as Record<string, unknown> | null | undefined;

    // Check Meta webhook structure
    const entries = payload?.entry;
    if (Array.isArray(entries)) {
      for (const entry of entries) {
        for (const change of entry?.changes || []) {
          const messages = change?.value?.messages;
          if (Array.isArray(messages)) {
            for (const msg of messages) {
              if (msg.type === "text" && msg.text?.body) {
                events.push({
                  senderPhone: msg.from,
                  messageText: msg.text.body,
                  providerMessageId: msg.id,
                  timestamp: msg.timestamp || new Date().toISOString(),
                });
              } else if (msg.type === "button" && msg.button?.text) {
                events.push({
                  senderPhone: msg.from,
                  messageText: msg.button.text,
                  providerMessageId: msg.id,
                  timestamp: msg.timestamp || new Date().toISOString(),
                });
              } else if (msg.type === "interactive") {
                const buttonReply = msg.interactive?.button_reply?.title;
                const listReply = msg.interactive?.list_reply?.title;
                if (buttonReply || listReply) {
                  events.push({
                    senderPhone: msg.from,
                    messageText: buttonReply || listReply,
                    providerMessageId: msg.id,
                    timestamp: msg.timestamp || new Date().toISOString(),
                  });
                }
              }
            }
          }
        }
      }
    }

    return events;
  }
}

export const defaultWhatsAppProvider = new MetaWhatsAppProvider();
