import { Metadata } from "next";
import { PaymentExperience } from "@/components/payment/payment-experience";

export const metadata: Metadata = {
  title: "Secure Payment & Transfer Verification | PrintStudio",
  description: "Transfer instructions, proof submission, and live payment verification status.",
};

interface PaymentPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderPaymentPage({ params }: PaymentPageProps) {
  const { id } = await params;
  return <PaymentExperience orderId={id} />;
}

