import React from "react";
import type { Metadata } from "next";
import { ProductsTable } from "@/components/admin/products/products-table";

export const metadata: Metadata = {
  title: "Products Management | PRINT STUDIO Ops",
  description: "Product catalog inventory, pricing, and visibility administration.",
};

export default function AdminProductsPage() {
  return <ProductsTable />;
}

