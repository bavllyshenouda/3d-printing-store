import React from "react";
import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/layout/admin-shell";

export const metadata: Metadata = {
  title: "Admin Operations | PRINT STUDIO 3D",
  description: "Administrative console and studio management portal.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}

