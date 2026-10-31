"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/container";
import { PaymentMethodInstructions } from "./payment-method-instructions";
import { PaymentStatusCard } from "./payment-status-card";
import { PaymentProofUpload } from "./payment-proof-upload";
import { PaymentProofPreview } from "./payment-proof-preview";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/context";
import { useTranslation } from "@/lib/i18n/context";
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CreditCard,
  CheckCircle2,
} from "lucide-react";
import type { Order, Payment } from "@/types/database";

export interface PaymentExperienceProps {
  orderId: string;
}

export function PaymentExperience({ orderId }: PaymentExperienceProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, isRTL } = useTranslation();

  const [payment, setPayment] = useState<Payment | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Re-upload state toggle
  const [isReuploading, setIsReuploading] = useState(false);

  // Protect route
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace(`/auth/login?redirect=/orders/${orderId}/payment`);
    }
  }, [authLoading, isAuthenticated, router, orderId]);

  const fetchPaymentData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch order details to know order number and status
      const orderRes = await fetch(`/api/orders/${orderId}`);
      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.success || !orderData.data?.order) {
        throw new Error(orderData.error || "Order not found");
      }
      setOrder(orderData.data.order);

      // 2. Fetch or create payment record
      const payRes = await fetch(`/api/orders/${orderId}/payment`);
      const payData = await payRes.json();

      if (!payRes.ok || !payData.success || !payData.data?.payment) {
        throw new Error(payData.error || "Payment record not found");
      }
      setPayment(payData.data.payment);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading payment details");
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPaymentData();
    }
  }, [isAuthenticated, fetchPaymentData]);

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  if (isLoading) {
    return (
      <div className="py-12 bg-background min-h-[75vh]">
        <Container size="lg">
          <Skeleton className="h-6 w-32 mb-6 rounded-lg" />
          <Skeleton className="h-32 w-full rounded-3xl mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <Skeleton className="lg:col-span-6 h-80 rounded-3xl" />
            <Skeleton className="lg:col-span-6 h-80 rounded-3xl" />
          </div>
        </Container>
      </div>
    );
  }

  if (error || !payment || !order) {
    return (
      <div className="py-16 bg-background min-h-[75vh]">
        <Container size="sm">
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-center space-y-4">
            <AlertCircle className="size-8 text-red-500 mx-auto" />
            <h2 className="font-heading text-lg font-bold text-red-600 dark:text-red-400">
              {error || "Unable to load payment experience"}
            </h2>
            <Link href={`/orders/${orderId}`}>
              <Button variant="outline" size="default">
                {t("orders.backToOrders")}
              </Button>
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  const isCod = order.payment_method === "cod";
  const hasProof = Boolean(payment.proof_storage_path);
  const isPaid = payment.status === "paid";
  const isFailed = payment.status === "failed";
  const isAwaiting = payment.status === "awaiting_verification";

  return (
    <div className="py-8 sm:py-12 bg-background min-h-[85vh]">
      <Container size="lg">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href={`/orders/${order.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group"
          >
            <BackIcon className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Order #{order.order_number}</span>
          </Link>

          <div className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
            <ShieldCheck className="size-3.5 text-[#FF6B35]" />
            <span>Authorized Payment Gateway</span>
          </div>
        </div>

        {/* Page Title */}
        <div className="mb-8 text-start">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {t("payment.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("payment.subtitle")}
          </p>
        </div>

        {/* 1. Authoritative Total & Status Card */}
        <PaymentStatusCard
          payment={payment}
          orderNumber={order.order_number}
          className="mb-8"
        />

        {/* 2. 2-Column Section: Instructions on Left, Proof/Actions on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Method Instructions (Left 6 Columns) */}
          <div className="lg:col-span-6 space-y-6">
            <PaymentMethodInstructions
              method={order.payment_method}
              amount={payment.amount}
              currency={payment.currency}
            />
          </div>

          {/* Proof Action / Preview (Right 6 Columns) */}
          <div className="lg:col-span-6 space-y-6">
            {isCod ? (
              // COD notice: No proof upload permitted
              <div className="rounded-3xl border border-border/80 bg-card p-6 text-center space-y-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 mx-auto">
                  <CheckCircle2 className="size-6" />
                </div>
                <h3 className="font-heading text-base font-bold text-foreground">
                  Cash on Delivery Confirmed
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  No payment proof is needed for Cash on Delivery. Your order will be settled in cash with the courier upon arrival.
                </p>
                <Link href={`/orders/${order.id}`} className="inline-block pt-2">
                  <Button variant="outline" size="sm">
                    View Live Order Milestones
                  </Button>
                </Link>
              </div>
            ) : isPaid ? (
              // Paid state: Show preview without re-upload option
              <PaymentProofPreview
                orderId={order.id}
                canReupload={false}
              />
            ) : hasProof && !isReuploading && !isFailed ? (
              // Awaiting verification state: Show preview with option to re-upload if desired
              <PaymentProofPreview
                orderId={order.id}
                onStartReupload={() => setIsReuploading(true)}
                canReupload={true}
              />
            ) : (
              // Pending, Failed, or explicit re-upload state: Show upload form
              <div className="space-y-4">
                {hasProof && isFailed && !isReuploading && (
                  <PaymentProofPreview
                    orderId={order.id}
                    onStartReupload={() => setIsReuploading(true)}
                    canReupload={false}
                    className="mb-4"
                  />
                )}

                <PaymentProofUpload
                  orderId={order.id}
                  isReupload={hasProof || isReuploading || isFailed}
                  onCancelReupload={
                    hasProof && !isFailed ? () => setIsReuploading(false) : undefined
                  }
                  onUploadSuccess={() => {
                    setIsReuploading(false);
                    fetchPaymentData();
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}

