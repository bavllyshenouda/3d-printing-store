"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/container";
import { CheckoutProgress, type CheckoutStep } from "./checkout-progress";
import { CheckoutAddressStep } from "./checkout-address-step";
import { CheckoutPaymentStep, type PaymentMethod } from "./checkout-payment-step";
import { CheckoutReviewStep } from "./checkout-review-step";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/context";
import { useCart } from "@/lib/cart/context";
import { useTranslation } from "@/lib/i18n/context";
import { getShippingFee } from "@/lib/constants/governorates";
import { ShoppingBag, ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import type { CustomerAddress } from "@/types/database";

export function CheckoutView() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { items: cartItems, summary, isLoading: cartLoading, refreshCart } = useCart();
  const { t, isRTL } = useTranslation();

  // Step state
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(1);

  // Form state
  const [selectedAddress, setSelectedAddress] = useState<CustomerAddress | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [deliveryNotes, setDeliveryNotes] = useState("");

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Derived financials
  const shippingFee = selectedAddress ? getShippingFee(selectedAddress.governorate) : 50;
  const subtotal = summary.subtotal;
  const discountAmount = 0;
  const total = Number((subtotal + shippingFee - discountAmount).toFixed(2));

  // Handle Order Placement
  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      setCurrentStep(1);
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const payload = {
        address_id: selectedAddress.id,
        payment_method: paymentMethod,
        shipping_fee: shippingFee,
        discount_amount: discountAmount,
        address_notes: deliveryNotes.trim() || null,
      };

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to place order. Please check stock and try again.");
      }

      // Synchronize cart state so navbar badge and cart view update immediately
      await refreshCart();

      const createdOrder = data.data?.order;
      const orderId = createdOrder?.id || (typeof data.data === "object" && data.data?.order_id);

      if (orderId) {
        router.push(`/checkout/success?order_id=${orderId}`);
      } else {
        router.push("/orders");
      }
    } catch (err: unknown) {
      setSubmissionError(
        err instanceof Error ? err.message : "An unexpected error occurred while placing order."
      );
      // Scroll to top to ensure error is visible
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (authLoading || cartLoading) {
    return (
      <div className="py-12 bg-background min-h-[75vh]">
        <Container size="lg">
          <Skeleton className="h-8 w-48 mb-8 mx-auto rounded-xl" />
          <Skeleton className="h-64 w-full rounded-3xl" />
        </Container>
      </div>
    );
  }

  // Empty cart guard
  if (cartItems.length === 0) {
    return (
      <div className="py-16 sm:py-24 bg-background min-h-[75vh] flex items-center justify-center">
        <Container size="sm">
          <div className="rounded-3xl border border-dashed border-border p-8 sm:p-12 text-center space-y-5">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-[#FF6B35]/10 text-[#FF6B35] mx-auto">
              <ShoppingBag className="size-8" />
            </div>
            <div>
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
                {t("checkout.emptyCartError")}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1.5">
                {t("cart.emptyDesc")}
              </p>
            </div>
            <Link href="/shop" className="inline-block">
              <Button variant="default" size="lg" className="font-bold">
                {t("cart.exploreCta")}
              </Button>
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="py-8 sm:py-12 bg-background min-h-[85vh]">
      <Container size="lg">
        {/* Breadcrumb to cart */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/cart"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group"
          >
            <BackIcon className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>{t("checkout.returnToCart")}</span>
          </Link>

          <div className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
            <ShieldCheck className="size-3.5 text-[#FF6B35]" />
            <span>TLS 256-bit Encrypted Checkout</span>
          </div>
        </div>

        {/* Stepper Progress */}
        <CheckoutProgress
          currentStep={currentStep}
          onStepClick={(step) => {
            // Only allow backward step navigation freely
            if (step < currentStep) {
              setCurrentStep(step);
            }
          }}
        />

        {/* Step Views */}
        <div className="max-w-3xl mx-auto">
          {currentStep === 1 && (
            <CheckoutAddressStep
              selectedAddress={selectedAddress}
              onSelectAddress={(addr) => setSelectedAddress(addr)}
              deliveryNotes={deliveryNotes}
              onChangeDeliveryNotes={(notes) => setDeliveryNotes(notes)}
              onContinue={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 2 && (
            <CheckoutPaymentStep
              paymentMethod={paymentMethod}
              onSelectPaymentMethod={(method) => setPaymentMethod(method)}
              onBack={() => setCurrentStep(1)}
              onContinue={() => setCurrentStep(3)}
            />
          )}

          {currentStep === 3 && selectedAddress && (
            <CheckoutReviewStep
              selectedAddress={selectedAddress}
              paymentMethod={paymentMethod}
              deliveryNotes={deliveryNotes}
              cartItems={cartItems}
              subtotal={subtotal}
              shippingFee={shippingFee}
              discountAmount={discountAmount}
              total={total}
              isSubmitting={isSubmitting}
              error={submissionError}
              onBackToAddress={() => setCurrentStep(1)}
              onBackToPayment={() => setCurrentStep(2)}
              onPlaceOrder={handlePlaceOrder}
            />
          )}
        </div>
      </Container>
    </div>
  );
}

