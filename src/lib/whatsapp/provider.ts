import crypto from "crypto";

export interface OutboundMessageParams {
  toPhone: string;
  orderNumber: number | string;
  customerName: string;
  total: number;
  currency?: string;
  paymentMethod: string;
  itemsSummary?: string;
  language?: "ar" | "en";
}

export interface InboundMessageEvent {
  senderPhone: string;
  messageText: string;
  providerMessageId: string;
  timestamp: string;
  contextMessageId?: string;
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

/**
 * Normalizes Egyptian mobile numbers to international format (201xxxxxxxxx).
 * Handles: 01xxxxxxxxx -> 201xxxxxxxxx, +201xxxxxxxxx -> 201xxxxxxxxx, 1xxxxxxxxx -> 201xxxxxxxxx.
 */
export function formatToInternationalEgyptPhone(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.startsWith("01") && digits.length === 11) {
    return "20" + digits.substring(1);
  }
  if (digits.startsWith("1") && digits.length === 10) {
    return "20" + digits;
  }
  if (digits.startsWith("201") && digits.length === 12) {
    return digits;
  }
  return digits;
}

export class MetaWhatsAppProvider implements WhatsAppProvider {
  private apiToken = process.env.WHATSAPP_API_TOKEN;
  private phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  private appSecret = process.env.WHATSAPP_APP_SECRET;

  private get isMockMode(): boolean {
    return (
      process.env.NODE_ENV === "development" &&
      process.env.WHATSAPP_MOCK_MODE === "true"
    );
  }

  /**
   * Cryptographically verifies the incoming HMAC-SHA256 signature from Meta webhook.
   * Uses timingSafeEqual and fails closed in production.
   */
  verifySignature(rawBody: string, signatureHeader: string | null): boolean {
    const isDevMock =
      process.env.NODE_ENV === "development" &&
      process.env.WHATSAPP_MOCK_MODE === "true";

    if (!this.appSecret) {
      // Allow signature bypass strictly in development + mock mode
      return isDevMock;
    }

    if (!signatureHeader) {
      return false;
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
      const providedBuf = Buffer.from(providedSignature, "hex");
      const expectedBuf = Buffer.from(expectedSignature, "hex");
      return (
        providedBuf.length === expectedBuf.length &&
        crypto.timingSafeEqual(providedBuf, expectedBuf)
      );
    } catch {
      return false;
    }
  }

  /**
   * Dispatches order confirmation message to customer via WhatsApp Cloud API or simulated mock.
   */
  async sendOrderConfirmation(params: OutboundMessageParams): Promise<WhatsAppSendResult> {
    const formattedPhone = formatToInternationalEgyptPhone(params.toPhone);

    const bodyText =
      `Hello ${params.customerName}! 🛠️\n` +
      `Thank you for your order #${params.orderNumber} with our 3D Printing Store.\n\n` +
      `💰 Total: ${params.total} ${params.currency || "EGP"}\n` +
      `💳 Payment Method: ${params.paymentMethod.toUpperCase()}\n\n` +
      `Please reply:\n` +
      `✅ CONFIRM (or 1) to confirm your order and begin production.\n` +
      `❌ CANCEL (or 2) to cancel this order.`;

    // Simulated / mock delivery strictly for development mode with WHATSAPP_MOCK_MODE=true
    if (this.isMockMode) {
      const mockMessageId = `wamid.mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      return {
        success: true,
        providerMessageId: mockMessageId,
        mock: true,
      };
    }

    if (!this.apiToken || !this.phoneNumberId) {
      console.warn(
        "WhatsApp configuration missing in production: WHATSAPP_API_TOKEN or WHATSAPP_PHONE_NUMBER_ID is not configured. Message delivery failed."
      );
      return {
        success: false,
        error: "Missing required WhatsApp API credentials in production",
      };
    }

    try {
      const url = `https://graph.facebook.com/v21.0/${this.phoneNumberId}/messages`;
      const templateName = process.env.WHATSAPP_TEMPLATE_NAME;
      const langCode =
        params.language === "ar" || params.language === "en"
          ? params.language
          : process.env.WHATSAPP_TEMPLATE_LANG === "en"
          ? "en"
          : "ar";

      // Support sending an approved template message, falling back to text only in mock mode
      let payloadBody: Record<string, unknown>;

      if (templateName) {
        payloadBody = {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: formattedPhone,
          type: "template",
          template: {
            name: templateName,
            language: {
              code: langCode,
            },
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: String(params.customerName) },
                  { type: "text", text: String(params.orderNumber) },
                  { type: "text", text: `${params.total} ${params.currency || "EGP"}` },
                  { type: "text", text: params.paymentMethod.toUpperCase() },
                ],
              },
            ],
          },
        };
      } else {
        payloadBody = {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: formattedPhone,
          type: "text",
          text: {
            preview_url: false,
            body: bodyText,
          },
        };
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payloadBody),
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
              const contextMessageId =
                typeof msg.context?.id === "string" ? msg.context.id : undefined;

              if (msg.type === "text" && msg.text?.body) {
                events.push({
                  senderPhone: msg.from,
                  messageText: msg.text.body,
                  providerMessageId: msg.id,
                  timestamp: msg.timestamp || new Date().toISOString(),
                  contextMessageId,
                });
              } else if (msg.type === "button" && msg.button?.text) {
                events.push({
                  senderPhone: msg.from,
                  messageText: msg.button.text,
                  providerMessageId: msg.id,
                  timestamp: msg.timestamp || new Date().toISOString(),
                  contextMessageId,
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
                    contextMessageId,
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
