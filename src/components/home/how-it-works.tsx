"use client";

import React from "react";
import Link from "next/link";
import {
  UploadCloud,
  SlidersHorizontal,
  Truck,
  ArrowRight,
  CheckCircle2,
  Phone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";

export function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "Choose or Upload",
      subtitle: "Catalog or Custom CAD",
      description:
        "Select an engineered model from our catalog, or upload your own 3D file in STL, 3MF, STEP, or OBJ format.",
      icon: <UploadCloud className="size-6 text-[#FF6B35]" />,
      action: {
        label: "Upload 3D File",
        href: "/custom-prints",
      },
    },
    {
      step: "02",
      title: "Configure & Order",
      subtitle: "Materials & Tolerances",
      description:
        "Pick your polymer (PETG-CF, Tough PLA, ABS, Resin), select infill density, and checkout securely via COD, InstaPay, or Vodafone Cash.",
      icon: <SlidersHorizontal className="size-6 text-[#FF6B35]" />,
      action: {
        label: "View Materials",
        href: "/materials",
      },
    },
    {
      step: "03",
      title: "Print & Doorstep Delivery",
      subtitle: "24-48h Fast Turnaround",
      description:
        "Our automated print farm slices, prints, and anneals your part. Receive WhatsApp photo updates and express doorstep delivery.",
      icon: <Truck className="size-6 text-[#FF6B35]" />,
      action: {
        label: "Track Existing Order",
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
            Seamless Workflow
          </Badge>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            How Precision 3D Printing Works
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-2 leading-relaxed">
            From raw CAD geometry to physically tested functional hardware in 3 simple steps.
          </p>
        </div>

        {/* 3-Step Interactive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector Line (visible on desktop) */}
          <div
            className="hidden md:block absolute top-1/2 left-[15%] right-[15%] -translate-y-12 h-0.5 bg-gradient-to-r from-[#FF6B35]/20 via-[#FF6B35]/50 to-[#FF6B35]/20 -z-0"
            aria-hidden="true"
          />

          {steps.map((item, idx) => (
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
                    <ArrowRight className="size-3.5" />
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
                Automated WhatsApp Progress Updates
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                We notify you on WhatsApp when slicing starts, when the print bed finishes, and when your package ships.
              </p>
            </div>
          </div>

          <Badge variant="success" size="sm" dot pulse className="shrink-0">
            Live Automated Alerts
          </Badge>
        </div>
      </Container>
    </section>
  );
}

