import React from "react";
import type { Metadata } from "next";
import { WhatsAppLogsTable } from "@/components/admin/whatsapp/whatsapp-logs-table";

export const metadata: Metadata = {
  title: "WhatsApp Operations | PRINT STUDIO Ops",
  description: "Automated WhatsApp notification audit logs and manual broadcast dispatch.",
};

export default function AdminWhatsAppPage() {
  return <WhatsAppLogsTable />;
}

