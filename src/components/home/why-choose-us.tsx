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

export function WhyChooseUs() {
  const pillars = [
    {
      title: "Industrial Print Quality",
      highlight: "Flawless Layer Adhesion",
      description:
        "High-temp direct-drive extruders, enclosed heated chambers, and calibrated print profiles prevent warping and structural weak spots.",
      icon: <ShieldCheck className="size-6 text-[#FF6B35]" />,
      specs: ["Dual-gear direct drive", "Nozzle temps up to 300°C", "Moisture-sealed filament"],
    },
    {
      title: "Micron-Level Precision",
      highlight: "±0.08mm Tolerances",
      description:
        "Active vibration compensation (input shaping) and multi-point bed mesh leveling ensure tight mechanical tolerances for snap-fit assemblies.",
      icon: <Maximize2 className="size-6 text-[#FF6B35]" />,
      specs: ["High-speed input shaping", "Automated bed leveling", "Dimensional check guarantee"],
    },
    {
      title: "Extensive Customization",
      highlight: "Multi-Material & Infill",
      description:
        "Choose from lightweight decorative PLA+ to carbon fiber-infused PETG, heat-resistant ABS, flexible TPU 95A, and 8K SLA precision resin.",
      icon: <SlidersHorizontal className="size-6 text-[#FF6B35]" />,
      specs: ["Gyroid, Honeycomb & Grid infill", "12+ technical polymers", "Multi-color capabilities"],
    },
    {
      title: "Dedicated Support",
      highlight: "Direct Slicing Advice",
      description:
        "Talk directly with hardware and slicing engineers over WhatsApp. Get immediate advice on model orientation, wall count, and material selection.",
      icon: <Headphones className="size-6 text-[#FF6B35]" />,
      specs: ["Instant WhatsApp assistance", "Pre-print slicing review", "Quick turnaround response"],
    },
  ];

  return (
    <section className="py-16 sm:py-24 border-b border-border/60 bg-studio-grid">
      <Container size="xl">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-16">
          <Badge variant="electric" size="sm" className="mb-2">
            Engineering Standard
          </Badge>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Why Hardware Engineers Choose Print Studio
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-2 leading-relaxed">
            We don&apos;t just print models — we engineer additive solutions with strict mechanical tolerances and production reliability.
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

