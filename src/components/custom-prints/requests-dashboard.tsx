"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/context";
import { useTranslation } from "@/lib/i18n/context";
import {
  UploadCloud,
  FileCode,
  Box,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Plus,
  Sparkles,
  FileCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  CustomPrintRequest,
  CustomPrintFile,
  CustomPrintQuote,
} from "@/types/database";

export interface CustomPrintWithMeta extends CustomPrintRequest {
  files?: CustomPrintFile[];
  quotes?: CustomPrintQuote[];
}

export function RequestsDashboard() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, locale, isRTL } = useTranslation();

  const [requests, setRequests] = useState<CustomPrintWithMeta[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Protect route
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/auth/login?redirect=/custom-prints/my-requests");
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "10");
      if (statusFilter) {
        params.set("status", statusFilter);
      }

      const res = await fetch(`/api/custom-prints?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load requests");
      }

      setRequests(data.data.requests || []);
      setTotalPages(data.data.pagination?.total_pages || 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error fetching requests");
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchRequests();
    }
  }, [isAuthenticated, fetchRequests]);

  const filterTabs = [
    { id: "", label: t("customPrintApp.filterAll") },
    { id: "submitted", label: t("customPrintApp.filterSubmitted") },
    { id: "under_review", label: t("customPrintApp.filterReview") },
    { id: "quote_sent", label: t("customPrintApp.filterQuoteSent") },
    { id: "accepted", label: t("customPrintApp.filterAccepted") },
    { id: "in_production", label: t("customPrintApp.filterProduction") },
    { id: "completed", label: t("customPrintApp.filterCompleted") },
  ];

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "quote_sent":
        return {
          label: t("customPrintApp.status_quote_sent"),
          classes:
            "bg-[#FF6B35]/15 text-[#FF6B35] border-[#FF6B35]/40 font-bold",
        };
      case "under_review":
        return {
          label: t("customPrintApp.status_under_review"),
          classes: "bg-blue-500/10 text-blue-500 border-blue-500/30",
        };
      case "accepted":
        return {
          label: t("customPrintApp.status_accepted"),
          classes: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
        };
      case "in_production":
        return {
          label: t("customPrintApp.status_in_production"),
          classes: "bg-purple-500/10 text-purple-500 border-purple-500/30",
        };
      case "completed":
        return {
          label: t("customPrintApp.status_completed"),
          classes: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
        };
      case "rejected":
        return {
          label: t("customPrintApp.status_rejected"),
          classes: "bg-rose-500/10 text-rose-500 border-rose-500/30",
        };
      case "submitted":
      default:
        return {
          label: t("customPrintApp.status_submitted"),
          classes: "bg-amber-500/10 text-amber-500 border-amber-500/30",
        };
    }
  };

  const NextIcon = isRTL ? ArrowLeft : ArrowRight;
  const PrevIcon = isRTL ? ChevronRight : ChevronLeft;

  return (
    <div className="py-8 sm:py-12 bg-background min-h-[75vh]">
      <Container size="lg">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {t("customPrintApp.dashboardTitle")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t("customPrintApp.dashboardSubtitle")}
            </p>
          </div>

          <Link href="/custom-prints/new">
            <Button
              type="button"
              variant="default"
              size="default"
              iconLeft={<Plus className="size-4" />}
              className="font-bold shadow-sm"
            >
              {t("customPrintApp.newRequestCta")}
            </Button>
          </Link>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 scrollbar-none">
          {filterTabs.map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.id);
                  setPage(1);
                }}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
                  active
                    ? "bg-[#FF6B35] text-white shadow-xs"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center text-red-600 dark:text-red-400">
            <AlertCircle className="size-6 mx-auto mb-2" />
            <p className="font-semibold text-sm">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRequests}
              className="mt-3"
            >
              {t("common.retry")}
            </Button>
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/80 p-12 text-center max-w-md mx-auto space-y-4">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60 text-[#FF6B35] mx-auto">
              <Layers className="size-7" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold text-foreground">
                {t("customPrintApp.emptyRequests")}
              </h3>
            </div>
            <Link href="/custom-prints/new" className="inline-block">
              <Button variant="default" size="default" className="font-semibold">
                {t("customPrintApp.newRequestCta")}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => {
              const statusCfg = getStatusBadge(req.status);
              const filesCount = req.files?.length || 0;
              const quotesCount = req.quotes?.length || 0;
              const hasActiveQuote =
                req.status === "quote_sent" && quotesCount > 0;

              const formattedDate = new Date(req.created_at).toLocaleDateString(
                locale === "ar" ? "ar-EG" : "en-US",
                {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                }
              );

              return (
                <div
                  key={req.id}
                  className={cn(
                    "rounded-2xl border p-5 sm:p-6 transition-all bg-card space-y-4 hover:shadow-xs",
                    hasActiveQuote
                      ? "border-[#FF6B35]/60 ring-2 ring-[#FF6B35]/15"
                      : "border-border/80 hover:border-[#FF6B35]/40"
                  )}
                >
                  {/* Top Bar: Title, Date & Badges */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="font-heading text-base sm:text-lg font-bold text-foreground">
                          {req.title || `Custom Project #${req.id.slice(0, 8)}`}
                        </h3>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] py-0 px-2 font-mono uppercase",
                            statusCfg.classes
                          )}
                        >
                          {statusCfg.label}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="size-3.5" />
                        <span>Submitted {formattedDate}</span>
                      </div>
                    </div>

                    {hasActiveQuote && (
                      <Badge
                        variant="default"
                        className="bg-[#FF6B35] text-white font-bold text-xs py-1 px-3 self-start sm:self-auto shadow-xs"
                      >
                        Action Required: Quote Received
                      </Badge>
                    )}
                  </div>

                  {/* Specs & Files summary */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs sm:text-sm">
                    <div className="flex items-center gap-4 text-muted-foreground flex-wrap">
                      <div>
                        <span>Qty: </span>
                        <strong className="text-foreground font-mono">
                          {req.quantity}
                        </strong>
                      </div>
                      {req.preferred_material && (
                        <div>
                          <span>Material: </span>
                          <strong className="text-foreground">
                            {req.preferred_material}
                          </strong>
                        </div>
                      )}
                      <div>
                        <span>Files: </span>
                        <strong className="text-foreground font-mono">
                          {filesCount}
                        </strong>
                      </div>
                      <div>
                        <span>Quotes: </span>
                        <strong
                          className={cn(
                            "font-mono",
                            hasActiveQuote
                              ? "text-[#FF6B35] font-bold"
                              : "text-foreground"
                          )}
                        >
                          {quotesCount}
                        </strong>
                      </div>
                    </div>

                    <Link href={`/custom-prints/${req.id}`}>
                      <Button
                        type="button"
                        variant={hasActiveQuote ? "default" : "outline"}
                        size="sm"
                        className="w-full sm:w-auto font-semibold"
                        iconRight={<NextIcon className="size-3.5" />}
                      >
                        {hasActiveQuote
                          ? "Review Quote & Order"
                          : t("customPrintApp.viewRequest")}
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t border-border/60">
                <span className="text-xs text-muted-foreground">
                  Page {page} of {totalPages}
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    iconLeft={<PrevIcon className="size-4" />}
                  >
                    Previous
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    iconRight={<NextIcon className="size-4" />}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Container>
    </div>
  );
}

