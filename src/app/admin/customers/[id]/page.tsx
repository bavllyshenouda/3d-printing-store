import React from "react";
import type { Metadata } from "next";
import { CustomerDetailsView } from "@/components/admin/customers/customer-details-view";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Customer Profile #${id.slice(0, 8)} | PRINT STUDIO Ops`,
  };
}

export default async function AdminCustomerDetailPage({ params }: Props) {
  const { id } = await params;
  return <CustomerDetailsView customerId={id} />;
}

