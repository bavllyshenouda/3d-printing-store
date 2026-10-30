import { Metadata } from "next";
import { OrderDetailsView } from "@/components/orders/order-details-view";

export const metadata: Metadata = {
  title: "Order Details & Live Telemetry | PrintStudio",
  description: "View real-time production, slicing progress, and shipping milestones for your 3D print order.",
};

interface OrderDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  const { id } = await params;
  return <OrderDetailsView orderId={id} />;
}

