import React from "react";
import type { Metadata } from "next";
import { AdminOrderDetailsView } from "@/components/admin/orders/admin-order-details-view";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Order Operations #${id.slice(0, 8)} | PRINT STUDIO Ops`,
  };
}

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  return <AdminOrderDetailsView orderId={id} />;
}

