"use client";

import React, { useState, useEffect } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useTranslation } from "@/lib/i18n/context";

interface RejectRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  request: any;
}

export function RejectRequestModal({
  isOpen,
  onClose,
  onSuccess,
  request,
}: RejectRequestModalProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reason, setReason] = useState("");

  // Reset the form every time the modal is opened for a (possibly) different request
  useEffect(() => {
    if (isOpen) {
      setReason("");
      setIsSubmitting(false);
    }
  }, [isOpen, request]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request || isSubmitting) return;

    const trimmed = reason.trim();
    if (trimmed.length < 3) {
      toast.error(
        t("admin.customPrintsModule.rejectModalTitle"),
        t("admin.customPrintsModule.rejectReasonLabel")
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/custom-prints/${request.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: trimmed }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(
          t("admin.customPrintsModule.rejectModalTitle"),
          json.error || "Could not reject request"
        );
        return;
      }

      toast.success(
        t("admin.customPrintsModule.rejectSuccess"),
        request?.title || ""
      );
      onSuccess();
      onClose();
    } catch {
      toast.error("Network Error", "Failed to connect to the rejection service");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={`${t("admin.customPrintsModule.rejectModalTitle")} — ${
        request?.title || ""
      }`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Warning banner */}
        <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="size-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">
            {t("admin.customPrintsModule.rejectModalDesc")}
          </p>
        </div>

        {/* Reason */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            {t("admin.customPrintsModule.rejectReasonLabel")} *
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            required
            autoFocus
            placeholder={t("admin.customPrintsModule.rejectReasonPlaceholder")}
            className="w-full p-3 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-red-500 resize-y"
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
            {t("admin.customPrintsModule.cancel")}
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting || reason.trim().length < 3}
            className="bg-red-600 hover:bg-red-600/90 text-white text-xs"
          >
            {isSubmitting && <Loader2 className="size-3.5 animate-spin me-1.5" />}
            {isSubmitting
              ? t("admin.customPrintsModule.rejecting")
              : t("admin.customPrintsModule.rejectConfirm")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
