"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  UploadCloud,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { CUSTOM_PRINTS_ENABLED } from "@/lib/config/features";
import { CustomPrintLink } from "@/components/common/custom-print-link";
import { useTranslation } from "@/lib/i18n/context";

export function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden pt-8 pb-16 sm:pt-16 sm:pb-24 border-b border-border/60 bg-studio-grid">
      {/* Background Radial Glow */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full bg-[#FF6B35]/12 blur-[120px] -z-10"
        aria-hidden="true"
      />

      <Container size="xl">
        <div className="max-w-3xl flex flex-col items-start gap-6">
          {/* Live Telemetry Pill */}
          <div className="flex items-center gap-2 rounded-full border border-border/80 bg-white/80 dark:bg-[#1A1D24]/80 px-3.5 py-1.5 backdrop-blur-md shadow-sm">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="font-mono text-xs font-medium text-foreground">
              {t("hero.pillStatus")}
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.12]">
            {t("hero.titleLine1")}{" "}
            <span className="text-[#FF6B35]">{t("hero.titleHighlight")}</span>
          </h1>

          {/* Supporting Description */}
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
            {t("hero.description")}
          </p>

          {/* Dual CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2 w-full sm:w-auto">
            <Button
              variant="default"
              size="lg"
              iconRight={<ArrowRight className="size-4 rtl:rotate-180" />}
              asChild
              className="w-full sm:w-auto"
            >
              <Link href="/products">{t("hero.ctaCatalog")}</Link>
            </Button>

            {CUSTOM_PRINTS_ENABLED ? (
              <Button
                variant="charcoal"
                size="lg"
                iconLeft={<UploadCloud className="size-4 text-[#FF6B35]" />}
                asChild
                className="w-full sm:w-auto border-border/80"
              >
                <Link href="/custom-prints">{t("hero.ctaCustom")}</Link>
              </Button>
            ) : (
              <CustomPrintLink
                href="/custom-prints"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-muted/40 hover:bg-muted/60 px-5 py-3 text-sm font-semibold text-foreground transition-colors"
              >
                <UploadCloud className="size-4 text-[#FF6B35]" />
                <span>{t("hero.ctaCustom")}</span>
              </CustomPrintLink>
            )}
          </div>

          {/* Engineering Highlights Strip */}
          <div className="pt-4 border-t border-border/60 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-[#FF6B35] shrink-0" />
              <span>{t("hero.specTolerances")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-[#FF6B35] shrink-0" />
              <span>{t("hero.specMaterials")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-[#FF6B35] shrink-0" />
              <span>{t("hero.specQuote")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-[#FF6B35] shrink-0" />
              <span>{t("hero.specPayments")}</span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
