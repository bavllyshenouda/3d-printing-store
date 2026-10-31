"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, UploadCloud, Box, Zap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { useTranslation } from "@/lib/i18n/context";

export function FinalCta() {
  const { t } = useTranslation();

  return (
    <section className="py-20 sm:py-28 relative overflow-hidden bg-background">
      <Container size="xl">
        <div className="relative rounded-3xl border border-white/10 bg-[#111318] p-8 sm:p-14 lg:p-16 text-white text-center shadow-2xl overflow-hidden">
          {/* Radial Orange Backdrop Accent */}
          <div
            className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-[#FF6B35]/20 blur-[130px]"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-studio-grid opacity-20 pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs text-[#FF6B35]">
              <Zap className="size-3.5" />
              <span>{t("finalCta.pill")}</span>
            </span>

            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              {t("finalCta.titleLine1")} <br className="hidden sm:inline" />
              <span className="text-[#FF6B35]">{t("finalCta.titleHighlight")}</span>
            </h2>

            <p className="text-base sm:text-lg text-gray-300 leading-relaxed max-w-2xl mx-auto">
              {t("finalCta.description")}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Button
                variant="default"
                size="lg"
                iconLeft={<UploadCloud className="size-5" />}
                iconRight={<ArrowRight className="size-4 rtl:rotate-180" />}
                asChild
                className="w-full sm:w-auto h-auto min-h-12 py-3"
              >
                <Link href="/custom-prints">
                  {t("finalCta.ctaUpload")}
                </Link>
              </Button>

              <Button
                variant="charcoal"
                size="lg"
                iconLeft={<Box className="size-4 text-[#FF6B35]" />}
                asChild
                className="border-white/20 hover:bg-white/10 text-white w-full sm:w-auto h-auto min-h-12 py-3"
              >
                <Link href="/products">
                  {t("finalCta.ctaCatalog")}
                </Link>
              </Button>
            </div>

            {/* Trust highlights */}
            <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-400 font-mono">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-emerald-400" />
                <span>{t("finalCta.trustTolerance")}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Zap className="size-4 text-[#FF6B35]" />
                <span>{t("finalCta.trustDispatch")}</span>
              </span>
              <span>•</span>
              <span>{t("finalCta.trustPayments")}</span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
