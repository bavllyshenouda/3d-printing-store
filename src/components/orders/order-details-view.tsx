"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/container";
import { OrderStatusBadge, PaymentStatusBadge } from "./order-status-badge";
import { OrderTimeline } from "./order-timeline";
import { OrderCancelModal } from "./order-cancel-modal";
import { OrderProofModal } from "./order-proof-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth/context";
import { useTranslation } from "@/lib/i18n/context";
import { getGovernorate } from "@/lib/constants/governorates";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  MapPin,
  Phone,
  User,
  CreditCard,
  Banknote,
  Smartphone,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  UploadCloud,
  Loader2,
  Box,
  ShieldCheck,
  FileText,
} from "lucide-react";
import type { Order, OrderItem, ShippingEvent } from "@/types/database";

export interface DetailedOrder extends Order {
  items: OrderItem[];
  shipping_events: ShippingEvent[];
}

export interface OrderDetailsViewProps {
  orderId: string;
}

export function OrderDetailsView({ orderId }: OrderDetailsViewProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, locale, isRTL } = useTranslation();

  const [order, setOrder] = useState<DetailedOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action states
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);

  // Protect route
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace(`/auth/login?redirect=/orders/${orderId}`);
    }
  }, [authLoading, isAuthenticated, router, orderId]);

  const fetchOrder = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Order not found");
      }

      setOrder(data.data.order);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error fetching order");
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrder();
    }
  }, [isAuthenticated, fetchOrder]);

  // Customer order confirmation
  const handleConfirmOrder = async () => {
    if (!order) return;
    setIsConfirming(true);

    try {
      const res = await fetch(`/api/orders/${order.id}/confirm`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to confirm order");
      }

      toast.success(t("orders.confirmOrderSuccess"));

      fetchOrder();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to confirm order");
    } finally {
      setIsConfirming(false);
    }
  };

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  if (isLoading) {
    return (
      <div className="py-12 bg-background min-h-[75vh]">
        <Container size="lg">
          <Skeleton className="h-6 w-32 mb-6 rounded-lg" />
          <Skeleton className="h-28 w-full rounded-3xl mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <Skeleton className="lg:col-span-8 h-96 rounded-3xl" />
            <Skeleton className="lg:col-span-4 h-96 rounded-3xl" />
          </div>
        </Container>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="py-16 bg-background min-h-[75vh]">
        <Container size="sm">
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-center space-y-4">
            <AlertTriangle className="size-8 text-red-500 mx-auto" />
            <h2 className="font-heading text-lg font-bold text-red-600 dark:text-red-400">
              {error || "Order not found"}
            </h2>
            <Link href="/orders">
              <Button variant="outline" size="default">
                {t("orders.backToOrders")}
              </Button>
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  const formattedDate = new Date(order.created_at).toLocaleDateString(
    locale === "ar" ? "ar-EG" : "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  const govObj = getGovernorate(order.governorate);
  const govDisplay = govObj ? (locale === "ar" ? govObj.ar : govObj.en) : order.governorate;

  const isPrepaid = ["instapay", "vodafone_cash"].includes(order.payment_method);
  const canUploadProof =
    isPrepaid &&
    order.payment_status !== "paid" &&
    !["cancelled", "rejected", "delivered"].includes(order.status);

  const canCancel = ![
    "delivered",
    "cancelled",
    "rejected",
  ].includes(order.status);

  return (
    <div className="py-8 sm:py-12 bg-background min-h-[85vh]">
      <Container size="lg">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group"
          >
            <BackIcon className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>{t("orders.backToOrders")}</span>
          </Link>
        </div>

        {/* Top Header Card */}
        <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 mb-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-heading text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                #{order.order_number}
              </h1>
              <OrderStatusBadge status={order.status} size="md" />
              <PaymentStatusBadge status={order.payment_status} size="md" />
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="size-3.5" />
              <span>{t("orders.placedOn", { date: formattedDate })}</span>
            </div>
          </div>

          {/* Quick Actions (Cancel or Confirm) */}
          <div className="flex items-center gap-3 flex-wrap">
            {canCancel && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCancelModalOpen(true)}
                className="text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/30"
                iconLeft={<XCircle className="size-4" />}
              >
                {t("orders.cancelOrderCta")}
              </Button>
            )}

            {order.status === "pending_customer_confirmation" && (
              <Button
                type="button"
                variant="default"
                size="sm"
                disabled={isConfirming}
                onClick={handleConfirmOrder}
                iconLeft={
                  isConfirming ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-4" />
                  )
                }
                className="shadow-sm font-bold"
              >
                {isConfirming ? t("orders.confirming") : t("orders.confirmOrderCta")}
              </Button>
            )}
          </div>
        </div>

        {/* 1. Special Banner: Customer Confirmation Required */}
        {order.status === "pending_customer_confirmation" && (
          <div className="rounded-3xl border border-[#FF6B35]/40 bg-[#FF6B35]/10 p-5 sm:p-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-[#FF6B35] text-white shrink-0 mt-0.5 shadow-xs">
                <CheckCircle2 className="size-5" />
              </div>
              <div>
                <h3 className="font-heading text-base font-bold text-foreground">
                  {t("orders.confirmBannerTitle")}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 max-w-xl">
                  {t("orders.confirmBannerDesc")}
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="default"
              size="default"
              disabled={isConfirming}
              onClick={handleConfirmOrder}
              iconLeft={
                isConfirming ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )
              }
              className="font-bold shadow-sm shrink-0"
            >
              {isConfirming ? t("orders.confirming") : t("orders.confirmOrderCta")}
            </Button>
          </div>
        )}

        {/* 2. Special Banner: Payment Proof Required (InstaPay / Vodafone Cash) */}
        {canUploadProof && (
          <div className="rounded-3xl border border-amber-500/40 bg-amber-500/10 p-5 sm:p-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-amber-500 text-white shrink-0 mt-0.5 shadow-xs">
                <UploadCloud className="size-5" />
              </div>
              <div>
                <h3 className="font-heading text-base font-bold text-foreground">
                  {t("orders.proofSectionTitle")}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 max-w-xl">
                  {t("orders.proofSectionDesc")}
                </p>
                <div className="mt-2 text-xs font-mono font-semibold text-foreground">
                  {order.payment_method === "instapay"
                    ? "IPN: printstudio@instapay"
                    : "Vodafone Cash: 01019882341"}
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="default"
              size="default"
              onClick={() => setIsProofModalOpen(true)}
              iconLeft={<UploadCloud className="size-4" />}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-sm shrink-0 border-none"
            >
              {t("orders.uploadProofCta")}
            </Button>
          </div>
        )}

        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (8 cols): Line Items & Shipping Timeline */}
          <div className="lg:col-span-8 space-y-8">
            {/* Ordered Products Table */}
            <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-5">
              <h2 className="font-heading text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                <Box className="size-5 text-[#FF6B35]" />
                <span>{t("orders.itemsSnapshot")}</span>
              </h2>

              <div className="divide-y divide-border/60">
                {order.items.map((item) => (
                  <div key={item.id} className="py-4 flex items-center gap-4">
                    {/* Thumbnail */}
                    <div className="relative size-16 sm:size-20 rounded-2xl overflow-hidden bg-muted/60 shrink-0 border border-border/60">
                      {item.product_image_url ? (
                        <Image
                          src={item.product_image_url}
                          alt={item.product_name}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-muted-foreground">
                          <Box className="size-7 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading text-sm sm:text-base font-bold text-foreground">
                        {item.product_name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className="text-[10px] py-0 px-2 font-mono font-medium border-border/60"
                        >
                          {item.color}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {item.quantity} × {item.unit_price} {order.currency || "EGP"}
                        </span>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-sm sm:text-base text-foreground">
                        {item.line_total} {order.currency || "EGP"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Calculation Lines */}
              <div className="pt-4 border-t border-border/80 space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("orders.summarySubtotal")}</span>
                  <span className="font-mono font-medium text-foreground">
                    {order.subtotal} {order.currency || "EGP"}
                  </span>
                </div>

                <div className="flex justify-between text-muted-foreground">
                  <span>{t("orders.summaryShipping")}</span>
                  <span className="font-mono font-medium text-foreground">
                    {order.shipping_fee > 0
                      ? `${order.shipping_fee} ${order.currency || "EGP"}`
                      : t("checkout.free")}
                  </span>
                </div>

                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-emerald-500">
                    <span>{t("orders.summaryDiscount")}</span>
                    <span className="font-mono font-medium">
                      -{order.discount_amount} {order.currency || "EGP"}
                    </span>
                  </div>
                )}

                <div className="flex justify-between pt-3 border-t border-border/60 text-base font-bold text-foreground">
                  <span>{t("orders.summaryGrandTotal")}</span>
                  <span className="font-mono text-[#FF6B35] font-black text-lg">
                    {order.total} {order.currency || "EGP"}
                  </span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-5">
              <h2 className="font-heading text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="size-5 text-[#FF6B35]" />
                <span>{t("orders.timelineTitle")}</span>
              </h2>

              <OrderTimeline events={order.shipping_events} />
            </div>
          </div>

          {/* Right Column (4 cols): Delivery Destination & Payment Details */}
          <div className="lg:col-span-4 space-y-6">
            {/* Delivery Destination */}
            <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
              <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <MapPin className="size-4 text-[#FF6B35]" />
                <span>{t("orders.shippingAddress")}</span>
              </h3>

              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <User className="size-3.5 text-muted-foreground" />
                  <span>
                    {order.customer_first_name} {order.customer_last_name}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground" dir="ltr">
                  <Phone className="size-3.5" />
                  <span className="font-mono">{order.customer_phone}</span>
                </div>

                <div className="pt-2 border-t border-border/60 text-foreground/90 leading-relaxed">
                  <p className="font-medium">{order.street_address}</p>
                  {(order.building || order.floor || order.apartment) && (
                    <p className="text-muted-foreground text-xs">
                      {[
                        order.building && `Bldg ${order.building}`,
                        order.floor && `Floor ${order.floor}`,
                        order.apartment && `Apt ${order.apartment}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                  <p className="text-muted-foreground text-xs mt-0.5">
                    {order.region}, {govDisplay}, {order.country}
                  </p>
                </div>

                {order.address_notes && (
                  <div className="pt-2">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">
                      {t("orders.customerNotes")}
                    </span>
                    <p className="text-xs text-muted-foreground italic bg-muted/30 p-2.5 rounded-xl border border-border/50">
                      &ldquo;{order.address_notes}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Details */}
            <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
              <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <CreditCard className="size-4 text-[#FF6B35]" />
                <span>{t("orders.paymentDetails")}</span>
              </h3>

              <div className="space-y-3 text-xs sm:text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("checkout.paymentMethodLabel")}</span>
                  <span className="font-bold uppercase text-foreground">
                    {order.payment_method.replace("_", " ")}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("checkout.paymentStatusLabel")}</span>
                  <PaymentStatusBadge status={order.payment_status} size="sm" />
                </div>

                <div className="pt-2">
                  <Link href={`/orders/${order.id}/payment`}>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full font-semibold border-border hover:border-[#FF6B35]"
                      iconLeft={<CreditCard className="size-3.5 text-[#FF6B35]" />}
                    >
                      {order.payment_method === "cod"
                        ? "View Payment Details"
                        : "Manage Payment & Proof"}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cancellation Modal */}
        <OrderCancelModal
          open={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          orderId={order.id}
          orderNumber={order.order_number}
          onSuccess={() => {
            fetchOrder();
          }}
        />

        {/* Proof Upload Modal */}
        <OrderProofModal
          open={isProofModalOpen}
          onClose={() => setIsProofModalOpen(false)}
          orderId={order.id}
          paymentMethod={order.payment_method}
          total={order.total}
          currency={order.currency}
          onSuccess={() => {
            fetchOrder();
          }}
        />
      </Container>
    </div>
  );
}
