"use client";

import React from "react";
import Link from "next/link";
import {
  UploadCloud,
  SlidersHorizontal,
  Truck,
  ArrowRight,
  Phone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { useTranslation } from "@/lib/i18n/context";

export function HowItWorks() {
  const { t } = useTranslation();

  const steps = [
    {
      step: t("howItWorks.step1Num"),
      title: t("howItWorks.step1Title"),
      subtitle: t("howItWorks.step1Subtitle"),
      description: t("howItWorks.step1Desc"),
      icon: <UploadCloud className="size-6 text-[#FF6B35]" />,
      action: {
        label: t("howItWorks.step1Cta"),
        href: "/custom-prints",
      },
    },
    {
      step: t("howItWorks.step2Num"),
      title: t("howItWorks.step2Title"),
      subtitle: t("howItWorks.step2Subtitle"),
      description: t("howItWorks.step2Desc"),
      icon: <SlidersHorizontal className="size-6 text-[#FF6B35]" />,
      action: {
        label: t("howItWorks.step2Cta"),
        href: "/materials",
      },
    },
    {
      step: t("howItWorks.step3Num"),
      title: t("howItWorks.step3Title"),
      subtitle: t("howItWorks.step3Subtitle"),
      description: t("howItWorks.step3Desc"),
      icon: <Truck className="size-6 text-[#FF6B35]" />,
      action: {
        label: t("howItWorks.step3Cta"),
        href: "/orders",
      },
    },
  ];

  return (
    <section className="py-16 sm:py-24 border-b border-border/60 bg-muted/10">
      <Container size="xl">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-16">
          <Badge variant="electric" size="sm" className="mb-2">
            {t("howItWorks.badge")}
          </Badge>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            {t("howItWorks.title")}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-2 leading-relaxed">
            {t("howItWorks.description")}
          </p>
        </div>

        {/* 3-Step Interactive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector Line (visible on desktop) */}
          <div
            className="hidden md:block absolute top-1/2 start-[15%] end-[15%] -translate-y-12 h-0.5 bg-gradient-to-r from-[#FF6B35]/20 via-[#FF6B35]/50 to-[#FF6B35]/20 -z-0"
            aria-hidden="true"
          />

          {steps.map((item) => (
            <Card
              key={item.step}
              variant="interactive"
              className="relative z-10 flex flex-col justify-between p-8 bg-white dark:bg-[#1A1D24] shadow-soft border-border/80 transition-all duration-300"
            >
              <div>
                {/* Step Number & Icon */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex size-14 items-center justify-center rounded-2xl border border-border/80 bg-muted/30 shadow-sm">
                    {item.icon}
                  </div>
                  <span className="font-heading text-3xl font-black text-muted-foreground/30">
                    {item.step}
                  </span>
                </div>

                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#FF6B35] block mb-1">
                  {item.subtitle}
                </span>

                <h3 className="font-heading text-xl font-bold text-foreground">
                  {item.title}
                </h3>

                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Action Button */}
              <div className="mt-8 pt-4 border-t border-border/50">
                <Button variant="ghost" size="sm" asChild className="p-0 h-auto text-xs text-[#FF6B35] hover:text-[#E85A26]">
                  <Link href={item.action.href} className="flex items-center gap-1 font-semibold">
                    <span>{item.action.label}</span>
                    <ArrowRight className="size-3.5 rtl:rotate-180" />
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* WhatsApp Real-Time Notification Callout */}
        <div className="mt-12 rounded-2xl border border-border/80 bg-white dark:bg-[#1A1D24] p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <Phone className="size-5" />
            </div>
            <div>
              <h4 className="font-heading text-sm font-bold text-foreground">
                {t("howItWorks.whatsappAlertTitle")}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("howItWorks.whatsappAlertDesc")}
              </p>
            </div>
          </div>

          <Badge variant="success" size="sm" dot pulse className="shrink-0">
            {t("howItWorks.whatsappBadge")}
          </Badge>
        </div>
      </Container>
    </section>
  );
}
