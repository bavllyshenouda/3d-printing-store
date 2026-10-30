"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Layers,
  FileCode,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Plus,
} from "lucide-react";
import { AdminTableShell, PaginationMeta } from "../layout/admin-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = [
  { id: "", label: "All Requests" },
  { id: "submitted", label: "Awaiting Quote" },
  { id: "quoted", label: "Quote Sent" },
  { id: "accepted", label: "Accepted" },
  { id: "in_production", label: "In Production" },
  { id: "completed", label: "Completed" },
  { id: "rejected", label: "Rejected" },
];

export function CustomPrintsTable() {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("submitted");
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    total_items: 0,
    total_pages: 1,
  });

  const fetchRequests = useCallback(
    async (pageToLoad = 1) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(pageToLoad));
        params.set("limit", String(pagination.limit));
        if (statusFilter) params.set("status", statusFilter);

        const res = await fetch(`/api/admin/custom-prints?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load custom prints");

        const json = await res.json();
        if (json.success && json.data) {
          setRequests(json.data.requests || []);
          if (json.data.pagination) {
            setPagination(json.data.pagination);
          }
        }
      } catch (err) {
        toast.error("Error", "Could not load custom print requests");
      } finally {
        setIsLoading(false);
      }
    },
    [statusFilter, pagination.limit]
  );

  useEffect(() => {
    fetchRequests(1);
  }, [fetchRequests]);

  return (
    <div className="space-y-6">
      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {STATUS_FILTERS.map((tab) => {
          const active = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
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
        title={t("admin.customPrintsModule.title")}
        subtitle="CAD geometry inspection, slicer specifications review, and official quote issuance"
        onRefresh={() => fetchRequests(pagination.page)}
        isLoading={isLoading}
        isEmpty={requests.length === 0}
        emptyTitle="No custom prints found"
        emptyDescription="No customer model submissions currently match the selected status."
        pagination={pagination}
        onPageChange={(p) => fetchRequests(p)}
      >
        <table className="w-full text-xs text-start">
          <thead className="bg-muted/40 text-muted-foreground font-mono text-[11px] uppercase tracking-wider border-b border-border/60">
            <tr>
              <th className="py-3 px-4 text-start font-semibold">
                Design Title
              </th>
              <th className="py-3 px-4 text-start font-semibold">
                Client
              </th>
              <th className="py-3 px-4 text-start font-semibold">
                Specs & Qty
              </th>
              <th className="py-3 px-4 text-start font-semibold">
                CAD Files
              </th>
              <th className="py-3 px-4 text-start font-semibold">
                Quote Status
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
            {requests.map((req) => {
              const latestQuote = req.quotes?.[0];
              const filesCount = req.files?.length || 0;

              return (
                <tr
                  key={req.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="py-3.5 px-4 font-bold text-foreground">
                    <Link
                      href={`/admin/custom-prints/${req.id}`}
                      className="hover:text-[#FF6B35] transition-colors"
                    >
                      {req.title}
                    </Link>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      Ref: {req.id.slice(0, 8)}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-foreground">
                      {req.profile?.first_name || "Guest"}{" "}
                      {req.profile?.last_name || ""}
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono">
                      {req.profile?.phone || req.profile?.email || "—"}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-bold text-foreground font-mono">
                      Qty: {req.quantity}
                    </span>
                    <div className="text-[11px] text-muted-foreground font-mono">
                      {req.material || "Standard"} • {req.color || "Any"}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <FileCode className="size-3.5 text-[#FF6B35]" />
                      <span>{filesCount} {filesCount === 1 ? "file" : "files"}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono">
                    {latestQuote ? (
                      <div>
                        <span className="font-bold text-foreground block">
                          {Number(latestQuote.total_price).toFixed(2)} EGP
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase">
                          v{latestQuote.version} ({latestQuote.status})
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic text-[11px]">
                        No quote issued yet
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase",
                        req.status === "submitted" &&
                          "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
                        req.status === "quoted" &&
                          "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
                        req.status === "accepted" &&
                          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
                        req.status === "in_production" &&
                          "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20",
                        req.status === "completed" &&
                          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                        req.status === "rejected" &&
                          "bg-red-500/10 text-red-500 border border-red-500/20"
                      )}
                    >
                      {req.status.replace(/_/g, " ")}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-end">
                    <Button
                      asChild
                      size="sm"
                      className="h-8 px-2.5 text-xs bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white shadow-sm"
                    >
                      <Link href={`/admin/custom-prints/${req.id}`}>
                        <Eye className="size-3.5 me-1" />
                        Inspect & Quote
                      </Link>
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </AdminTableShell>
    </div>
  );
}

