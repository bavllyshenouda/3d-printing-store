import { Metadata } from "next";
import { OrdersListView } from "@/components/orders/orders-list-view";

export const metadata: Metadata = {
  title: "My Orders | PrintStudio",
  description: "Track your 3D printing orders, view past jobs, and monitor delivery progress.",
};

export default function OrdersPage() {
  return <OrdersListView />;
}

