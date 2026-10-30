"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  ExternalLink,
  Eye,
} from "lucide-react";
import { AdminTableShell, PaginationMeta } from "../layout/admin-table";
import { PaymentReviewModal } from "./payment-review-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

export function PaymentsTable() {
  const { t } = useTranslation();
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("awaiting_verification");
  const [methodFilter, setMethodFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    total_items: 0,
    total_pages: 1,
  });

  // Modal State
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);

  const fetchPayments = useCallback(
    async (pageToLoad = 1) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(pageToLoad));
        params.set("limit", String(pagination.limit));
        if (statusFilter) params.set("status", statusFilter);
        if (methodFilter) params.set("payment_method", methodFilter);

        const res = await fetch(`/api/admin/payments?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load payments");

        const json = await res.json();
        if (json.success && json.data) {
          setPayments(json.data.payments || []);
          if (json.data.pagination) {
            setPagination(json.data.pagination);
          }
        }
      } catch (err) {
        toast.error("Error", "Could not load payments list");
      } finally {
        setIsLoading(false);
      }
    },
    [statusFilter, methodFilter, pagination.limit]
  );

  useEffect(() => {
    fetchPayments(1);
  }, [fetchPayments]);

  return (
    <div className="space-y-6">
      <AdminTableShell
        title={t("admin.paymentsModule.title")}
        subtitle="Verify manual mobile wallets (Vodafone Cash, InstaPay) and bank transfers against proof attachments"
        onRefresh={() => fetchPayments(pagination.page)}
        isLoading={isLoading}
        isEmpty={payments.length === 0}
        emptyTitle="No payments matching criteria"
        emptyDescription="All manual transfers have been reviewed or no payments match the selected filter."
        pagination={pagination}
        onPageChange={(p) => fetchPayments(p)}
        filterSlot={
          <>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-[#FF6B35]"
            >
              <option value="">All Statuses</option>
              <option value="awaiting_verification">
                Awaiting Verification (Urgent)
              </option>
              <option value="paid">Paid / Approved</option>
              <option value="pending">Pending Customer Submission</option>
              <option value="failed">Failed / Rejected</option>
            </select>

            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="h-9 px-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-[#FF6B35]"
            >
              <option value="">All Methods</option>
              <option value="instapay">InstaPay</option>
              <option value="vodafone_cash">Vodafone Cash</option>
              <option value="cod">Cash on Delivery</option>
              <option value="online">Online Card</option>
            </select>
          </>
        }
      >
        <table className="w-full text-xs text-start">
          <thead className="bg-muted/40 text-muted-foreground font-mono text-[11px] uppercase tracking-wider border-b border-border/60">
            <tr>
              <th className="py-3 px-4 text-start font-semibold">
                Order #
              </th>
              <th className="py-3 px-4 text-start font-semibold">
                Customer
              </th>
              <th className="py-3 px-4 text-start font-semibold">
                Method
              </th>
              <th className="py-3 px-4 text-start font-semibold">
                Amount
              </th>
              <th className="py-3 px-4 text-start font-semibold">
                Date Submitted
              </th>
              <th className="py-3 px-4 text-start font-semibold">
                Status
              </th>
              <th className="py-3 px-4 text-end font-semibold">
                {t("admin.tables.actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {payments.map((p) => {
              const formattedDate = new Date(p.created_at).toLocaleDateString(
                undefined,
                {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }
              );

              const hasProof = Boolean(p.proof_file_url || p.proof_url);

              return (
                <tr
                  key={p.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                    <Link
                      href={`/admin/orders/${p.order?.id}`}
                      className="hover:text-[#FF6B35] transition-colors"
                    >
                      #{p.order?.order_number || "—"}
                    </Link>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-foreground">
                      {p.order?.customer_first_name} {p.order?.customer_last_name}
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono">
                      {p.order?.customer_phone}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-muted text-foreground">
                      {p.payment_method}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                    {Number(p.amount).toFixed(2)} EGP
                  </td>

                  <td className="py-3.5 px-4 text-muted-foreground font-mono">
                    {formattedDate}
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase",
                        p.status === "paid" &&
                          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
                        p.status === "awaiting_verification" &&
                          "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse",
                        p.status === "pending" &&
                          "bg-muted text-muted-foreground",
                        p.status === "failed" &&
                          "bg-red-500/10 text-red-500 border border-red-500/20"
                      )}
                    >
                      {p.status.replace(/_/g, " ")}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-end">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        onClick={() => setSelectedPayment(p)}
                        className={cn(
                          "h-8 px-2.5 text-xs font-semibold shadow-sm",
                          p.status === "awaiting_verification"
                            ? "bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white"
                            : "bg-muted text-foreground hover:bg-muted/80"
                        )}
                      >
                        <Eye className="size-3.5 me-1" />
                        {p.status === "awaiting_verification"
                          ? "Review Proof"
                          : "Inspect"}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </AdminTableShell>

      {/* Review Modal */}
      <PaymentReviewModal
        isOpen={Boolean(selectedPayment)}
        onClose={() => setSelectedPayment(null)}
        onSuccess={() => fetchPayments(pagination.page)}
        payment={selectedPayment}
      />
    </div>
  );
}

