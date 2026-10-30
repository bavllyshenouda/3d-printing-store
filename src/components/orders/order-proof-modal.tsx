"use client";

import React, { useState, useRef } from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useTranslation } from "@/lib/i18n/context";
import {
  UploadCloud,
  FileCheck,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  X,
} from "lucide-react";

export interface OrderProofModalProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
  paymentMethod: string;
  total: number;
  currency: string;
  onSuccess: () => void;
}

export function OrderProofModal({
  open,
  onClose,
  orderId,
  paymentMethod,
  total,
  currency,
  onSuccess,
}: OrderProofModalProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [txRef, setTxRef] = useState("");
  const [notes, setNotes] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > 5 * 1024 * 1024) {
      setError("File exceeds 5MB size limit.");
      return;
    }

    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(selected.type)) {
      setError("Invalid file type. Please upload a JPG, PNG, WEBP, or PDF.");
      return;
    }

    setError(null);
    setFile(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a proof file to upload.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (txRef.trim()) {
        formData.append("transaction_reference", txRef.trim());
      }
      if (notes.trim()) {
        formData.append("notes", notes.trim());
      }

      const res = await fetch(`/api/orders/${orderId}/payment/proof`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload payment proof");
      }

      toast.success(t("orders.proofSubmittedSuccess"));

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error uploading payment proof");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => !isUploading && onClose()}
      title={t("orders.uploadProofModalTitle")}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t("orders.uploadProofModalDesc")}
        </p>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-xs"
          >
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Upload Zone */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            {t("orders.fileLabel")}
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={handleFileChange}
            className="hidden"
            id="proof-file-input"
          />

          {file ? (
            <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border/80 bg-muted/20">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-10 items-center justify-center rounded-xl bg-[#FF6B35]/10 text-[#FF6B35] shrink-0">
                  <ImageIcon className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs sm:text-sm text-foreground truncate">
                    {file.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setFile(null)}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </Button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border/80 hover:border-[#FF6B35]/70 rounded-2xl p-6 text-center cursor-pointer transition-colors group bg-card hover:bg-muted/10"
            >
              <UploadCloud className="size-8 text-muted-foreground group-hover:text-[#FF6B35] mx-auto transition-colors" />
              <p className="text-xs font-semibold text-foreground mt-2">
                Click to browse or drop transfer screenshot
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                PNG, JPG, WEBP, or PDF up to 5MB
              </p>
            </div>
          )}
        </div>

        {/* Transaction Reference / Sender Phone */}
        <Input
          label={t("orders.txRefLabel")}
          placeholder={t("orders.txRefPlaceholder")}
          value={txRef}
          onChange={(e) => setTxRef(e.target.value)}
          disabled={isUploading}
        />

        {/* Additional Notes */}
        <Input
          label={t("orders.notesLabel")}
          placeholder={t("orders.notesPlaceholder")}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isUploading}
        />

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border/60">
          <Button
            type="button"
            variant="outline"
            size="default"
            disabled={isUploading}
            onClick={onClose}
          >
            {t("common.cancel")}
          </Button>

          <Button
            type="submit"
            variant="default"
            size="default"
            disabled={isUploading || !file}
            iconLeft={
              isUploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FileCheck className="size-4" />
              )
            }
          >
            {isUploading ? t("orders.submittingProof") : t("orders.submitProof")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
