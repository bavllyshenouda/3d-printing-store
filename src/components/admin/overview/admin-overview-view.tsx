"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  CreditCard,
  Layers,
  Package,
  TrendingUp,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { AdminMetricCard } from "../layout/admin-metric-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import { cn } from "@/lib/utils";

interface DashboardMetrics {
  totalOrders: number;
  pendingOrders: number;
  verifiedRevenue: number;
  pendingPaymentsCount: number;
  pendingQuotesCount: number;
  totalProducts: number;
  adminSince?: string;
  systemStatus: string;
}

export function AdminOverviewView() {
  const { t, isRTL } = useTranslation();
  const { user, profile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalOrders: 0,
    pendingOrders: 0,
    verifiedRevenue: 0,
    pendingPaymentsCount: 0,
    pendingQuotesCount: 0,
    totalProducts: 0,
    systemStatus: "operational",
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [pendingCustomPrints, setPendingCustomPrints] = useState<any[]>([]);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Parallel fetch from actual backend endpoints
      const [metricsRes, ordersRes, paymentsRes, printsRes, productsRes] =
        await Promise.all([
          fetch("/api/admin/metrics"),
          fetch("/api/admin/orders?limit=10"),
          fetch("/api/admin/payments?status=awaiting_verification&limit=5"),
          fetch("/api/admin/custom-prints?status=submitted&limit=5"),
          fetch("/api/admin/products?limit=1"),
        ]);

      let adminSince = "";
      let systemStatus = "operational";

      if (metricsRes.ok) {
        const mJson = await metricsRes.json();
        if (mJson.success && mJson.data) {
          adminSince = mJson.data.admin_since;
          systemStatus = mJson.data.system_status || "operational";
        }
      }

      let totalOrders = 0;
      let pendingOrdersCount = 0;
      let revenue = 0;
      let ordersList: any[] = [];

      if (ordersRes.ok) {
        const oJson = await ordersRes.json();
        if (oJson.success && oJson.data) {
          ordersList = oJson.data.orders || [];
          totalOrders = oJson.data.pagination?.total_items || ordersList.length;

          // Calculate revenue and pending counts from loaded orders
          ordersList.forEach((ord: any) => {
            if (ord.payment_status === "paid") {
              revenue += Number(ord.total || 0);
            }
            if (
              [
                "pending_customer_confirmation",
                "confirmed",
                "processing",
                "ready_to_ship",
              ].includes(ord.status)
            ) {
              pendingOrdersCount += 1;
            }
          });
        }
      }

      let pendingPaymentsList: any[] = [];
      let pendingPaymentsCount = 0;
      if (paymentsRes.ok) {
        const pJson = await paymentsRes.json();
        if (pJson.success && pJson.data) {
          pendingPaymentsList = pJson.data.payments || [];
          pendingPaymentsCount =
            pJson.data.pagination?.total_items || pendingPaymentsList.length;
        }
      }

      let pendingPrintsList: any[] = [];
      let pendingQuotesCount = 0;
      if (printsRes.ok) {
        const cpJson = await printsRes.json();
        if (cpJson.success && cpJson.data) {
          pendingPrintsList = cpJson.data.requests || [];
          pendingQuotesCount =
            cpJson.data.pagination?.total_items || pendingPrintsList.length;
        }
      }

      let totalProducts = 0;
      if (productsRes.ok) {
        const prodJson = await productsRes.json();
        if (prodJson.success && prodJson.data) {
          totalProducts = prodJson.data.pagination?.total || 0;
        }
      }

      setMetrics({
        totalOrders,
        pendingOrders: pendingOrdersCount,
        verifiedRevenue: revenue,
        pendingPaymentsCount,
        pendingQuotesCount,
        totalProducts,
        adminSince,
        systemStatus,
      });

      setRecentOrders(ordersList);
      setPendingPayments(pendingPaymentsList);
      setPendingCustomPrints(pendingPrintsList);
    } catch (err) {
      console.error("Dashboard overview fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const displayName = profile?.first_name
    ? `${profile.first_name} ${profile.last_name || ""}`.trim()
    : user?.email?.split("@")[0] || t("admin.adminUser");

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#111318] to-[#1c202a] text-white p-6 sm:p-8 rounded-3xl border border-white/10 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-[#FF6B35]">
            <ShieldCheck className="size-4" />
            <span>STUDIO OPERATIONS CONSOLE</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-black tracking-tight">
            Welcome back, {displayName}
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 max-w-xl">
            {t("admin.overviewSubtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="border-white/20 bg-white/5 text-white hover:bg-white/10 text-xs h-9"
          >
            <RefreshCw
              className={cn("size-3.5 me-2", isLoading && "animate-spin text-[#FF6B35]")}
            />
            {t("admin.actions.refresh") || "Refresh"}
          </Button>

          <Button
            asChild
            size="sm"
            className="bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white text-xs h-9 shadow-sm"
          >
            <Link href="/admin/orders">
              {t("admin.orders")}
              <ArrowRight className="size-3.5 ms-1.5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        <AdminMetricCard
          title={t("admin.metrics.totalOrders")}
          value={metrics.totalOrders}
          subtitle={`${metrics.pendingOrders} ${t("admin.metrics.pendingOrders")}`}
          icon={ShoppingBag}
          badge={{
            text: "Orders Live",
            variant: "neutral",
          }}
          href="/admin/orders"
        />

        <AdminMetricCard
          title={t("admin.metrics.verifiedRevenue")}
          value={`${metrics.verifiedRevenue.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })} EGP`}
          subtitle="Settled & approved payments"
          icon={TrendingUp}
          badge={{
            text: "Paid",
            variant: "success",
          }}
          href="/admin/payments"
        />

        <AdminMetricCard
          title={t("admin.metrics.pendingPayments")}
          value={metrics.pendingPaymentsCount}
          subtitle="Proof submitted, awaiting verification"
          icon={CreditCard}
          badge={{
            text: metrics.pendingPaymentsCount > 0 ? "Requires Review" : "Clear",
            variant: metrics.pendingPaymentsCount > 0 ? "warning" : "success",
          }}
          href="/admin/payments"
        />

        <AdminMetricCard
          title={t("admin.metrics.pendingQuotes")}
          value={metrics.pendingQuotesCount}
          subtitle="Customer STL submissions"
          icon={Layers}
          badge={{
            text: metrics.pendingQuotesCount > 0 ? "Action Required" : "All Quoted",
            variant: metrics.pendingQuotesCount > 0 ? "warning" : "success",
          }}
          href="/admin/custom-prints"
        />

        <AdminMetricCard
          title={t("admin.metrics.totalProducts")}
          value={metrics.totalProducts}
          subtitle="Active catalog inventory"
          icon={Package}
          badge={{
            text: "In Catalog",
            variant: "info",
          }}
          href="/admin/products"
        />

        <AdminMetricCard
          title={t("admin.metrics.systemStatus")}
          value="100% Online"
          subtitle={t("admin.metrics.allSystemsNormal")}
          icon={CheckCircle2}
          badge={{
            text: "Operational",
            variant: "success",
          }}
        />
      </div>

      {/* Urgent Operational Queues (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Payments Queue */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border/80">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <CreditCard className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    {t("admin.paymentsModule.pendingVerification")}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Bank transfer & mobile wallet receipts
                  </p>
                </div>
              </div>

              <Link
                href="/admin/payments"
                className="text-xs font-semibold text-[#FF6B35] hover:underline flex items-center gap-1"
              >
                <span>{t("common.viewAll")}</span>
                <ArrowRight className="size-3" />
              </Link>
            </div>

            <div className="divide-y divide-border/60 mt-2">
              {pendingPayments.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  <CheckCircle2 className="size-6 text-emerald-500 mx-auto mb-2" />
                  All payments verified. No reviews pending.
                </div>
              ) : (
                pendingPayments.map((p) => (
                  <div
                    key={p.id}
                    className="py-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-foreground">
                        Order #{p.order?.order_number || "—"}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {p.order?.customer_first_name} {p.order?.customer_last_name} •{" "}
                        <span className="uppercase font-mono font-bold text-[#FF6B35]">
                          {p.payment_method}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-foreground">
                        {p.amount} EGP
                      </span>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-7 px-2.5 text-[11px]"
                      >
                        <Link href="/admin/payments">
                          {t("admin.paymentsModule.viewProof")}
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Pending Custom Prints Queue */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border/80">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Layers className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    {t("admin.customPrintsModule.submitted")}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Customer 3D models awaiting engineering quotes
                  </p>
                </div>
              </div>

              <Link
                href="/admin/custom-prints"
                className="text-xs font-semibold text-[#FF6B35] hover:underline flex items-center gap-1"
              >
                <span>{t("common.viewAll")}</span>
                <ArrowRight className="size-3" />
              </Link>
            </div>

            <div className="divide-y divide-border/60 mt-2">
              {pendingCustomPrints.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  <CheckCircle2 className="size-6 text-emerald-500 mx-auto mb-2" />
                  No custom print submissions awaiting quotes.
                </div>
              ) : (
                pendingCustomPrints.map((cp) => (
                  <div
                    key={cp.id}
                    className="py-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-foreground truncate max-w-[180px]">
                        {cp.title}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {cp.profile?.first_name || "Guest"} • Qty: {cp.quantity} •{" "}
                        {cp.material || "Standard"}
                      </div>
                    </div>

                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-7 px-2.5 text-[11px] text-[#FF6B35] hover:bg-[#FF6B35]/10 border-[#FF6B35]/30"
                    >
                      <Link href={`/admin/custom-prints/${cp.id}`}>
                        {t("admin.customPrintsModule.createQuote")}
                      </Link>
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Overview */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border/80 flex items-center justify-between">
          <div>
            <h2 className="text-base font-heading font-bold text-foreground">
              {t("admin.ordersModule.title")}
            </h2>
            <p className="text-xs text-muted-foreground">
              Latest client orders placed across the platform
            </p>
          </div>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="text-xs h-8"
          >
            <Link href="/admin/orders">
              {t("common.viewAll")}
              <ArrowRight className="size-3.5 ms-1.5" />
            </Link>
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-muted/40 text-muted-foreground font-mono text-[11px] uppercase tracking-wider border-b border-border/60">
              <tr>
                <th className="py-3 px-4 text-start font-semibold">
                  {t("admin.tables.orderNumber")}
                </th>
                <th className="py-3 px-4 text-start font-semibold">
                  {t("admin.tables.customer")}
                </th>
                <th className="py-3 px-4 text-start font-semibold">
                  {t("admin.tables.status")}
                </th>
                <th className="py-3 px-4 text-start font-semibold">
                  {t("admin.tables.paymentStatus")}
                </th>
                <th className="py-3 px-4 text-start font-semibold">
                  {t("admin.tables.total")}
                </th>
                <th className="py-3 px-4 text-end font-semibold">
                  {t("admin.tables.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {recentOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No orders registered in the system yet.
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                      #{order.order_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-foreground">
                        {order.customer_first_name} {order.customer_last_name}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        {order.customer_phone}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-muted text-foreground uppercase">
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase",
                          order.payment_status === "paid" &&
                            "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
                          order.payment_status === "awaiting_verification" &&
                            "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
                          order.payment_status === "pending" &&
                            "bg-muted text-muted-foreground"
                        )}
                      >
                        {order.payment_status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                      {order.total} EGP
                    </td>
                    <td className="py-3.5 px-4 text-end">
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2.5 text-xs text-[#FF6B35] hover:bg-[#FF6B35]/10"
                      >
                        <Link href={`/admin/orders/${order.id}`}>
                          {t("admin.actions.view")}
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

