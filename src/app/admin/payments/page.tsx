import React from "react";
import type { Metadata } from "next";
import { PaymentsTable } from "@/components/admin/payments/payments-table";

export const metadata: Metadata = {
  title: "Payment Verification | PRINT STUDIO Ops",
  description: "Verify manual bank transfers, InstaPay, and Vodafone Cash payment receipts.",
};

export default function AdminPaymentsPage() {
  return <PaymentsTable />;
}

