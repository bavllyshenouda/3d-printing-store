import { Metadata } from "next";
import { CheckoutView } from "@/components/checkout/checkout-view";

export const metadata: Metadata = {
  title: "Checkout | PrintStudio",
  description: "Secure engineering checkout for precision 3D printing orders and rapid local delivery.",
};

export default function CheckoutPage() {
  return <CheckoutView />;
}

