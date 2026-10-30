"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/container";
import { OrderCard, type OrderWithItems } from "./order-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/context";
import { useTranslation } from "@/lib/i18n/context";
import {
  ShoppingBag,
  Filter,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function OrdersListView() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, isRTL } = useTranslation();

  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/auth/login?redirect=/orders");
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "10");
      if (statusFilter) {
        params.set("status", statusFilter);
      }

      const res = await fetch(`/api/orders?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load orders");
      }

      setOrders(data.data.orders || []);
      setTotalPages(data.data.pagination?.totalPages || 1);
      setTotalOrders(data.data.pagination?.total || 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error fetching orders");
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated, fetchOrders]);

  const filterTabs = [
    { id: "", label: t("orders.filterAll") },
    { id: "pending_customer_confirmation", label: t("orders.filterPending") },
    { id: "confirmed", label: t("orders.filterConfirmed") },
    { id: "processing", label: t("orders.filterProcessing") },
    { id: "shipped", label: t("orders.filterShipped") },
    { id: "delivered", label: t("orders.filterDelivered") },
    { id: "cancelled", label: t("orders.filterCancelled") },
  ];

  const PrevIcon = isRTL ? ChevronRight : ChevronLeft;
  const NextIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <div className="py-8 sm:py-12 bg-background min-h-[75vh]">
      <Container size="lg">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {t("orders.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("orders.subtitle")}
          </p>
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

        {/* Orders Content */}
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
              onClick={fetchOrders}
              className="mt-3"
            >
              {t("common.retry")}
            </Button>
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/80 p-12 text-center max-w-md mx-auto space-y-4">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60 text-[#FF6B35] mx-auto">
              <ShoppingBag className="size-7" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold text-foreground">
                {t("orders.emptyTitle")}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {t("orders.emptyDesc")}
              </p>
            </div>
            <Link href="/shop" className="inline-block">
              <Button variant="default" size="default">
                {t("orders.exploreCatalog")}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t border-border/60">
                <span className="text-xs text-muted-foreground">
                  Page {page} of {totalPages} ({totalOrders} orders)
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

