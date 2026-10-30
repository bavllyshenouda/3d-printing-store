"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useTranslation } from "@/lib/i18n/context";
import { AlertTriangle, Loader2, XCircle } from "lucide-react";

export interface OrderCancelModalProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: number;
  onSuccess: () => void;
}

export function OrderCancelModal({
  open,
  onClose,
  orderId,
  orderNumber,
  onSuccess,
}: OrderCancelModalProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: reason.trim() || "Customer requested cancellation",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to cancel order");
      }

      toast.success(t("orders.cancelSuccess"));

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error cancelling order");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => !isSubmitting && onClose()}
      title={t("orders.cancelOrderTitle", { number: orderNumber })}
      maxWidth="md"
    >
      <form onSubmit={handleCancel} className="space-y-4 pt-2">
        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs sm:text-sm">
          <AlertTriangle className="size-5 shrink-0 mt-0.5" />
          <p>{t("orders.cancelOrderDesc")}</p>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-xs"
          >
            <AlertTriangle className="size-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label
            htmlFor="cancel-reason-input"
            className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {t("orders.cancelReasonLabel")}
          </label>
          <textarea
            id="cancel-reason-input"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("orders.cancelReasonPlaceholder")}
            disabled={isSubmitting}
            className="w-full rounded-2xl border border-border/80 bg-card p-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all resize-none shadow-xs"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border/60">
          <Button
            type="button"
            variant="outline"
            size="default"
            disabled={isSubmitting}
            onClick={onClose}
          >
            {t("common.cancel")}
          </Button>

          <Button
            type="submit"
            variant="destructive"
            size="default"
            disabled={isSubmitting}
            iconLeft={
              isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <XCircle className="size-4" />
              )
            }
          >
            {isSubmitting ? t("orders.cancelling") : t("orders.cancelConfirmButton")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
