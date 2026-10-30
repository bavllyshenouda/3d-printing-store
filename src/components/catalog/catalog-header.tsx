"use client";

import React from "react";
import { Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/layout/container";
import { useTranslation } from "@/lib/i18n/context";

export function CatalogHeader() {
  const { t } = useTranslation();

  return (
    <div className="relative border-b border-border/60 bg-muted/20 py-12 sm:py-16 overflow-hidden">
      {/* Background layer lines pattern */}
      <div className="absolute inset-0 bg-layer-lines opacity-40 pointer-events-none" />

      {/* Subtle radial glow */}
      <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 size-96 rounded-full bg-[#FF6B35]/5 blur-3xl pointer-events-none" />

      <Container size="xl" className="relative z-10">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          <Badge
            variant="electric"
            size="sm"
            className="mb-3 px-3 py-1 font-mono uppercase tracking-wider text-xs flex items-center gap-1.5"
          >
            <Layers className="size-3.5" />
            <span>{t("catalog.badge")}</span>
          </Badge>

          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            {t("catalog.pageTitle")}
          </h1>

          <p className="mt-3 text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
            {t("catalog.pageSubtitle")}
          </p>
        </div>
      </Container>
    </div>
  );
}
