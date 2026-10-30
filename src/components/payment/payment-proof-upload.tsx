"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  UploadCloud,
  FileCheck,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  FileText,
  X,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

export interface PaymentProofUploadProps {
  orderId: string;
  onUploadSuccess: () => void;
  isReupload?: boolean;
  onCancelReupload?: () => void;
  className?: string;
}

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export function PaymentProofUpload({
  orderId,
  onUploadSuccess,
  isReupload = false,
  onCancelReupload,
  className,
}: PaymentProofUploadProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [txRef, setTxRef] = useState("");
  const [notes, setNotes] = useState("");

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Validate a single file
  const handleValidateAndSetFile = useCallback(
    (selectedFile: File) => {
      setError(null);

      if (selectedFile.size > MAX_SIZE_BYTES) {
        setError(t("payment.fileTooBig"));
        return false;
      }

      if (!ALLOWED_MIME_TYPES.includes(selectedFile.type)) {
        setError(t("payment.fileInvalidType"));
        return false;
      }

      setFile(selectedFile);
      return true;
    },
    [t]
  );

  // Drag and drop listeners
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleValidateAndSetFile(e.dataTransfer.files[0]);
      }
    },
    [handleValidateAndSetFile]
  );

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleValidateAndSetFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError(t("payment.uploadAreaHint"));
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(15);

    // Simulate progress while waiting for network
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => (prev >= 85 ? prev : prev + 15));
    }, 200);

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

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload payment proof");
      }

      toast.success(t("payment.proofSubmittedSuccess"));

      // Reset local form
      setFile(null);
      setTxRef("");
      setNotes("");

      onUploadSuccess();
    } catch (err: unknown) {
      clearInterval(progressInterval);
      setUploadProgress(0);
      setError(
        err instanceof Error ? err.message : "Error uploading payment proof"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const isPdf = file?.type === "application/pdf";

  return (
    <div
      className={cn(
        "rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-5 text-left",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading text-base font-bold text-foreground flex items-center gap-2">
            <UploadCloud className="size-5 text-[#FF6B35]" />
            <span>
              {isReupload
                ? t("payment.reuploadButton")
                : t("payment.uploadAreaTitle")}
            </span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("payment.uploadFormats")}
          </p>
        </div>

        {isReupload && onCancelReupload && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancelReupload}
            disabled={isUploading}
            className="text-xs"
          >
            {t("payment.cancelReupload")}
          </Button>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 p-3.5 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-xs animate-in fade-in"
        >
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Hidden Native File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
          onChange={onFileInputChange}
          disabled={isUploading}
          className="hidden"
          id="proof-upload-input"
        />

        {/* Drag and Drop Zone or Selected File Preview */}
        {!file ? (
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "relative border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all duration-200 group flex flex-col items-center justify-center gap-3",
              isDragging
                ? "border-[#FF6B35] bg-[#FF6B35]/10 scale-[1.01]"
                : "border-border/80 hover:border-[#FF6B35]/60 bg-muted/10 hover:bg-muted/20"
            )}
          >
            <div
              className={cn(
                "flex size-14 items-center justify-center rounded-2xl transition-all shadow-xs",
                isDragging
                  ? "bg-[#FF6B35] text-white"
                  : "bg-muted text-muted-foreground group-hover:text-[#FF6B35] group-hover:bg-[#FF6B35]/10"
              )}
            >
              <UploadCloud className="size-7" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {isDragging
                  ? t("payment.uploadAreaDragActive")
                  : t("payment.uploadAreaHint")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("payment.uploadFormats")}
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-1 pointer-events-none"
            >
              {t("payment.selectFile")}
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 rounded-2xl border border-border/80 bg-muted/20">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex size-11 items-center justify-center rounded-xl bg-[#FF6B35]/10 text-[#FF6B35] shrink-0">
                {isPdf ? (
                  <FileText className="size-5" />
                ) : (
                  <ImageIcon className="size-5" />
                )}
              </div>

              <div className="min-w-0">
                <p className="font-bold text-xs sm:text-sm text-foreground truncate max-w-xs sm:max-w-md">
                  {file.name}
                </p>
                <p className="text-[11px] text-muted-foreground font-mono">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB · {file.type}
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setFile(null)}
              disabled={isUploading}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground shrink-0"
              title="Remove file"
            >
              <X className="size-4" />
            </Button>
          </div>
        )}

        {/* Progress Bar during upload */}
        {isUploading && (
          <div className="space-y-1.5 pt-1 animate-in fade-in">
            <div className="flex justify-between text-xs font-mono text-muted-foreground">
              <span>{t("payment.submittingProof")}</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
              <div
                className="h-full bg-[#FF6B35] transition-all duration-300 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Transaction Reference Input */}
        <Input
          label={t("payment.txRefLabel")}
          placeholder={t("payment.txRefPlaceholder")}
          value={txRef}
          onChange={(e) => setTxRef(e.target.value)}
          disabled={isUploading}
        />

        {/* Customer Notes */}
        <div className="space-y-1.5">
          <label
            htmlFor="customer-notes-textarea"
            className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {t("payment.notesLabel")}
          </label>
          <textarea
            id="customer-notes-textarea"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("payment.notesPlaceholder")}
            disabled={isUploading}
            className="w-full rounded-2xl border border-border/80 bg-card p-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 focus:outline-none transition-all resize-none shadow-xs"
          />
        </div>

        {/* Notice & Submit Action */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/60">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="size-3.5 text-[#FF6B35] shrink-0" />
            <span>Encrypted private storage bucket</span>
          </div>

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
            className="w-full sm:w-auto font-bold shadow-sm"
          >
            {isUploading ? t("payment.submittingProof") : t("payment.submitProof")}
          </Button>
        </div>
      </form>
    </div>
  );
}

