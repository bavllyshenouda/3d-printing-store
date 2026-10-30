"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Send,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Server,
} from "lucide-react";
import { AdminTableShell, PaginationMeta } from "../layout/admin-table";
import { SendWhatsAppModal } from "./send-whatsapp-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

export function WhatsAppLogsTable() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [phoneFilter, setPhoneFilter] = useState("");
  const [directionFilter, setDirectionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    total_items: 0,
    total_pages: 1,
  });

  // Modal State
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [inspectingMessage, setInspectingMessage] = useState<any | null>(null);

  const fetchMessages = useCallback(
    async (pageToLoad = 1) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(pageToLoad));
        params.set("limit", String(pagination.limit));
        if (phoneFilter.trim()) params.set("phone", phoneFilter.trim());
        if (directionFilter) params.set("direction", directionFilter);
        if (statusFilter) params.set("status", statusFilter);

        const res = await fetch(`/api/admin/whatsapp?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load WhatsApp logs");

        const json = await res.json();
        if (json.success) {
          setMessages(json.messages || []);
          if (json.pagination) {
            setPagination(json.pagination);
          }
        }
      } catch (err) {
        toast.error("Error", "Could not load WhatsApp message logs");
      } finally {
        setIsLoading(false);
      }
    },
    [phoneFilter, directionFilter, statusFilter, pagination.limit]
  );

  useEffect(() => {
    fetchMessages(1);
  }, [fetchMessages]);

  return (
    <div className="space-y-6">
      {/* Provider Status Card */}
      <div className="p-4 rounded-2xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <Server className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-xs sm:text-sm text-foreground">
                WhatsApp Messaging Gateway
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Sandbox / Meta Provider
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Supports automated order updates, payment confirmations, and manual broadcast dispatch.
            </p>
          </div>
        </div>

        <Button
          size="sm"
          onClick={() => setIsSendModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 shadow-sm shrink-0"
        >
          <Send className="size-3.5 me-1.5" />
          {t("admin.whatsappModule.sendMessage")}
        </Button>
      </div>

      <AdminTableShell
        title={t("admin.whatsappModule.logs")}
        subtitle="Complete audit logs of all inbound and outbound WhatsApp notifications"
        searchPlaceholder={t("admin.whatsappModule.searchPhone")}
        searchValue={phoneFilter}
        onSearchChange={setPhoneFilter}
        onSearchSubmit={() => fetchMessages(1)}
        onRefresh={() => fetchMessages(pagination.page)}
        isLoading={isLoading}
        isEmpty={messages.length === 0}
        emptyTitle={t("admin.whatsappModule.noMessagesFound")}
        emptyDescription="No WhatsApp messages have been sent or logged yet."
        pagination={pagination}
        onPageChange={(p) => fetchMessages(p)}
        filterSlot={
          <>
            <select
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value)}
              className="h-9 px-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-[#FF6B35]"
            >
              <option value="">All Directions</option>
              <option value="outbound">Outbound (Sent)</option>
              <option value="inbound">Inbound (Received)</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-[#FF6B35]"
            >
              <option value="">All Statuses</option>
              <option value="sent">Sent</option>
              <option value="delivered">Delivered</option>
              <option value="read">Read</option>
              <option value="failed">Failed</option>
            </select>
          </>
        }
      >
        <table className="w-full text-xs text-start">
          <thead className="bg-muted/40 text-muted-foreground font-mono text-[11px] uppercase tracking-wider border-b border-border/60">
            <tr>
              <th className="py-3 px-4 text-start font-semibold">
                Phone Number
              </th>
              <th className="py-3 px-4 text-start font-semibold">
                Direction
              </th>
              <th className="py-3 px-4 text-start font-semibold">
                Template / Type
              </th>
              <th className="py-3 px-4 text-start font-semibold">
                Status
              </th>
              <th className="py-3 px-4 text-start font-semibold">
                Associated Order
              </th>
              <th className="py-3 px-4 text-start font-semibold">
                Sent At
              </th>
              <th className="py-3 px-4 text-end font-semibold">
                Payload
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {messages.map((msg) => {
              const formattedDate = new Date(msg.created_at).toLocaleString();
              const isOutbound = msg.direction === "outbound";

              return (
                <tr
                  key={msg.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                    {msg.phone}
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold",
                        isOutbound
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                          : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                      )}
                    >
                      {isOutbound ? (
                        <ArrowUpRight className="size-3" />
                      ) : (
                        <ArrowDownLeft className="size-3" />
                      )}
                      <span>{msg.direction}</span>
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-muted-foreground uppercase text-[11px]">
                    {msg.message_type?.replace(/_/g, " ") || "Template"}
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase",
                        (msg.message_status === "delivered" ||
                          msg.message_status === "read" ||
                          msg.message_status === "sent") &&
                          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
                        msg.message_status === "failed" &&
                          "bg-red-500/10 text-red-500 border border-red-500/20"
                      )}
                    >
                      {msg.message_status}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-mono">
                    {msg.order_id ? (
                      <Link
                        href={`/admin/orders/${msg.order_id}`}
                        className="text-[#FF6B35] hover:underline"
                      >
                        #{msg.order_id.slice(0, 8)}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-muted-foreground font-mono text-[11px]">
                    {formattedDate}
                  </td>

                  <td className="py-3.5 px-4 text-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setInspectingMessage(msg)}
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Eye className="size-3.5 me-1" />
                      Inspect
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </AdminTableShell>

      {/* Send WhatsApp Modal */}
      <SendWhatsAppModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        onSuccess={() => fetchMessages(pagination.page)}
      />

      {/* Inspect Payload Modal */}
      <Modal
        open={Boolean(inspectingMessage)}
        onClose={() => setInspectingMessage(null)}
        title="WhatsApp Message Payload Inspection"
        maxWidth="md"
      >
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs space-y-1 font-mono">
            <div>
              <span className="text-muted-foreground">Recipient: </span>
              <span className="font-bold text-foreground">
                {inspectingMessage?.phone}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Type: </span>
              <span className="font-bold text-foreground">
                {inspectingMessage?.message_type}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Status: </span>
              <span className="font-bold text-foreground">
                {inspectingMessage?.message_status}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              Payload & Variables JSON
            </label>
            <pre className="p-3 rounded-xl bg-[#111318] text-gray-200 text-[11px] font-mono overflow-x-auto max-h-60 border border-white/10">
              {JSON.stringify(
                inspectingMessage?.raw_payload ||
                  inspectingMessage?.template_params ||
                  inspectingMessage,
                null,
                2
              )}
            </pre>
          </div>
        </div>
      </Modal>
    </div>
  );
}
