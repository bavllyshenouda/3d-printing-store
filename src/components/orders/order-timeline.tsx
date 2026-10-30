"use client";

import React from "react";
import {
  Clock,
  CheckCircle,
  Cpu,
  Package,
  Truck,
  CheckCheck,
  XCircle,
  AlertTriangle,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n/context";
import type { ShippingEvent } from "@/types/database";

export interface OrderTimelineProps {
  events: ShippingEvent[];
  className?: string;
}

export function OrderTimeline({ events, className }: OrderTimelineProps) {
  const { t, locale } = useTranslation();

  if (!events || events.length === 0) {
    return (
      <div className="p-6 rounded-2xl border border-dashed border-border/80 bg-muted/10 text-center text-xs sm:text-sm text-muted-foreground space-y-2">
        <Info className="size-5 text-[#FF6B35] mx-auto opacity-70" />
        <p>{t("orders.noShippingEvents")}</p>
      </div>
    );
  }

  // Ensure chronological order
  const sorted = [...events].sort(
    (a, b) => new Date(a.event_time).getTime() - new Date(b.event_time).getTime()
  );

  const getEventIcon = (status: string) => {
    switch (status) {
      case "pending_customer_confirmation":
        return Clock;
      case "confirmed":
        return CheckCircle;
      case "processing":
        return Cpu;
      case "ready_to_ship":
        return Package;
      case "shipped":
        return Truck;
      case "delivered":
        return CheckCheck;
      case "cancelled":
        return XCircle;
      default:
        return CheckCircle;
    }
  };

  const formatTimestamp = (isoDate: string) => {
    try {
      const date = new Date(isoDate);
      return date.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
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

  return (
    <div className={cn("relative pl-6 sm:pl-8 space-y-6", className)}>
      {/* Vertical connecting line */}
      <div className="absolute top-2.5 bottom-2.5 left-2.5 sm:left-3.5 w-[2px] bg-border/80 -translate-x-1/2" />

      {sorted.map((event, idx) => {
        const isLatest = idx === sorted.length - 1;
        const Icon = getEventIcon(event.status);

        return (
          <div key={event.id || idx} className="relative group text-left">
            {/* Step Dot / Icon */}
            <div
              className={cn(
                "absolute -left-6 sm:-left-8 top-0.5 flex size-5 sm:size-7 items-center justify-center rounded-full border-2 transition-all -translate-x-1/2 bg-card",
                isLatest
                  ? "border-[#FF6B35] bg-[#FF6B35] text-white shadow-xs ring-4 ring-[#FF6B35]/20"
                  : "border-border/80 text-muted-foreground"
              )}
            >
              <Icon className={cn("size-3 sm:size-3.5", isLatest && "text-white")} />
            </div>

            {/* Event Content */}
            <div className="rounded-2xl border border-border/60 bg-card p-4 transition-all hover:border-border shadow-xs space-y-1.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="font-heading font-bold text-xs sm:text-sm text-foreground">
                  {event.description || event.status.replace("_", " ")}
                </span>
                <span className="text-[11px] font-mono text-muted-foreground whitespace-nowrap">
                  {formatTimestamp(event.event_time)}
                </span>
              </div>

              {/* Carrier & Tracking details */}
              {(event.carrier || event.tracking_number) && (
                <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground flex-wrap">
                  {event.carrier && (
                    <Badge variant="outline" className="text-[10px] py-0 px-2 font-mono">
                      {t("orders.carrier")}: {event.carrier}
                    </Badge>
                  )}
                  {event.tracking_number && (
                    <span className="font-mono text-xs text-[#FF6B35]">
                      {t("orders.trackingNumber")}: {event.tracking_number}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

