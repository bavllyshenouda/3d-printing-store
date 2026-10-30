"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  CreditCard,
  Box,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OrderStatusBadge, PaymentStatusBadge } from "./order-status-badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/context";
import type { Order, OrderItem } from "@/types/database";

export interface OrderWithItems extends Order {
  items?: OrderItem[];
}

export interface OrderCardProps {
  order: OrderWithItems;
  className?: string;
}

export function OrderCard({ order, className }: OrderCardProps) {
  const { t, locale, isRTL } = useTranslation();

  const formattedDate = new Date(order.created_at).toLocaleDateString(
    locale === "ar" ? "ar-EG" : "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );

  const items = order.items || [];
  const itemCount = items.reduce((sum, it) => sum + (it.quantity || 1), 0);
  const NextIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-card p-5 sm:p-6 transition-all hover:border-[#FF6B35]/40 hover:shadow-xs space-y-4",
        className
      )}
    >
      {/* Card Header: Order Number, Date & Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-heading font-black text-foreground text-base sm:text-lg">
              #{order.order_number}
            </span>
            <OrderStatusBadge status={order.status} size="sm" />
            <PaymentStatusBadge status={order.payment_status} size="sm" />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="size-3.5" />
            <span>{t("orders.placedOn", { date: formattedDate })}</span>
          </div>
        </div>

        {/* Total Price */}
        <div className="text-left sm:text-right">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">
            {t("orders.total")}
          </span>
          <span className="font-mono text-base sm:text-lg font-black text-[#FF6B35]">
            {order.total} {order.currency || "EGP"}
          </span>
        </div>
      </div>

      {/* Item Previews & Details */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Thumbnails row */}
        <div className="flex items-center gap-2.5 overflow-x-auto py-1">
          {items.slice(0, 4).map((it) => (
            <div
              key={it.id}
              className="relative size-12 rounded-xl overflow-hidden bg-muted/60 border border-border/60 shrink-0"
              title={`${it.product_name} (${it.color})`}
            >
              {it.product_image_url ? (
                <Image
                  src={it.product_image_url}
                  alt={it.product_name}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-muted-foreground">
                  <Box className="size-5 text-muted-foreground/40" />
                </div>
              )}
            </div>
          ))}

          {items.length > 4 && (
            <div className="flex size-12 items-center justify-center rounded-xl bg-muted/80 border border-border/60 text-xs font-bold text-muted-foreground shrink-0">
              +{items.length - 4}
            </div>
          )}

          <div className="text-xs text-muted-foreground pl-1">
            <span className="font-semibold text-foreground">
              {itemCount} {t("orders.items")}
            </span>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {order.payment_method.replace("_", " ")}
            </p>
          </div>
        </div>

        {/* View Details Action */}
        <Link href={`/orders/${order.id}`} className="shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full sm:w-auto font-semibold hover:border-[#FF6B35] hover:text-[#FF6B35]"
            iconRight={<NextIcon className="size-3.5" />}
          >
            {t("orders.viewDetails")}
          </Button>
        </Link>
      </div>
    </div>
  );
}

