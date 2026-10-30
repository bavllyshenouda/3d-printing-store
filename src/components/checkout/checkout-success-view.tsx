"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/lib/i18n/context";
import {
  CheckCircle2,
  Package,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  Wallet,
  Clock,
  MapPin,
  ExternalLink,
} from "lucide-react";
import type { Order } from "@/types/database";

export function CheckoutSuccessView() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const { t, isRTL } = useTranslation();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(orderId));

  useEffect(() => {
    if (!orderId) {
      setIsLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const data = await res.json();
        if (res.ok && data.success && data.data?.order) {
          setOrder(data.data.order);
        }
      } catch {
        // Fallback silently to generic success view
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const NextIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div className="py-12 sm:py-20 bg-background min-h-[80vh] flex items-center justify-center">
      <Container size="default">
        <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-12 shadow-sm text-center space-y-6">
          {/* Animated Success Icon */}
          <div className="flex size-16 sm:size-20 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-500 mx-auto ring-8 ring-emerald-500/5 animate-in zoom-in-75 duration-300">
            <CheckCircle2 className="size-8 sm:size-10" />
          </div>

          {/* Heading & Subtitle */}
          <div className="space-y-2 max-w-lg mx-auto">
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {t("checkout.successTitle")}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {t("checkout.successSubtitle")}
            </p>
          </div>

          {/* Order Details Card */}
          {isLoading ? (
            <Skeleton className="h-44 w-full rounded-2xl" />
          ) : order ? (
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-5 text-left text-xs sm:text-sm space-y-3.5 max-w-md mx-auto">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <span className="text-muted-foreground">{t("checkout.orderNumber")}</span>
                <span className="font-mono font-bold text-foreground text-sm sm:text-base text-[#FF6B35]">
                  #{order.order_number}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("checkout.paymentMethodLabel")}</span>
                <span className="font-semibold uppercase text-foreground">
                  {order.payment_method.replace("_", " ")}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("checkout.paymentStatusLabel")}</span>
                <Badge
                  variant="outline"
                  className="text-[10px] py-0 px-2 font-mono font-semibold"
                >
                  {order.payment_status}
                </Badge>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/60 font-bold">
                <span className="text-foreground">{t("checkout.total")}</span>
                <span className="font-mono text-[#FF6B35] text-base">
                  {order.total} {order.currency || "EGP"}
                </span>
              </div>
            </div>
          ) : null}

          {/* Payment Instructions for InstaPay / Vodafone Cash */}
          {order && (order.payment_method === "instapay" || order.payment_method === "vodafone_cash") && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 sm:p-5 text-left max-w-md mx-auto space-y-3">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs sm:text-sm">
                {order.payment_method === "instapay" ? (
                  <Smartphone className="size-4 shrink-0" />
                ) : (
                  <Wallet className="size-4 shrink-0" />
                )}
                <span>{t("checkout.pendingPaymentActionTitle")}</span>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                {t("checkout.pendingPaymentActionDesc")}
              </p>
              <div className="p-3 rounded-xl bg-card border border-border/60 text-xs font-mono font-semibold text-foreground select-all">
                {order.payment_method === "instapay"
                  ? "printstudio@instapay (National Bank of Egypt)"
                  : "Vodafone Cash Wallet: 01019882341"}
              </div>

              <div className="pt-1">
                <Link href={`/orders/${order.id}/payment`}>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold"
                  >
                    Go to Payment Portal & Upload Receipt
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            {orderId && (
              <Link href={`/orders/${orderId}`} className="w-full sm:w-auto">
                <Button
                  variant="default"
                  size="lg"
                  className="w-full sm:w-auto font-bold shadow-sm"
                  iconRight={<NextIcon className="size-4" />}
                >
                  {t("checkout.viewOrderDetails")}
                </Button>
              </Link>
            )}

            <Link href="/shop" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto font-medium"
                iconLeft={<ShoppingBag className="size-4" />}
              >
                {t("checkout.continueShopping")}
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
