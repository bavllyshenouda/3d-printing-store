"use client";

import React from "react";
import Link from "next/link";
import {
  Lock,
  ArrowRight,
  ShieldCheck,
  Truck,
  CreditCard,
  UploadCloud,
  Cog,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartSummary as CartSummaryType } from "@/lib/cart/context";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

export interface CartSummaryCardProps {
  summary: CartSummaryType;
  className?: string;
}

export function CartSummaryCard({ summary, className }: CartSummaryCardProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs space-y-6 sticky top-24",
        className
      )}
    >
      <h2 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-foreground">
        {t("cart.orderSummary")}
      </h2>

      {/* Calculations Breakdown */}
      <div className="space-y-3 pb-4 border-b border-border/60 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{t("cart.subtotal")}</span>
          <span className="font-heading font-bold text-foreground">
            {summary.subtotal.toLocaleString()}{" "}
            <span className="text-xs font-normal text-muted-foreground">
              {t("common.egp")}
            </span>
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{t("cart.shipping")}</span>
          <span>{t("cart.shippingCalculated")}</span>
        </div>
      </div>

      {/* Total Line */}
      <div className="flex items-baseline justify-between pt-1">
        <span className="text-base font-bold text-foreground">
          {t("cart.orderTotal")}
        </span>
        <div className="text-end">
          <span className="font-heading text-2xl sm:text-3xl font-black text-foreground">
            {summary.subtotal.toLocaleString()}
          </span>
          <span className="text-sm font-semibold text-muted-foreground ms-1">
            {t("common.egp")}
          </span>
        </div>
      </div>

      {/* Checkout CTA Button */}
      <div className="pt-2">
        <Link
          href="/checkout"
          className={cn(summary.has_unavailable_items && "pointer-events-none opacity-50")}
        >
          <Button
            variant="default"
            size="default"
            disabled={summary.has_unavailable_items || summary.total_items === 0}
            className="w-full h-12 text-sm sm:text-base font-bold shadow-md"
            iconLeft={<Lock className="size-4" />}
            iconRight={<ArrowRight className="size-4 rtl:rotate-180" />}
          >
            {t("cart.proceedToCheckout")}
          </Button>
        </Link>
      </div>

      {/* Unavailable Items Alert */}
      {summary.has_unavailable_items && (
        <p className="text-xs text-red-500 text-center font-medium">
          {t("cart.itemUnavailable")}
        </p>
      )}

      {/* Studio Trust Points */}
      <div className="space-y-2.5 pt-4 border-t border-border/50 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-[#FF6B35] shrink-0" />
          <span>{t("cart.guaranteeNotice")}</span>
        </div>

        <div className="flex items-center gap-2">
          <Truck className="size-4 text-[#FF6B35] shrink-0" />
          <span>24-48h dispatch across Cairo and Giza.</span>
        </div>

        <div className="flex items-center gap-2">
          <CreditCard className="size-4 text-[#FF6B35] shrink-0" />
          <span>COD, InstaPay, and Vodafone Cash accepted.</span>
        </div>
      </div>

      {/* Custom 3D Print Upsell Prompt */}
      <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 text-xs space-y-2">
        <div className="flex items-center gap-1.5 font-bold text-foreground">
          <Cog className="size-3.5 text-[#FF6B35]" />
          <span>{t("cart.customPrintPrompt")}</span>
        </div>
        <Link
          href="/custom-prints"
          className="inline-flex items-center gap-1 text-[#FF6B35] font-semibold hover:underline"
        >
          <span>{t("cart.customPrintLink")}</span>
          <ArrowRight className="size-3 rtl:rotate-180" />
        </Link>
      </div>
    </div>
  );
}

