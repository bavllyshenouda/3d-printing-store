"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  FileText,
  ExternalLink,
  Download,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { useTranslation } from "@/lib/i18n/context";

interface PaymentReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  payment: any;
}

export function PaymentReviewModal({
  isOpen,
  onClose,
  onSuccess,
  payment,
}: PaymentReviewModalProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [transactionRef, setTransactionRef] = useState(
    payment?.transaction_reference || ""
  );

  const proofUrl = payment?.proof_file_url || payment?.proof_url;
  const isPdf = proofUrl?.toLowerCase().includes(".pdf");

  const handleReview = async (action: "approve" | "reject") => {
    if (!payment) return;

    if (action === "reject" && rejectionReason.trim().length < 3) {
      toast.error(
        "Validation error",
        t("admin.paymentsModule.rejectionReasonMin") ||
          "Rejection reason must be at least 3 characters."
      );
      return;
    }

    setIsSubmitting(true);
    setActionType(action);
    try {
      const payload: any = {
        action,
        transaction_reference: transactionRef.trim() || undefined,
        notes: action === "reject" ? rejectionReason.trim() : undefined,
      };

      const res = await fetch(`/api/admin/payments/${payment.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error("Review failed", json.error || "Could not review payment");
        return;
      }

      toast.success(
        action === "approve" ? "Payment Approved" : "Payment Rejected",
        `Order #${payment.order?.order_number} payment status updated.`
      );
      onSuccess();
      onClose();
    } catch {
      toast.error("Network Error", "Failed to connect to payment service");
    } finally {
      setIsSubmitting(false);
      setActionType(null);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={`${t("admin.paymentsModule.proofPreview")} — Order #${payment?.order?.order_number || ""}`}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Payment Summary Info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-muted/40 border border-border text-xs">
          <div>
            <span className="text-[10px] font-mono text-muted-foreground uppercase block">
              Method
            </span>
            <span className="font-bold text-foreground font-mono uppercase">
              {payment?.payment_method}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-mono text-muted-foreground uppercase block">
              Authoritative Total
            </span>
            <span className="font-bold text-[#FF6B35] font-mono">
              {payment?.amount} EGP
            </span>
          </div>

          <div>
            <span className="text-[10px] font-mono text-muted-foreground uppercase block">
              Customer
            </span>
            <span className="font-bold text-foreground truncate block">
              {payment?.order?.customer_first_name}{" "}
              {payment?.order?.customer_last_name}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-mono text-muted-foreground uppercase block">
              Current Status
            </span>
            <span className="font-mono font-bold text-amber-600 dark:text-amber-400 uppercase">
              {payment?.status?.replace(/_/g, " ")}
            </span>
          </div>
        </div>

        {/* Proof Document Inspection */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground block">
            {t("admin.paymentsModule.proofPreview")}
          </label>

          {proofUrl ? (
            <div className="rounded-2xl border border-border bg-background p-2 overflow-hidden flex flex-col items-center justify-center min-h-[260px] max-h-[380px] relative">
              {isPdf ? (
                <div className="p-8 text-center space-y-3">
                  <FileText className="size-12 text-[#FF6B35] mx-auto" />
                  <p className="text-xs text-muted-foreground">
                    Uploaded proof is a PDF document.
                  </p>
                  <Button asChild variant="outline" size="sm" className="text-xs">
                    <a href={proofUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="size-3.5 me-1.5" />
                      Open Full PDF in New Tab
                    </a>
                  </Button>
                </div>
              ) : (
                <div className="relative w-full h-[280px] flex items-center justify-center bg-black/5 rounded-xl overflow-hidden">
                  <img
                    src={proofUrl}
                    alt="Payment Proof Receipt"
                    className="max-h-full max-w-full object-contain"
                  />
                  <a
                    href={proofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors"
                    title="Open full image in new tab"
                  >
                    <ExternalLink className="size-4" />
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl border border-dashed border-border bg-muted/20 text-muted-foreground text-xs">
              <AlertTriangle className="size-6 mx-auto mb-1.5 text-amber-500" />
              {t("admin.paymentsModule.noProofUploaded")}
            </div>
          )}
        </div>

        {/* Transaction Reference & Rejection Reason Input */}
        <div className="space-y-3 pt-2 border-t border-border/80">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              {t("admin.paymentsModule.transactionRef")}
            </label>
            <Input
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              placeholder="e.g. TXN-8821948 or bank reference code"
              className="text-xs font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              {t("admin.paymentsModule.rejectionReason")}
            </label>
            <Input
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder={t("admin.paymentsModule.rejectionReasonPlaceholder")}
              className="text-xs"
            />
          </div>
        </div>

        {/* Footer Decision Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border/80">
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

          <div className="flex items-center gap-2">
            {/* Reject Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={() => handleReview("reject")}
              className="border-red-500/30 text-red-600 hover:bg-red-500/10 text-xs"
            >
              {isSubmitting && actionType === "reject" ? (
                <Loader2 className="size-3.5 animate-spin me-1.5" />
              ) : (
                <XCircle className="size-3.5 me-1.5" />
              )}
              {t("admin.paymentsModule.rejectPayment")}
            </Button>

            {/* Approve Button */}
            <Button
              type="button"
              size="sm"
              disabled={isSubmitting}
              onClick={() => handleReview("approve")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs shadow-sm"
            >
              {isSubmitting && actionType === "approve" ? (
                <Loader2 className="size-3.5 animate-spin me-1.5" />
              ) : (
                <CheckCircle2 className="size-3.5 me-1.5" />
              )}
              {t("admin.paymentsModule.approvePayment")}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
