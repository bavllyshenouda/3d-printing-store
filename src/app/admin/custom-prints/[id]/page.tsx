import React from "react";
import type { Metadata } from "next";
import { AdminCustomPrintDetailsView } from "@/components/admin/custom-prints/admin-custom-print-details-view";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Custom Print #${id.slice(0, 8)} | PRINT STUDIO Ops`,
  };
}

export default async function AdminCustomPrintDetailPage({ params }: Props) {
  const { id } = await params;
  return <AdminCustomPrintDetailsView requestId={id} />;
}

