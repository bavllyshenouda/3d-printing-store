import React from "react";
import type { Metadata } from "next";
import { CustomPrintsTable } from "@/components/admin/custom-prints/custom-prints-table";

export const metadata: Metadata = {
  title: "Custom 3D Prints | PRINT STUDIO Ops",
  description: "Review custom 3D model submissions, CAD meshes, and client quotes.",
};

export default function AdminCustomPrintsPage() {
  return <CustomPrintsTable />;
}

