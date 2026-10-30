"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n/context";
import {
  Clock,
  CheckCircle,
  Cpu,
  Package,
  Truck,
  CheckCheck,
  XCircle,
  AlertTriangle,
  CreditCard,
  FileCheck,
} from "lucide-react";

export interface OrderStatusBadgeProps {
  status: string;
  className?: string;
  size?: "sm" | "md";
}

export function OrderStatusBadge({
  status,
  className,
  size = "md",
}: OrderStatusBadgeProps) {
  const { t } = useTranslation();

  const getStatusConfig = (s: string) => {
    switch (s) {
      case "pending_customer_confirmation":
        return {
          label: t("orders.status_pending_customer_confirmation"),
          icon: Clock,
          classes:
            "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
        };
      case "confirmed":
        return {
          label: t("orders.status_confirmed"),
          icon: CheckCircle,
          classes:
            "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
        };
      case "processing":
        return {
          label: t("orders.status_processing"),
          icon: Cpu,
          classes:
            "bg-[#FF6B35]/10 text-[#FF6B35] border-[#FF6B35]/30",
        };
      case "ready_to_ship":
        return {
          label: t("orders.status_ready_to_ship"),
          icon: Package,
          classes:
            "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
        };
      case "shipped":
        return {
          label: t("orders.status_shipped"),
          icon: Truck,
          classes:
            "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
        };
      case "delivered":
        return {
          label: t("orders.status_delivered"),
          icon: CheckCheck,
          classes:
            "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
        };
      case "cancelled":
        return {
          label: t("orders.status_cancelled"),
          icon: XCircle,
          classes:
            "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
        };
      case "rejected":
        return {
          label: t("orders.status_rejected"),
          icon: AlertTriangle,
          classes:
            "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
        };
      default:
        return {
          label: s.replace("_", " "),
          icon: Clock,
          classes: "bg-muted text-muted-foreground border-border",
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-semibold inline-flex items-center gap-1.5 transition-colors border",
        size === "sm" ? "text-[10px] py-0 px-2" : "text-xs py-0.5 px-2.5",
        config.classes,
        className
      )}
    >
      <Icon className={size === "sm" ? "size-3" : "size-3.5"} />
      <span>{config.label}</span>
    </Badge>
  );
}

export interface PaymentStatusBadgeProps {
  status: string;
  className?: string;
  size?: "sm" | "md";
}

export function PaymentStatusBadge({
  status,
  className,
  size = "md",
}: PaymentStatusBadgeProps) {
  const { t } = useTranslation();

  const getConfig = (s: string) => {
    switch (s) {
      case "paid":
        return {
          label: t("orders.payment_paid"),
          icon: CheckCircle,
          classes:
            "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
        };
      case "awaiting_verification":
        return {
          label: t("orders.payment_awaiting_verification"),
          icon: FileCheck,
          classes:
            "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
        };
      case "pending":
        return {
          label: t("orders.payment_pending"),
          icon: Clock,
          classes:
            "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
        };
      case "failed":
        return {
          label: t("orders.payment_failed"),
          icon: AlertTriangle,
          classes:
            "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
        };
      case "refunded":
        return {
          label: t("orders.payment_refunded"),
          icon: CreditCard,
          classes: "bg-muted text-muted-foreground border-border",
        };
      default:
        return {
          label: s,
          icon: CreditCard,
          classes: "bg-muted text-muted-foreground border-border",
        };
    }
  };

  const config = getConfig(status);
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-semibold inline-flex items-center gap-1.5 transition-colors border",
        size === "sm" ? "text-[10px] py-0 px-2" : "text-xs py-0.5 px-2.5",
        config.classes,
        className
      )}
    >
      <Icon className={size === "sm" ? "size-3" : "size-3.5"} />
      <span>{config.label}</span>
    </Badge>
  );
}

