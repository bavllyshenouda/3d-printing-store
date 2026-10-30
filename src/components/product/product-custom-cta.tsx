"use client";

import React from "react";
import Link from "next/link";
import { UploadCloud, ArrowRight, Cog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/context";

export function ProductCustomCta() {
  const { t } = useTranslation();

  return (
    <div className="relative my-10 overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-r from-muted/60 via-muted/30 to-muted/60 p-6 sm:p-10 shadow-xs">
      {/* Background layer lines pattern */}
      <div className="absolute inset-0 bg-layer-lines opacity-30 pointer-events-none" />

      {/* Radial orange accent */}
      <div className="absolute -top-12 -end-12 size-48 rounded-full bg-[#FF6B35]/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#FF6B35]">
            <Cog className="size-4 animate-[spin_8s_linear_infinite]" />
            <span>{t("common.onDemand")}</span>
          </div>
          <h3 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {t("product.customCtaTitle")}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t("product.customCtaDesc")}
          </p>
        </div>

        <Link href="/custom-prints" className="shrink-0">
          <Button
            variant="default"
            size="default"
            iconLeft={<UploadCloud className="size-4" />}
            iconRight={<ArrowRight className="size-4 rtl:rotate-180" />}
            className="shadow-sm"
          >
            {t("product.customCtaButton")}
          </Button>
        </Link>
      </div>
    </div>
  );
}

