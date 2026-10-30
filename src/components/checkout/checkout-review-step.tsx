"use client";

import React from "react";
import Image from "next/image";
import {
  MapPin,
  CreditCard,
  Banknote,
  Smartphone,
  Wallet,
  ShieldCheck,
  Edit2,
  AlertCircle,
  Loader2,
  Box,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n/context";
import { getGovernorate } from "@/lib/constants/governorates";
import type { CustomerAddress } from "@/types/database";
import type { CartItem } from "@/lib/cart/context";
import type { PaymentMethod } from "./checkout-payment-step";

export interface CheckoutReviewStepProps {
  selectedAddress: CustomerAddress;
  paymentMethod: PaymentMethod;
  deliveryNotes: string;
  cartItems: CartItem[];
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  total: number;
  isSubmitting: boolean;
  error: string | null;
  onBackToAddress: () => void;
  onBackToPayment: () => void;
  onPlaceOrder: () => void;
}

export function CheckoutReviewStep({
  selectedAddress,
  paymentMethod,
  deliveryNotes,
  cartItems,
  subtotal,
  shippingFee,
  discountAmount,
  total,
  isSubmitting,
  error,
  onBackToAddress,
  onBackToPayment,
  onPlaceOrder,
}: CheckoutReviewStepProps) {
  const { t, locale, isRTL } = useTranslation();

  const govObj = getGovernorate(selectedAddress.governorate);
  const govDisplay = govObj ? (locale === "ar" ? govObj.ar : govObj.en) : selectedAddress.governorate;

  const paymentMethodLabel = {
    cod: t("checkout.codTitle"),
    instapay: t("checkout.instapayTitle"),
    vodafone_cash: t("checkout.vodafoneTitle"),
    online: t("checkout.onlineTitle"),
  }[paymentMethod];

  const PaymentIcon = {
    cod: Banknote,
    instapay: Smartphone,
    vodafone_cash: Wallet,
    online: CreditCard,
  }[paymentMethod];

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <ShieldCheck className="size-5 text-[#FF6B35]" />
          <span>{t("checkout.stepReview")}</span>
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          {t("checkout.authoritativeNotice")}
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-xs sm:text-sm animate-in fade-in"
        >
          <AlertCircle className="size-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">{t("common.error")}</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* 2-Column Summary Cards: Shipping Address & Payment Method */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Address Preview */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="size-3.5 text-[#FF6B35]" />
                {t("checkout.stepShipping")}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onBackToAddress}
                disabled={isSubmitting}
                className="h-7 px-2 text-xs text-[#FF6B35] hover:text-[#FF6B35]/80"
                iconLeft={<Edit2 className="size-3" />}
              >
                {t("checkout.editAddress")}
              </Button>
            </div>

            <p className="font-bold text-foreground text-sm">
              {selectedAddress.first_name} {selectedAddress.last_name}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5" dir="ltr">
              {selectedAddress.phone}
            </p>
            <p className="text-xs text-foreground/80 mt-1 leading-relaxed">
              {selectedAddress.street_address}
              {selectedAddress.building && ` · ${selectedAddress.building}`}
              {selectedAddress.apartment && ` · Apt ${selectedAddress.apartment}`}
            </p>
            <p className="text-xs text-muted-foreground">
              {selectedAddress.region}, {govDisplay}
            </p>

            {deliveryNotes && (
              <p className="text-[11px] text-muted-foreground italic mt-2 p-2 rounded-lg bg-muted/40 border border-border/40">
                &ldquo;{deliveryNotes}&rdquo;
              </p>
            )}
          </div>
        </div>

        {/* Payment Preview */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="size-3.5 text-[#FF6B35]" />
                {t("checkout.stepPayment")}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onBackToPayment}
                disabled={isSubmitting}
                className="h-7 px-2 text-xs text-[#FF6B35] hover:text-[#FF6B35]/80"
                iconLeft={<Edit2 className="size-3" />}
              >
                {t("checkout.editAddress")}
              </Button>
            </div>

            <div className="flex items-center gap-2.5 mt-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-[#FF6B35]/10 text-[#FF6B35]">
                <PaymentIcon className="size-4" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">
                  {paymentMethodLabel}
                </p>
                <p className="text-xs text-muted-foreground">
                  {paymentMethod === "cod"
                    ? t("checkout.codDesc")
                    : paymentMethod === "instapay"
                    ? "IPN: printstudio@instapay"
                    : paymentMethod === "vodafone_cash"
                    ? "Wallet: 01019882341"
                    : "Credit / Debit Card"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ordered Products Breakdown */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-6 space-y-4">
        <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-muted-foreground">
          {t("orders.itemsSnapshot")} ({cartItems.length})
        </h3>

        <div className="divide-y divide-border/60">
          {cartItems.map((item) => (
            <div key={item.id} className="py-3.5 flex items-center gap-4">
              {/* Product Thumbnail */}
              <div className="relative size-14 sm:size-16 rounded-xl overflow-hidden bg-muted/60 shrink-0 border border-border/60">
                {item.product?.primary_image ? (
                  <Image
                    src={item.product.primary_image}
                    alt={item.product.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-muted-foreground">
                    <Box className="size-6 text-muted-foreground/40" />
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-heading text-xs sm:text-sm font-bold text-foreground truncate">
                  {item.product?.name || "3D Printed Model"}
                </h4>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge
                    variant="outline"
                    className="text-[10px] py-0 px-2 font-mono font-medium border-border/60"
                  >
                    {item.color}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {item.quantity} × {item.unit_price} {t("common.egp")}
                  </span>
                </div>
              </div>

              {/* Line Total */}
              <div className="text-right shrink-0">
                <span className="font-mono font-bold text-xs sm:text-sm text-foreground">
                  {item.line_total} {t("common.egp")}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Totals Summary */}
        <div className="pt-4 border-t border-border/80 space-y-2 text-xs sm:text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>{t("checkout.subtotal")}</span>
            <span className="font-mono font-medium text-foreground">
              {subtotal} {t("common.egp")}
            </span>
          </div>

          <div className="flex justify-between text-muted-foreground">
            <span>{t("checkout.shippingFee")}</span>
            <span className="font-mono font-medium text-foreground">
              {shippingFee > 0 ? `${shippingFee} ${t("common.egp")}` : t("checkout.free")}
            </span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-emerald-500">
              <span>{t("checkout.discount")}</span>
              <span className="font-mono font-medium">
                -{discountAmount} {t("common.egp")}
              </span>
            </div>
          )}

          <div className="flex justify-between pt-2 border-t border-border/60 text-sm sm:text-base font-bold text-foreground">
            <span>{t("checkout.total")}</span>
            <span className="font-mono text-[#FF6B35] font-black text-base sm:text-lg">
              {total} {t("common.egp")}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border/60">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onBackToPayment}
          disabled={isSubmitting}
          iconLeft={<BackIcon className="size-4" />}
          className="w-full sm:w-auto"
        >
          {t("checkout.back")}
        </Button>

        <Button
          type="button"
          variant="default"
          size="lg"
          disabled={isSubmitting}
          onClick={onPlaceOrder}
          iconLeft={
            isSubmitting ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <ShieldCheck className="size-5" />
            )
          }
          className="w-full sm:w-auto font-bold h-12 px-8 shadow-sm"
        >
          {isSubmitting ? t("checkout.placingOrder") : t("checkout.placeOrder")}
        </Button>
      </div>
    </div>
  );
}

