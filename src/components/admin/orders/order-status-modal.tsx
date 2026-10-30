"use client";

import React, { useState, useEffect } from "react";
import { Loader2, ArrowRight } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { useTranslation } from "@/lib/i18n/context";
import { VALID_STATUS_TRANSITIONS } from "@/lib/validations/order";

interface OrderStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  order: any;
}

export function OrderStatusModal({
  isOpen,
  onClose,
  onSuccess,
  order,
}: OrderStatusModalProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<string>("");
  const [carrier, setCarrier] = useState<string>("");
  const [trackingNumber, setTrackingNumber] = useState<string>("");
  const [statusNote, setStatusNote] = useState<string>("");

  const currentStatus = order?.status || "pending_customer_confirmation";
  const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];
  const isTerminal = allowedTransitions.length === 0;

  useEffect(() => {
    if (order) {
      setNewStatus(allowedTransitions[0] || currentStatus);
      setPaymentStatus(order.payment_status || "pending");
      setCarrier(order.carrier || "Bosta");
      setTrackingNumber(order.tracking_number || "");
      setStatusNote("");
    }
  }, [order, currentStatus, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    if (newStatus === currentStatus && paymentStatus === order.payment_status) {
      onClose();
      return;
    }

    if (
      (newStatus === "cancelled" || newStatus === "rejected") &&
      !statusNote.trim()
    ) {
      toast.error(
        "Validation error",
        "A note/reason is required when cancelling or rejecting an order."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {};
      if (newStatus && newStatus !== currentStatus) {
        payload.status = newStatus;
      }
      if (paymentStatus && paymentStatus !== order.payment_status) {
        payload.payment_status = paymentStatus;
      }
      if (carrier.trim()) payload.carrier = carrier.trim();
      if (trackingNumber.trim()) payload.tracking_number = trackingNumber.trim();
      if (statusNote.trim()) payload.status_note = statusNote.trim();

      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error("Status update failed", json.error || "Could not update order status");
        return;
      }

      toast.success(
        t("admin.ordersModule.updateSuccess"),
        `Order #${order.order_number} advanced to ${newStatus.replace(/_/g, " ")}`
      );
      onSuccess();
      onClose();
    } catch {
      toast.error("Network Error", "Could not submit status update");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={`${t("admin.ordersModule.updateStatus")} — Order #${order?.order_number || ""}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* State Transition Diagram / Notice */}
        <div className="p-3 rounded-xl bg-muted/60 border border-border text-xs flex items-center justify-between">
          <div>
            <span className="text-muted-foreground block text-[10px] font-mono uppercase">
              {t("admin.ordersModule.currentStatus")}
            </span>
            <span className="font-bold text-foreground font-mono uppercase">
              {currentStatus.replace(/_/g, " ")}
            </span>
          </div>

          {!isTerminal && (
            <ArrowRight className="size-4 text-muted-foreground" />
          )}

          {!isTerminal && (
            <div>
              <span className="text-muted-foreground block text-[10px] font-mono uppercase">
                {t("admin.ordersModule.newStatus")}
              </span>
              <span className="font-bold text-[#FF6B35] font-mono uppercase">
                {newStatus.replace(/_/g, " ")}
              </span>
            </div>
          )}
        </div>

        {isTerminal ? (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
            This order is currently in terminal state ({currentStatus.replace(/_/g, " ")}). No further state transitions are allowed.
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              {t("admin.ordersModule.newStatus")} *
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-[#FF6B35]"
            >
              <option value={currentStatus}>
                {currentStatus.replace(/_/g, " ")} (Keep Current)
              </option>
              {allowedTransitions.map((st) => (
                <option key={st} value={st}>
                  {st.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Payment Status Override */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            {t("admin.ordersModule.paymentStatusFilter")}
          </label>
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-[#FF6B35]"
          >
            <option value="pending">Pending</option>
            <option value="awaiting_verification">Awaiting Verification</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        {/* Carrier & Tracking (Relevant for Shipped / Ready to Ship) */}
        {(newStatus === "ready_to_ship" ||
          newStatus === "shipped" ||
          order?.carrier) && (
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/80">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                {t("admin.ordersModule.carrier")}
              </label>
              <Input
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                placeholder="e.g. Bosta, Aramex, In-House"
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                {t("admin.ordersModule.trackingNumber")}
              </label>
              <Input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g. BST-9921448"
                className="text-xs font-mono"
              />
            </div>
          </div>
        )}

        {/* Status Note */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            {t("admin.ordersModule.statusNote")}
            {(newStatus === "cancelled" || newStatus === "rejected") && " *"}
          </label>
          <Input
            value={statusNote}
            onChange={(e) => setStatusNote(e.target.value)}
            placeholder="Operational memo for shipping log or cancellation reason..."
            className="text-xs"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/80">
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
            disabled={isSubmitting || (isTerminal && paymentStatus === order?.payment_status)}
            className="bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white text-xs"
          >
            {isSubmitting && (
              <Loader2 className="size-3.5 animate-spin me-1.5" />
            )}
            {t("admin.ordersModule.updateStatus")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
