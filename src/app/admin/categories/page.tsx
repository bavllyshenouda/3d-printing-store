import React from "react";
import type { Metadata } from "next";
import { CategoriesTable } from "@/components/admin/categories/categories-table";

export const metadata: Metadata = {
  title: "Categories Management | PRINT STUDIO Ops",
  description: "Category taxonomy and product classification administration.",
};

export default function AdminCategoriesPage() {
  return <CategoriesTable />;
}

