"use client";

import React from "react";
import {
  ShieldCheck,
  Maximize2,
  SlidersHorizontal,
  Headphones,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/layout/container";
import { Grid } from "@/components/layout/grid";
import { useTranslation } from "@/lib/i18n/context";

export function WhyChooseUs() {
  const { t } = useTranslation();

  const pillars = [
    {
      title: t("whyUs.pillar1Title"),
      highlight: t("whyUs.pillar1Highlight"),
      description: t("whyUs.pillar1Desc"),
      icon: <ShieldCheck className="size-6 text-[#FF6B35]" />,
      specs: [
        t("whyUs.pillar1Spec1"),
        t("whyUs.pillar1Spec2"),
        t("whyUs.pillar1Spec3"),
      ],
    },
    {
      title: t("whyUs.pillar2Title"),
      highlight: t("whyUs.pillar2Highlight"),
      description: t("whyUs.pillar2Desc"),
      icon: <Maximize2 className="size-6 text-[#FF6B35]" />,
      specs: [
        t("whyUs.pillar2Spec1"),
        t("whyUs.pillar2Spec2"),
        t("whyUs.pillar2Spec3"),
      ],
    },
    {
      title: t("whyUs.pillar3Title"),
      highlight: t("whyUs.pillar3Highlight"),
      description: t("whyUs.pillar3Desc"),
      icon: <SlidersHorizontal className="size-6 text-[#FF6B35]" />,
      specs: [
        t("whyUs.pillar3Spec1"),
        t("whyUs.pillar3Spec2"),
        t("whyUs.pillar3Spec3"),
      ],
    },
    {
      title: t("whyUs.pillar4Title"),
      highlight: t("whyUs.pillar4Highlight"),
      description: t("whyUs.pillar4Desc"),
      icon: <Headphones className="size-6 text-[#FF6B35]" />,
      specs: [
        t("whyUs.pillar4Spec1"),
        t("whyUs.pillar4Spec2"),
        t("whyUs.pillar4Spec3"),
      ],
    },
  ];

  return (
    <section className="py-16 sm:py-24 border-b border-border/60 bg-studio-grid">
      <Container size="xl">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-16">
          <Badge variant="electric" size="sm" className="mb-2">
            {t("whyUs.badge")}
          </Badge>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            {t("whyUs.title")}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-2 leading-relaxed">
            {t("whyUs.description")}
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <Grid cols={4} gap="default">
          {pillars.map((pillar) => (
            <Card
              key={pillar.title}
              variant="interactive"
              className="flex flex-col justify-between p-6 bg-white dark:bg-[#1A1D24] shadow-soft border-border/80"
            >
              <div>
                <div className="flex size-12 items-center justify-center rounded-2xl border border-border/80 bg-muted/40 shadow-sm mb-5">
                  {pillar.icon}
                </div>

                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#FF6B35] block mb-1">
                  {pillar.highlight}
                </span>

                <h3 className="font-heading text-lg font-bold text-foreground">
                  {pillar.title}
                </h3>

                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  {pillar.description}
                </p>
              </div>

              {/* Spec Checklist */}
              <div className="mt-6 pt-4 border-t border-border/50 space-y-2">
                {pillar.specs.map((spec) => (
                  <div key={spec} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="size-3.5 text-emerald-500 shrink-0" />
                    <span>{spec}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </Grid>
      </Container>
    </section>
  );
}
