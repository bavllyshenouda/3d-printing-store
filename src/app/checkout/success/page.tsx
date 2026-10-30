import { Suspense } from "react";
import { Metadata } from "next";
import { CheckoutSuccessView } from "@/components/checkout/checkout-success-view";
import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Order Placed Successfully | PrintStudio",
  description: "Your 3D printing order has been confirmed and queued for production.",
};

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 bg-background min-h-[75vh]">
          <Container size="default">
            <Skeleton className="h-96 w-full rounded-3xl" />
          </Container>
        </div>
      }
    >
      <CheckoutSuccessView />
    </Suspense>
  );
}
