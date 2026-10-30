"use client";

import React, { useState } from "react";
import { MessageSquare, Loader2, Send } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { useTranslation } from "@/lib/i18n/context";

interface SendWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function SendWhatsAppModal({
  isOpen,
  onClose,
  onSuccess,
}: SendWhatsAppModalProps) {
  const { t } = useTranslation();
  const [orderId, setOrderId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) {
      toast.error("Validation error", "Order ID is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId.trim(),
          message_type: "order_confirmation",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error("Send failed", json.error || "Failed to dispatch WhatsApp message");
        return;
      }

      toast.success(
        t("admin.whatsappModule.sendSuccess"),
        "Order confirmation template dispatched to customer."
      );
      setOrderId("");
      onSuccess();
      onClose();
    } catch {
      toast.error("Network Error", "Could not connect to WhatsApp gateway");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={t("admin.whatsappModule.sendMessage")}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Dispatches an official order confirmation WhatsApp template to the customer&apos;s registered Egyptian mobile number with authoritative totals and tracking.
        </p>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            {t("admin.whatsappModule.orderId")} *
          </label>
          <Input
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
            required
            className="text-xs font-mono"
          />
        </div>

        <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs space-y-1">
          <span className="font-semibold text-foreground block">
            Template: Order Confirmation (Arabic/English)
          </span>
          <span className="text-[11px] text-muted-foreground block font-mono">
            Provider: Meta Cloud API / Mock Sandbox Provider
          </span>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/80">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs shadow-sm"
          >
            {isSubmitting ? (
              <Loader2 className="size-3.5 animate-spin me-1.5" />
            ) : (
              <Send className="size-3.5 me-1.5" />
            )}
            {isSubmitting
              ? t("admin.whatsappModule.sending")
              : "Dispatch Message"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
