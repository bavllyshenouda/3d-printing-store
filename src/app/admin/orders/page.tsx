import React from "react";
import type { Metadata } from "next";
import { OrdersTable } from "@/components/admin/orders/orders-table";

export const metadata: Metadata = {
  title: "Orders Management | PRINT STUDIO Ops",
  description: "Fulfillment operations, order pipeline, and shipping tracking.",
};

export default function AdminOrdersPage() {
  return <OrdersTable />;
}

