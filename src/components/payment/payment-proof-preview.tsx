"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  FileText,
  ExternalLink,
  Eye,
  RefreshCw,
  AlertCircle,
  FileCheck,
  Download,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

export interface PaymentProofPreviewProps {
  orderId: string;
  onStartReupload?: () => void;
  canReupload?: boolean;
  className?: string;
}

export function PaymentProofPreview({
  orderId,
  onStartReupload,
  canReupload = true,
  className,
}: PaymentProofPreviewProps) {
  const { t } = useTranslation();

  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Zoom modal state
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchProofUrl = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/orders/${orderId}/payment/proof-url`);
        const data = await res.json();

        if (!isMounted) return;

        if (!res.ok || !data.success || !data.data?.signed_url) {
          throw new Error(data.error || "No proof available");
        }

        setSignedUrl(data.data.signed_url);
        setFilePath(data.data.proof_storage_path || null);
      } catch (err: unknown) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Error loading preview");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchProofUrl();

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  if (isLoading) {
    return (
      <div className={cn("rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-3", className)}>
        <Skeleton className="h-5 w-40 rounded-lg" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !signedUrl) {
    return null; // Or empty if no proof uploaded yet
  }

  const isPdf =
    filePath?.toLowerCase().endsWith(".pdf") ||
    signedUrl.toLowerCase().includes(".pdf");

  return (
    <div
      className={cn(
        "rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-4 text-left",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileCheck className="size-5 text-emerald-500" />
          <h3 className="font-heading text-base font-bold text-foreground">
            {t("payment.previewTitle")}
          </h3>
        </div>

        {canReupload && onStartReupload && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onStartReupload}
            iconLeft={<RefreshCw className="size-3.5" />}
            className="text-xs"
          >
            {t("payment.reuploadButton")}
          </Button>
        )}
      </div>

      {/* Preview Surface */}
      {isPdf ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-border/80 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 shrink-0">
              <FileText className="size-6" />
            </div>
            <div>
              <p className="font-bold text-sm text-foreground">
                Official PDF Receipt
              </p>
              <p className="text-xs text-muted-foreground">
                Encrypted bank statement or transfer voucher
              </p>
            </div>
          </div>

          <a
            href={signedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block"
          >
            <Button
              type="button"
              variant="default"
              size="sm"
              iconRight={<ExternalLink className="size-3.5" />}
              className="font-semibold shadow-xs"
            >
              {t("payment.viewFullFile")}
            </Button>
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          <div
            onClick={() => setIsZoomOpen(true)}
            className="relative h-64 sm:h-72 w-full rounded-2xl overflow-hidden border border-border/80 bg-muted/40 cursor-pointer group"
          >
            <Image
              src={signedUrl}
              alt="Payment receipt preview"
              fill
              sizes="(max-width: 768px) 100vw, 600px"
              className="object-contain transition-transform duration-300 group-hover:scale-[1.02]"
            />

            {/* Hover overlay hint */}
            <div className="absolute inset-0 bg-[#111318]/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-semibold">
              <Eye className="size-4" />
              <span>Click to view full size</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Signed URL valid for 15 minutes</span>
            <a
              href={signedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#FF6B35] hover:underline flex items-center gap-1 font-medium"
            >
              <span>{t("payment.viewFullFile")}</span>
              <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      )}

      {/* Zoom Modal for Image */}
      {!isPdf && (
        <Modal
          open={isZoomOpen}
          onClose={() => setIsZoomOpen(false)}
          title={t("payment.previewTitle")}
          maxWidth="2xl"
        >
          <div className="relative h-[65vh] w-full bg-muted/30 rounded-2xl overflow-hidden">
            <Image
              src={signedUrl}
              alt="Payment receipt full preview"
              fill
              sizes="1000px"
              className="object-contain"
            />
          </div>
        </Modal>
      )}
    </div>
  );
}

