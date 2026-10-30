"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  ExternalLink,
  Edit,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Truck,
  Box,
} from "lucide-react";
import { AdminTableShell, PaginationMeta } from "../layout/admin-table";
import { OrderStatusModal } from "./order-status-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

const STATUS_TABS = [
  { id: "", label: "All Orders" },
  { id: "pending_customer_confirmation", label: "Pending Confirm" },
  { id: "confirmed", label: "Confirmed" },
  { id: "processing", label: "Processing" },
  { id: "ready_to_ship", label: "Ready to Ship" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
];

export function OrdersTable() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatusTab, setSelectedStatusTab] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    total_items: 0,
    total_pages: 1,
  });

  // Modal State
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedOrderForStatus, setSelectedOrderForStatus] = useState<any | null>(null);

  const fetchOrders = useCallback(
    async (pageToLoad = 1) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(pageToLoad));
        params.set("limit", String(pagination.limit));
        if (searchTerm.trim()) params.set("search", searchTerm.trim());
        if (selectedStatusTab) params.set("status", selectedStatusTab);
        if (paymentStatusFilter) params.set("payment_status", paymentStatusFilter);
        if (paymentMethodFilter) params.set("payment_method", paymentMethodFilter);

        const res = await fetch(`/api/admin/orders?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load orders");

        const json = await res.json();
        if (json.success && json.data) {
          setOrders(json.data.orders || []);
          if (json.data.pagination) {
            setPagination(json.data.pagination);
          }
        }
      } catch (err) {
        toast.error("Error", "Could not load orders list");
      } finally {
        setIsLoading(false);
      }
    },
    [
      searchTerm,
      selectedStatusTab,
      paymentStatusFilter,
      paymentMethodFilter,
      pagination.limit,
    ]
  );

  useEffect(() => {
    fetchOrders(1);
  }, [fetchOrders]);

  const handleOpenStatusModal = (ord: any) => {
    setSelectedOrderForStatus(ord);
    setIsStatusModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {STATUS_TABS.map((tab) => {
          const active = selectedStatusTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedStatusTab(tab.id)}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all",
                active
                  ? "bg-[#FF6B35] text-white shadow-sm font-bold"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <AdminTableShell
        title={t("admin.ordersModule.title")}
        subtitle="Operational fulfillment pipeline, order lifecycle, and customer shipments"
        searchPlaceholder={t("admin.ordersModule.searchOrder")}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        onSearchSubmit={() => fetchOrders(1)}
        onRefresh={() => fetchOrders(pagination.page)}
        isLoading={isLoading}
        isEmpty={orders.length === 0}
        emptyTitle={t("admin.ordersModule.noOrdersFound")}
        emptyDescription="Try clearing filters or search by a different customer phone number or order number."
        pagination={pagination}
        onPageChange={(p) => fetchOrders(p)}
        filterSlot={
          <>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="h-9 px-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-[#FF6B35]"
            >
              <option value="">All Payments</option>
              <option value="paid">Paid</option>
              <option value="awaiting_verification">Awaiting Verification</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>

            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="h-9 px-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-[#FF6B35]"
            >
              <option value="">All Methods</option>
              <option value="cod">Cash on Delivery</option>
              <option value="instapay">InstaPay</option>
              <option value="vodafone_cash">Vodafone Cash</option>
              <option value="online">Online Card</option>
            </select>
          </>
        }
      >
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
                {t("admin.tables.date")}
              </th>
              <th className="py-3 px-4 text-start font-semibold">
                Items
              </th>
              <th className="py-3 px-4 text-start font-semibold">
                {t("admin.tables.total")}
              </th>
              <th className="py-3 px-4 text-start font-semibold">
                {t("admin.tables.paymentStatus")}
              </th>
              <th className="py-3 px-4 text-start font-semibold">
                {t("admin.tables.status")}
              </th>
              <th className="py-3 px-4 text-end font-semibold">
                {t("admin.tables.actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {orders.map((ord) => {
              const formattedDate = new Date(ord.created_at).toLocaleDateString(
                undefined,
                {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }
              );

              const itemsCount = ord.items?.length || 0;

              return (
                <tr
                  key={ord.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                    <Link
                      href={`/admin/orders/${ord.id}`}
                      className="hover:text-[#FF6B35] transition-colors"
                    >
                      #{ord.order_number}
                    </Link>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-foreground">
                      {ord.customer_first_name} {ord.customer_last_name}
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono">
                      {ord.customer_phone}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-muted-foreground font-mono">
                    {formattedDate}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono bg-muted text-foreground">
                      {itemsCount} {itemsCount === 1 ? "item" : "items"}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                    {Number(ord.total).toFixed(2)} EGP
                  </td>

                  {/* Payment */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col gap-0.5">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase",
                          ord.payment_status === "paid" &&
                            "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
                          ord.payment_status === "awaiting_verification" &&
                            "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
                          ord.payment_status === "pending" &&
                            "bg-muted text-muted-foreground",
                          (ord.payment_status === "failed" ||
                            ord.payment_status === "refunded") &&
                            "bg-red-500/10 text-red-500"
                        )}
                      >
                        {ord.payment_status.replace(/_/g, " ")}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase font-mono">
                        {ord.payment_method}
                      </span>
                    </div>
                  </td>

                  {/* Order Status */}
                  <td className="py-3.5 px-4">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase",
                        ord.status === "delivered" &&
                          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                        ord.status === "shipped" &&
                          "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                        (ord.status === "processing" ||
                          ord.status === "ready_to_ship" ||
                          ord.status === "confirmed") &&
                          "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                        (ord.status === "cancelled" ||
                          ord.status === "rejected") &&
                          "bg-red-500/10 text-red-500",
                        ord.status === "pending_customer_confirmation" &&
                          "bg-muted text-muted-foreground"
                      )}
                    >
                      {ord.status.replace(/_/g, " ")}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-end">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenStatusModal(ord)}
                        className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                        title={t("admin.ordersModule.updateStatus")}
                      >
                        <Edit className="size-3.5 me-1" />
                        Status
                      </Button>

                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs text-[#FF6B35] hover:bg-[#FF6B35]/10"
                      >
                        <Link href={`/admin/orders/${ord.id}`}>
                          {t("admin.ordersModule.viewDetails")}
                        </Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </AdminTableShell>

      {/* Status Update Modal */}
      <OrderStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onSuccess={() => fetchOrders(pagination.page)}
        order={selectedOrderForStatus}
      />
    </div>
  );
}

