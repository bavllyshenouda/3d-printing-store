import React from "react";
import type { Metadata } from "next";
import { CUSTOM_PRINTS_ENABLED } from "@/lib/config/features";
import { CustomPrintsComingSoon } from "@/components/custom-prints/coming-soon";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function CustomPrintsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!CUSTOM_PRINTS_ENABLED) {
    return <CustomPrintsComingSoon />;
  }

  return <>{children}</>;
}

