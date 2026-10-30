import { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";

export const metadata: Metadata = {
  title: "Shopping Cart | PrintStudio 3D",
  description:
    "Review your precision 3D-printed items, configure quantities, and proceed to secure checkout.",
};

export default function CartPage() {
  return <CartView />;
}

