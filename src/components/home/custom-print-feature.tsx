"use client";

import React from "react";
import Link from "next/link";
import {
  UploadCloud,
  FileCode,
  ArrowRight,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/layout/container";
import { useTranslation } from "@/lib/i18n/context";

export function CustomPrintFeature() {
  const { t } = useTranslation();

  return (
    <section className="py-16 sm:py-24 border-b border-border/60 bg-[#111318] text-white relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 end-0 w-96 h-96 bg-[#FF6B35]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 start-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      <Container size="xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Copy & Value Proposition */}
          <div className="lg:col-span-7 space-y-6">
            <Badge variant="electric" size="sm">
              {t("customPrint.badge")}
            </Badge>

            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              {t("customPrint.titleLine1")} <br />
              <span className="text-[#FF6B35]">{t("customPrint.titleHighlight")}</span>
            </h2>

            <p className="text-base sm:text-lg text-gray-300 leading-relaxed max-w-xl">
              {t("customPrint.description")}
            </p>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[#FF6B35]">
                  <CheckCircle2 className="size-4" />
                </div>
                <div>
                  <h4 className="font-heading text-sm font-bold text-white">
                    {t("customPrint.feature1Title")}
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                    {t("customPrint.feature1Desc")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[#FF6B35]">
                  <CheckCircle2 className="size-4" />
                </div>
                <div>
                  <h4 className="font-heading text-sm font-bold text-white">
                    {t("customPrint.feature2Title")}
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                    {t("customPrint.feature2Desc")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[#FF6B35]">
                  <CheckCircle2 className="size-4" />
                </div>
                <div>
                  <h4 className="font-heading text-sm font-bold text-white">
                    {t("customPrint.feature3Title")}
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                    {t("customPrint.feature3Desc")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[#FF6B35]">
                  <CheckCircle2 className="size-4" />
                </div>
                <div>
                  <h4 className="font-heading text-sm font-bold text-white">
                    {t("customPrint.feature4Title")}
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                    {t("customPrint.feature4Desc")}
                  </p>
                </div>
              </div>
            </div>

            {/* Direct CTA Button */}
            <div className="pt-4">
              <Button
                variant="default"
                size="lg"
                iconRight={<ArrowRight className="size-4 rtl:rotate-180" />}
                asChild
              >
                <Link href="/custom-prints" className="flex items-center gap-2">
                  <UploadCloud className="size-5" />
                  <span>{t("customPrint.cta")}</span>
                </Link>
              </Button>
            </div>
          </div>

          {/* Right Column: Visual Slicing & Quote Card Representation */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl border border-white/15 bg-[#1A1D24] p-6 shadow-2xl overflow-hidden">
              {/* Build plate grid background */}
              <div className="absolute inset-0 bg-studio-grid opacity-20 pointer-events-none" />

              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-[#FF6B35]/20 text-[#FF6B35]">
                    <FileCode className="size-4" />
                  </div>
                  <div>
                    <span className="block font-heading text-sm font-bold text-white">
                      {t("customPrint.cardTitle")}
                    </span>
                    <span className="block font-mono text-[10px] text-gray-400">
                      {t("customPrint.cardFormats")}
                    </span>
                  </div>
                </div>
                <Badge variant="charcoal" size="sm">
                  {t("customPrint.cardBadge")}
                </Badge>
              </div>

              {/* Simulated Sliced File Widget */}
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-white/10 text-[#FF6B35]">
                      <Layers className="size-5" />
                    </div>
                    <div>
                      <span className="block font-mono text-xs font-bold text-white truncate max-w-[180px] sm:max-w-[220px]">
                        {t("customPrint.fileName")}
                      </span>
                      <span className="block font-mono text-[10px] text-gray-400">
                        {t("customPrint.fileMeta")}
                      </span>
                    </div>
                  </div>
                  <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono text-emerald-400 border border-emerald-500/30">
                    {t("customPrint.verified")}
                  </span>
                </div>

                {/* Technical Parameter Chips */}
                <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                  <div className="rounded-lg bg-white/5 p-2 text-center border border-white/5">
                    <span className="text-[9px] text-gray-400 block">{t("customPrint.infillLabel")}</span>
                    <span className="font-bold text-white">{t("customPrint.infillValue")}</span>
                  </div>
                  <div className="rounded-lg bg-white/5 p-2 text-center border border-white/5">
                    <span className="text-[9px] text-gray-400 block">{t("customPrint.materialLabel")}</span>
                    <span className="font-bold text-[#FF6B35]">{t("customPrint.materialValue")}</span>
                  </div>
                  <div className="rounded-lg bg-white/5 p-2 text-center border border-white/5">
                    <span className="text-[9px] text-gray-400 block">{t("customPrint.estTimeLabel")}</span>
                    <span className="font-bold text-white">{t("customPrint.estTimeValue")}</span>
                  </div>
                </div>
              </div>

              {/* Quote Breakdown Output */}
              <div className="mt-5 space-y-2.5 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs font-mono">
                <div className="flex items-center justify-between text-gray-400">
                  <span>{t("customPrint.filamentConsumption")}</span>
                  <span className="text-white font-bold">{t("customPrint.filamentWeight")}</span>
                </div>
                <div className="flex items-center justify-between text-gray-400">
                  <span>{t("customPrint.machineTime")}</span>
                  <span className="text-white font-bold">{t("customPrint.machineHours")}</span>
                </div>
                <div className="flex items-center justify-between text-gray-400">
                  <span>{t("customPrint.postProcessing")}</span>
                  <span className="text-emerald-400">{t("customPrint.included")}</span>
                </div>
                <div className="border-t border-white/10 pt-2 flex items-center justify-between text-sm">
                  <span className="font-bold text-white">{t("customPrint.estimatedQuote")}</span>
                  <span className="font-bold text-[#FF6B35] text-base">210 {t("common.egp")}</span>
                </div>
              </div>

              {/* Upload Dropzone Preview Link */}
              <div className="mt-5">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-white/20 text-white hover:bg-white/10 justify-center"
                  asChild
                >
                  <Link href="/custom-prints">
                    {t("customPrint.portalCta")}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
