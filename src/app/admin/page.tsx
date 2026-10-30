import React from "react";
import type { Metadata } from "next";
import { AdminOverviewView } from "@/components/admin/overview/admin-overview-view";

export const metadata: Metadata = {
  title: "Dashboard Overview | PRINT STUDIO Ops",
  description: "Operational metrics and studio activity overview.",
};

export default function AdminOverviewPage() {
  return <AdminOverviewView />;
}

