"use client";

import React from "react";
import {
  Clock,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  ShieldAlert,
  Hash,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import type { Payment } from "@/types/database";

export interface PaymentStatusCardProps {
  payment: Payment;
  orderNumber: number;
  className?: string;
}

export function PaymentStatusCard({
  payment,
  orderNumber,
  className,
}: PaymentStatusCardProps) {
  const { t, locale } = useTranslation();

  const status = payment.status; // "pending" | "awaiting_verification" | "paid" | "failed" | "refunded"

  const formatTimestamp = (isoDate: string | null) => {
    if (!isoDate) return null;
    try {
      const d = new Date(isoDate);
      return d.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoDate;
    }
  };

  const getStatusPresentation = () => {
    switch (status) {
      case "paid":
        return {
          title: t("payment.statusPaid"),
          desc: t("payment.statusPaidDesc"),
          icon: CheckCircle2,
          containerClass: "border-emerald-500/40 bg-emerald-500/10",
          iconBg: "bg-emerald-500 text-white",
          textColor: "text-emerald-700 dark:text-emerald-300",
          badgeColor: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
        };
      case "awaiting_verification":
        return {
          title: t("payment.statusAwaiting"),
          desc: t("payment.statusAwaitingDesc"),
          icon: FileCheck,
          containerClass: "border-cyan-500/40 bg-cyan-500/10",
          iconBg: "bg-cyan-500 text-white",
          textColor: "text-cyan-800 dark:text-cyan-200",
          badgeColor: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
        };
      case "failed":
        return {
          title: t("payment.statusFailed"),
          desc: t("payment.statusFailedDesc"),
          icon: AlertTriangle,
          containerClass: "border-rose-500/40 bg-rose-500/10",
          iconBg: "bg-rose-500 text-white",
          textColor: "text-rose-800 dark:text-rose-200",
          badgeColor: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
        };
      case "pending":
      default:
        return {
          title: t("payment.statusPending"),
          desc: t("payment.statusPendingDesc"),
          icon: Clock,
          containerClass: "border-amber-500/40 bg-amber-500/10",
          iconBg: "bg-amber-500 text-white",
          textColor: "text-amber-800 dark:text-amber-200",
          badgeColor: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
        };
    }
  };

  const current = getStatusPresentation();
  const Icon = current.icon;
  const verifiedDate = formatTimestamp(payment.verified_at);

  return (
    <div className={cn("space-y-4 text-start", className)}>
      {/* 1. Status Banner */}
      <div
        className={cn(
          "rounded-3xl border p-5 sm:p-6 transition-all shadow-xs flex flex-col sm:flex-row sm:items-start justify-between gap-4",
          current.containerClass
        )}
      >
        <div className="flex items-start gap-3.5">
          <div
            className={cn(
              "flex size-11 items-center justify-center rounded-2xl shrink-0 mt-0.5 shadow-xs",
              current.iconBg
            )}
          >
            <Icon className="size-6" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-heading text-base sm:text-lg font-bold text-foreground">
                {current.title}
              </h3>
              <Badge
                variant="outline"
                className={cn("text-[10px] py-0 px-2 font-mono font-bold uppercase", current.badgeColor)}
              >
                {status.replace("_", " ")}
              </Badge>
            </div>

            <p className={cn("text-xs sm:text-sm leading-relaxed max-w-xl", current.textColor)}>
              {current.desc}
            </p>

            {verifiedDate && (
              <p className="text-[11px] font-mono text-muted-foreground pt-1">
                Verified: {verifiedDate}
              </p>
            )}
          </div>
        </div>

        {/* Authoritative Total Callout */}
        <div className="rounded-2xl bg-card border border-border/80 p-3.5 sm:p-4 text-start sm:text-end shrink-0 shadow-2xs self-start sm:self-auto min-w-[140px]">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">
            {t("payment.authoritativeTotal")}
          </span>
          <span className="font-mono text-xl sm:text-2xl font-black text-[#FF6B35]">
            {payment.amount} {payment.currency || "EGP"}
          </span>
          <span className="text-[10px] text-muted-foreground block mt-0.5">
            Order #{orderNumber}
          </span>
        </div>
      </div>

      {/* 2. Rejection Reason Callout when status is 'failed' */}
      {status === "failed" && payment.notes && (
        <div className="rounded-2xl border border-rose-500/50 bg-rose-500/15 p-4 sm:p-5 text-rose-900 dark:text-rose-100 space-y-1.5 animate-in fade-in duration-300">
          <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-rose-700 dark:text-rose-300">
            <AlertTriangle className="size-4 shrink-0" />
            <span>{t("payment.rejectionReasonTitle")}</span>
          </div>
          <p className="text-xs sm:text-sm font-medium leading-relaxed bg-card/60 p-3 rounded-xl border border-rose-500/20 italic">
            &ldquo;{payment.notes}&rdquo;
          </p>
        </div>
      )}

      {/* 3. Transaction Metadata Preview (if customer entered reference) */}
      {payment.transaction_reference && (
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/20 border border-border/60 text-xs text-muted-foreground">
          <Hash className="size-4 text-[#FF6B35] shrink-0" />
          <span>
            {t("payment.txRefLabel")}:{" "}
            <strong className="text-foreground font-mono">
              {payment.transaction_reference}
            </strong>
          </span>
        </div>
      )}
    </div>
  );
}

