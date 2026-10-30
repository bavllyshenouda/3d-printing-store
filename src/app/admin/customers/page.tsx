import React from "react";
import type { Metadata } from "next";
import { CustomersTable } from "@/components/admin/customers/customers-table";

export const metadata: Metadata = {
  title: "Customers Directory | PRINT STUDIO Ops",
  description: "Customer accounts, profiles, and order histories.",
};

export default function AdminCustomersPage() {
  return <CustomersTable />;
}

