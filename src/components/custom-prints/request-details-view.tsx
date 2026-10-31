"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/container";
import { STLViewer } from "./stl-viewer";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { AddressCard } from "@/components/addresses/address-card";
import { AddressFormModal } from "@/components/addresses/address-form-modal";
import { toast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth/context";
import { useTranslation } from "@/lib/i18n/context";
import { getShippingFee } from "@/lib/constants/governorates";
import {
  ArrowLeft,
  ArrowRight,
  Box,
  FileCode,
  ImageIcon,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  CreditCard,
  Banknote,
  Smartphone,
  Wallet,
  ExternalLink,
  Loader2,
  Sparkles,
  MapPin,
  ShieldCheck,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  CustomPrintRequest,
  CustomPrintFile,
  CustomPrintQuote,
  CustomerAddress,
} from "@/types/database";

export interface DetailedCustomPrint extends CustomPrintRequest {
  files: CustomPrintFile[];
  quotes: CustomPrintQuote[];
}

export interface RequestDetailsViewProps {
  requestId: string;
}

export function RequestDetailsView({ requestId }: RequestDetailsViewProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, locale, isRTL } = useTranslation();

  const [request, setRequest] = useState<DetailedCustomPrint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // File preview modal state
  const [previewFile, setPreviewFile] = useState<{
    file: CustomPrintFile;
    signedUrl: string;
  } | null>(null);
  const [loadingPreviewId, setLoadingPreviewId] = useState<string | null>(null);

  // Quote Accept modal state
  const [acceptingQuote, setAcceptingQuote] = useState<CustomPrintQuote | null>(null);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<CustomerAddress | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "instapay" | "vodafone_cash" | "online">("cod");
  const [isSubmittingAccept, setIsSubmittingAccept] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  // Quote Reject modal state
  const [rejectingQuote, setRejectingQuote] = useState<CustomPrintQuote | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  // Protect route
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace(`/auth/login?redirect=/custom-prints/${requestId}`);
    }
  }, [authLoading, isAuthenticated, router, requestId]);

  const fetchRequestDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/custom-prints/${requestId}`);
      const data = await res.json();

      if (!res.ok || !data.success || !data.data?.request) {
        throw new Error(data.error || "Custom print request not found");
      }

      setRequest(data.data.request);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Error loading request details"
      );
    } finally {
      setIsLoading(false);
    }
  }, [requestId]);

  // Load addresses when user opens accept modal
  const fetchAddresses = useCallback(async () => {
    try {
      const res = await fetch("/api/addresses");
      const data = await res.json();
      if (res.ok && data.success) {
        const list: CustomerAddress[] = data.data.addresses || [];
        setAddresses(list);
        if (list.length > 0 && !selectedAddress) {
          const defaultAddr = list.find((a) => a.is_default) || list[0];
          setSelectedAddress(defaultAddr);
        }
      }
    } catch {
      // Ignore
    }
  }, [selectedAddress]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchRequestDetails();
    }
  }, [isAuthenticated, fetchRequestDetails]);

  // Handle File Preview Click (Generates Authorized Signed URL)
  const handlePreviewFile = async (f: CustomPrintFile) => {
    setLoadingPreviewId(f.id);
    try {
      const res = await fetch(
        `/api/custom-prints/${requestId}/files/${f.id}/preview-url`
      );
      const data = await res.json();

      if (!res.ok || !data.success || !data.data?.signed_url) {
        throw new Error(data.error || "Failed to load preview URL");
      }

      setPreviewFile({
        file: f,
        signedUrl: data.data.signed_url,
      });
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Error generating preview"
      );
    } finally {
      setLoadingPreviewId(null);
    }
  };

  // Handle Quote Acceptance
  const handleConfirmAcceptQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptingQuote || !selectedAddress) return;

    setIsSubmittingAccept(true);
    try {
      const shippingFee = getShippingFee(selectedAddress.governorate);

      const payload = {
        address_id: selectedAddress.id,
        payment_method: paymentMethod,
        shipping_fee: shippingFee,
      };

      const res = await fetch(
        `/api/custom-prints/${requestId}/quotes/${acceptingQuote.id}/accept`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to accept quote");
      }

      toast.success(t("customPrintApp.acceptSuccess"));

      const orderId = data.data?.order_id || data.data?.order?.id;
      if (orderId) {
        router.push(`/orders/${orderId}`);
      } else {
        fetchRequestDetails();
        setAcceptingQuote(null);
      }
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to accept quote"
      );
    } finally {
      setIsSubmittingAccept(false);
    }
  };

  // Handle Quote Rejection
  const handleConfirmRejectQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingQuote || rejectReason.trim().length < 3) return;

    setIsSubmittingReject(true);
    try {
      const res = await fetch(
        `/api/custom-prints/${requestId}/quotes/${rejectingQuote.id}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: rejectReason.trim() }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to decline quote");
      }

      toast.success(t("customPrintApp.rejectSuccess"));
      setRejectingQuote(null);
      setRejectReason("");
      fetchRequestDetails();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to decline quote"
      );
    } finally {
      setIsSubmittingReject(false);
    }
  };

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  if (isLoading) {
    return (
      <div className="py-12 bg-background min-h-[75vh]">
        <Container size="lg">
          <Skeleton className="h-6 w-32 mb-6 rounded-lg" />
          <Skeleton className="h-32 w-full rounded-3xl mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <Skeleton className="lg:col-span-8 h-96 rounded-3xl" />
            <Skeleton className="lg:col-span-4 h-96 rounded-3xl" />
          </div>
        </Container>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="py-16 bg-background min-h-[75vh]">
        <Container size="sm">
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-center space-y-4">
            <AlertCircle className="size-8 text-red-500 mx-auto" />
            <h2 className="font-heading text-lg font-bold text-red-600 dark:text-red-400">
              {error || "Request not found"}
            </h2>
            <Link href="/custom-prints/my-requests">
              <Button variant="outline" size="default">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  const formattedDate = new Date(request.created_at).toLocaleDateString(
    locale === "ar" ? "ar-EG" : "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );

  const files = request.files || [];
  const quotes = request.quotes || [];

  return (
    <div className="py-8 sm:py-12 bg-background min-h-[85vh]">
      <Container size="lg">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/custom-prints/my-requests"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group"
          >
            <BackIcon className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>{t("customPrintApp.dashboardTitle")}</span>
          </Link>
        </div>

        {/* Top Header Card */}
        <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 mb-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 text-start">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-heading text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                {request.title || `Custom Project #${request.id.slice(0, 8)}`}
              </h1>
              <Badge
                variant="outline"
                className="text-xs py-0.5 px-2.5 font-bold uppercase bg-[#FF6B35]/10 text-[#FF6B35] border-[#FF6B35]/30"
              >
                {request.status.replace("_", " ")}
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="size-3.5" />
              <span>Submitted {formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Rejection banner: shown only when the studio rejected this request */}
        {request.status === "rejected" && (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 sm:p-7 mb-8 flex items-start gap-4 text-start">
            <AlertCircle className="size-6 text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h2 className="font-heading text-base sm:text-lg font-bold text-red-600 dark:text-red-400">
                {t("customPrintApp.rejectedBannerTitle")}
              </h2>
              <p className="text-xs sm:text-sm text-foreground/80">
                {t("customPrintApp.rejectedBannerDesc")}
              </p>
              {request.rejection_reason && (
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                    {t("customPrintApp.rejectionReasonLabel")}
                  </span>
                  <p className="text-xs sm:text-sm text-foreground/90 whitespace-pre-line leading-relaxed bg-background/60 p-3 rounded-2xl border border-red-500/20">
                    {request.rejection_reason}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2-Column Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-start">
          {/* Left Column (8 cols): Description, Files, and Quotes */}
          <div className="lg:col-span-8 space-y-8">
            {/* Description & Specs Card */}
            <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
              <h2 className="font-heading text-base sm:text-lg font-bold text-foreground">
                Project Scope & Specifications
              </h2>

              <p className="text-xs sm:text-sm text-foreground/90 whitespace-pre-line leading-relaxed bg-muted/20 p-4 rounded-2xl border border-border/50">
                {request.description}
              </p>

              {request.customer_notes && (
                <div className="space-y-1 pt-2">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                    Special Notes
                  </span>
                  <p className="text-xs text-muted-foreground italic">
                    &ldquo;{request.customer_notes}&rdquo;
                  </p>
                </div>
              )}
            </div>

            {/* Attached Files Section */}
            <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
              <h2 className="font-heading text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                <Box className="size-5 text-[#FF6B35]" />
                <span>
                  {t("customPrintApp.attachedFiles")} ({files.length})
                </span>
              </h2>

              {files.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No CAD files or reference images attached.
                </p>
              ) : (
                <div className="divide-y divide-border/60 rounded-2xl border border-border/80 overflow-hidden">
                  {files.map((f) => {
                    const isStl = f.original_filename
                      .toLowerCase()
                      .endsWith(".stl");
                    const is3mf = f.original_filename
                      .toLowerCase()
                      .endsWith(".3mf");
                    const isImg =
                      (f.mime_type && f.mime_type.startsWith("image/")) ||
                      /\.(png|jpe?g|webp)$/i.test(f.original_filename);

                    return (
                      <div
                        key={f.id}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={cn(
                              "flex size-10 items-center justify-center rounded-xl shrink-0 shadow-xs",
                              isStl
                                ? "bg-[#FF6B35]/10 text-[#FF6B35]"
                                : is3mf
                                ? "bg-indigo-500/10 text-indigo-500"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {isStl ? (
                              <Box className="size-5" />
                            ) : is3mf ? (
                              <FileCode className="size-5" />
                            ) : (
                              <ImageIcon className="size-5" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="font-bold text-foreground truncate max-w-xs sm:max-w-md">
                              {f.original_filename}
                            </p>
                            <p className="text-[11px] text-muted-foreground font-mono">
                              {((f.file_size_bytes || 0) / (1024 * 1024)).toFixed(2)} MB
                              {isStl && " · 3D Mesh"}
                              {is3mf && " · 3MF Slicing Model"}
                              {isImg && " · Visual Reference"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                          {isStl && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={loadingPreviewId === f.id}
                              onClick={() => handlePreviewFile(f)}
                              className="text-xs font-semibold text-[#FF6B35] border-[#FF6B35]/30 hover:bg-[#FF6B35]/10"
                              iconLeft={
                                loadingPreviewId === f.id ? (
                                  <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                  <Box className="size-3.5" />
                                )
                              }
                            >
                              {t("customPrintApp.previewSTL")}
                            </Button>
                          )}

                          {isImg && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={loadingPreviewId === f.id}
                              onClick={() => handlePreviewFile(f)}
                              className="text-xs font-semibold"
                              iconLeft={
                                loadingPreviewId === f.id ? (
                                  <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                  <ImageIcon className="size-3.5" />
                                )
                              }
                            >
                              {t("customPrintApp.previewImage")}
                            </Button>
                          )}

                          {is3mf && (
                            <Badge
                              variant="outline"
                              className="text-[10px] py-0 px-2 font-mono text-indigo-500 border-indigo-500/30"
                            >
                              Native 3MF
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Studio Quotes Section */}
            <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="size-5 text-[#FF6B35]" />
                  <span>
                    {t("customPrintApp.quotesTitle")} ({quotes.length})
                  </span>
                </h2>
              </div>

              {quotes.length === 0 ? (
                <div className="p-8 rounded-2xl border border-dashed border-border/80 text-center space-y-2 bg-muted/10">
                  <Clock className="size-6 text-[#FF6B35] mx-auto opacity-70" />
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    {t("customPrintApp.noQuotesYet")}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {quotes.map((q) => {
                    const isSent = q.status === "sent";
                    const isAccepted = q.status === "accepted";
                    const isRejected = q.status === "rejected";
                    const isExpired =
                      q.status === "expired" ||
                      Boolean(q.valid_until && new Date(q.valid_until).getTime() < Date.now());

                    const validDateFormatted = q.valid_until
                      ? new Date(q.valid_until).toLocaleDateString(
                          locale === "ar" ? "ar-EG" : "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )
                      : "N/A";

                    return (
                      <div
                        key={q.id}
                        className={cn(
                          "rounded-2xl border p-5 sm:p-6 space-y-4 transition-all",
                          isSent && !isExpired
                            ? "border-[#FF6B35]/60 bg-[#FF6B35]/5 shadow-xs"
                            : "border-border/80 bg-card"
                        )}
                      >
                        {/* Quote Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-heading text-base font-bold text-foreground">
                                {t("customPrintApp.quoteVersion", {
                                  version: q.version,
                                })}
                              </span>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px] py-0 px-2 font-mono font-bold uppercase",
                                  isAccepted
                                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                                    : isRejected
                                    ? "bg-rose-500/10 text-rose-500 border-rose-500/30"
                                    : isExpired
                                    ? "bg-muted text-muted-foreground border-border"
                                    : "bg-[#FF6B35]/15 text-[#FF6B35] border-[#FF6B35]/40"
                                )}
                              >
                                {isExpired && isSent ? "Expired" : q.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {q.description}
                            </p>
                          </div>

                          <div className="text-start sm:text-end">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                              {t("customPrintApp.totalPrice")}
                            </span>
                            <span className="font-mono text-xl font-black text-[#FF6B35]">
                              {q.total_price} EGP
                            </span>
                          </div>
                        </div>

                        {/* Specs Breakdown */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div className="p-3 rounded-xl bg-muted/20 border border-border/50">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                              Material & Color
                            </span>
                            <span className="font-semibold text-foreground">
                              {q.material || "PETG"} · {q.color || "Black"}
                            </span>
                          </div>

                          <div className="p-3 rounded-xl bg-muted/20 border border-border/50">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                              Quantity
                            </span>
                            <span className="font-mono font-bold text-foreground">
                              {q.quantity} units
                            </span>
                          </div>

                          <div className="p-3 rounded-xl bg-muted/20 border border-border/50">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                              Unit Price
                            </span>
                            <span className="font-mono font-semibold text-foreground">
                              {q.unit_price} EGP
                            </span>
                          </div>

                          <div className="p-3 rounded-xl bg-muted/20 border border-border/50">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                              Turnaround
                            </span>
                            <span className="font-semibold text-foreground">
                              {q.estimated_days} business days
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-muted-foreground">
                          <span className="font-mono">
                            {t("customPrintApp.validUntil", {
                              date: validDateFormatted,
                            })}
                          </span>

                          {/* Accept & Reject Buttons */}
                          {isSent && !isExpired && (
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setRejectingQuote(q)}
                                className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 border-rose-500/30 font-semibold"
                              >
                                {t("customPrintApp.rejectQuote")}
                              </Button>

                              <Button
                                type="button"
                                variant="default"
                                size="sm"
                                onClick={() => {
                                  setAcceptingQuote(q);
                                  fetchAddresses();
                                }}
                                className="font-bold shadow-xs"
                                iconLeft={<CheckCircle2 className="size-4" />}
                              >
                                {t("customPrintApp.acceptQuote")}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (4 cols): Quick Specs Hub */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
              <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Request Summary
              </h3>

              <div className="space-y-3 text-xs sm:text-sm">
                <div className="flex justify-between py-1.5 border-b border-border/60">
                  <span className="text-muted-foreground">Quantity</span>
                  <span className="font-mono font-bold text-foreground">
                    {request.quantity} units
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-border/60">
                  <span className="text-muted-foreground">Material</span>
                  <span className="font-semibold text-foreground">
                    {request.preferred_material || "Not specified"}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-border/60">
                  <span className="text-muted-foreground">Color</span>
                  <span className="font-semibold text-foreground">
                    {request.preferred_color || "Not specified"}
                  </span>
                </div>

                {request.reference_url && (
                  <div className="py-1.5">
                    <span className="text-muted-foreground block mb-1">
                      Reference Link
                    </span>
                    <a
                      href={request.reference_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#FF6B35] font-mono text-xs hover:underline flex items-center gap-1 truncate"
                    >
                      <span className="truncate">{request.reference_url}</span>
                      <ExternalLink className="size-3 shrink-0" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* File Preview Modal (STL 3D or Reference Image) */}
        {previewFile && (
          <Modal
            open={Boolean(previewFile)}
            onClose={() => setPreviewFile(null)}
            title={previewFile.file.original_filename}
            maxWidth="2xl"
          >
            <div className="space-y-3 pt-1">
              {previewFile.file.original_filename.toLowerCase().endsWith(".stl") ? (
                <>
                  <STLViewer url={previewFile.signedUrl} height={420} />
                  <p className="text-[11px] text-muted-foreground text-center">
                    {t("customPrintApp.stlInspectionHint")}
                  </p>
                </>
              ) : (
                <div className="relative h-[65vh] w-full bg-muted/20 rounded-2xl overflow-hidden">
                  <Image
                    src={previewFile.signedUrl}
                    alt={previewFile.file.original_filename}
                    fill
                    sizes="1000px"
                    className="object-contain"
                  />
                </div>
              )}
            </div>
          </Modal>
        )}

        {/* Accept Quote Modal (Address & Payment Method Selector) */}
        {acceptingQuote && (
          <Modal
            open={Boolean(acceptingQuote)}
            onClose={() => !isSubmittingAccept && setAcceptingQuote(null)}
            title={t("customPrintApp.acceptModalTitle", {
              version: acceptingQuote.version,
            })}
            maxWidth="xl"
          >
            <form onSubmit={handleConfirmAcceptQuote} className="space-y-5 pt-2 text-start">
              <p className="text-xs text-muted-foreground">
                {t("customPrintApp.acceptModalDesc")}
              </p>

              {/* Authoritative Quote Breakdown */}
              <div className="rounded-2xl border border-border/80 bg-muted/20 p-4 space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Custom Fabrication Subtotal</span>
                  <span className="font-mono font-bold text-foreground">
                    {acceptingQuote.total_price} EGP
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated Shipping</span>
                  <span className="font-mono text-foreground">
                    {selectedAddress
                      ? `${getShippingFee(selectedAddress.governorate)} EGP`
                      : "50 EGP"}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border/60 font-bold text-base">
                  <span className="text-foreground">Total to be invoiced</span>
                  <span className="font-mono text-[#FF6B35]">
                    {(acceptingQuote.total_price || 0) +
                      (selectedAddress
                        ? getShippingFee(selectedAddress.governorate)
                        : 50)}{" "}
                    EGP
                  </span>
                </div>
              </div>

              {/* Shipping Address Selector */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="size-4 text-[#FF6B35]" />
                    <span>{t("customPrintApp.shippingAddress")}</span>
                  </span>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddressModalOpen(true)}
                    className="h-7 px-2 text-xs font-semibold"
                    iconLeft={<Plus className="size-3" />}
                  >
                    Add Address
                  </Button>
                </div>

                {addresses.length === 0 ? (
                  <div className="p-4 rounded-2xl border border-dashed border-border text-center text-xs text-muted-foreground">
                    No addresses found. Click &ldquo;Add Address&rdquo; to create your shipping destination.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5 max-h-48 overflow-y-auto pr-1">
                    {addresses.map((addr) => (
                      <AddressCard
                        key={addr.id}
                        address={addr}
                        selectable
                        isSelected={selectedAddress?.id === addr.id}
                        onSelect={(a) => setSelectedAddress(a)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <CreditCard className="size-4 text-[#FF6B35]" />
                  <span>{t("customPrintApp.paymentMethod")}</span>
                </span>

                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: "cod", label: "Cash on Delivery", icon: Banknote },
                    { id: "instapay", label: "InstaPay IPN", icon: Smartphone },
                    { id: "vodafone_cash", label: "Vodafone Cash", icon: Wallet },
                    { id: "online", label: "Card Payment", icon: CreditCard },
                  ].map((pm) => {
                    const isSelected = paymentMethod === pm.id;
                    const Icon = pm.icon;
                    return (
                      <div
                        key={pm.id}
                        onClick={() => setPaymentMethod(pm.id as any)}
                        className={cn(
                          "p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5",
                          isSelected
                            ? "border-[#FF6B35] bg-[#FF6B35]/10 text-foreground font-bold"
                            : "border-border/80 bg-card hover:bg-muted/10 text-muted-foreground"
                        )}
                      >
                        <Icon className={cn("size-4", isSelected && "text-[#FF6B35]")} />
                        <span className="text-xs">{pm.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  disabled={isSubmittingAccept}
                  onClick={() => setAcceptingQuote(null)}
                >
                  {t("common.cancel")}
                </Button>

                <Button
                  type="submit"
                  variant="default"
                  size="default"
                  disabled={isSubmittingAccept || !selectedAddress}
                  iconLeft={
                    isSubmittingAccept ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="size-4" />
                    )
                  }
                  className="font-bold shadow-sm"
                >
                  {isSubmittingAccept
                    ? t("customPrintApp.accepting")
                    : t("customPrintApp.acceptQuote")}
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* Decline Quote Modal */}
        {rejectingQuote && (
          <Modal
            open={Boolean(rejectingQuote)}
            onClose={() => !isSubmittingReject && setRejectingQuote(null)}
            title={t("customPrintApp.rejectModalTitle", {
              version: rejectingQuote.version,
            })}
            maxWidth="md"
          >
            <form onSubmit={handleConfirmRejectQuote} className="space-y-4 pt-2 text-start">
              <div className="space-y-1.5">
                <label
                  htmlFor="reject-reason-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {t("customPrintApp.rejectReasonLabel")}
                </label>
                <textarea
                  id="reject-reason-input"
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder={t("customPrintApp.rejectReasonPlaceholder")}
                  disabled={isSubmittingReject}
                  required
                  className="w-full rounded-2xl border border-border/80 bg-card p-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all resize-none shadow-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  disabled={isSubmittingReject}
                  onClick={() => setRejectingQuote(null)}
                >
                  {t("common.cancel")}
                </Button>

                <Button
                  type="submit"
                  variant="destructive"
                  size="default"
                  disabled={isSubmittingReject || rejectReason.trim().length < 3}
                  iconLeft={
                    isSubmittingReject ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <XCircle className="size-4" />
                    )
                  }
                >
                  {isSubmittingReject
                    ? t("customPrintApp.rejecting")
                    : t("customPrintApp.rejectQuote")}
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* Address Form Modal */}
        <AddressFormModal
          open={isAddressModalOpen}
          onClose={() => setIsAddressModalOpen(false)}
          onSuccess={(newAddr) => {
            fetchAddresses();
            setSelectedAddress(newAddr);
          }}
        />
      </Container>
    </div>
  );
}
