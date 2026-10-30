"use client";

import React from "react";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n/context";
import {
  UploadCloud,
  Layers,
  Cpu,
  Clock,
  ShieldCheck,
  CheckCircle2,
  FileCode,
  Box,
  Truck,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Flame,
  Zap,
} from "lucide-react";

export function LandingView() {
  const { t, isRTL } = useTranslation();
  const NextIcon = isRTL ? ArrowLeft : ArrowRight;

  const steps = [
    {
      num: "01",
      title: "Upload CAD Model",
      desc: "Upload STL, 3MF, or reference sketches up to 50 MB with instant WebGL 3D preview.",
      icon: UploadCloud,
    },
    {
      num: "02",
      title: "Slicing & Optimization",
      desc: "Hardware engineers inspect geometry, infill density, and stress load orientation.",
      icon: Cpu,
    },
    {
      num: "03",
      title: "Receive Official Quote",
      desc: "Review transparent quotation with material specs, exact machine time, and turnaround.",
      icon: FileCode,
    },
    {
      num: "04",
      title: "Precision Print & Ship",
      desc: "Produced on calibrated Bambu X1-Carbon printers and delivered across Egypt in 48-72h.",
      icon: Truck,
    },
  ];

  const materials = [
    {
      name: "PETG-Carbon Fiber",
      tag: "Structural",
      temp: "80°C",
      strength: "High Tensile",
      desc: "Reinforced with chopped carbon fiber. Ideal for drone frames, brackets, and functional mounts.",
      badgeColor: "bg-[#FF6B35]/10 text-[#FF6B35] border-[#FF6B35]/30",
    },
    {
      name: "Tough PLA+",
      tag: "Prototyping",
      temp: "55°C",
      strength: "Impact Resistant",
      desc: "High toughness and clean aesthetics. Perfect for electronics enclosures and display models.",
      badgeColor: "bg-blue-500/10 text-blue-500 border-blue-500/30",
    },
    {
      name: "ABS / ASA",
      tag: "Outdoor & UV",
      temp: "95°C",
      strength: "Weatherproof",
      desc: "Superior heat tolerance and UV resistance for automotive interior and outdoor assemblies.",
      badgeColor: "bg-amber-500/10 text-amber-500 border-amber-500/30",
    },
    {
      name: "Nylon PA12",
      tag: "Mechanical",
      temp: "110°C",
      strength: "Low Friction",
      desc: "Exceptional wear resistance and flexibility for gears, sliding bearings, and snap-fits.",
      badgeColor: "bg-purple-500/10 text-purple-500 border-purple-500/30",
    },
    {
      name: "Flexible TPU 95A",
      tag: "Elastomer",
      temp: "70°C",
      strength: "High Shore A",
      desc: "Rubber-like flexibility for vibration dampeners, gaskets, protective bumpers, and tires.",
      badgeColor: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
    },
    {
      name: "8K SLA Resin",
      tag: "Ultra-Detail",
      temp: "60°C",
      strength: "Micro Precision",
      desc: "Smooth injection-molded finish with ±0.05mm accuracy for miniatures and dental prototypes.",
      badgeColor: "bg-cyan-500/10 text-cyan-500 border-cyan-500/30",
    },
  ];

  return (
    <div className="py-12 sm:py-20 bg-background min-h-screen space-y-20">
      {/* 1. Hero Section */}
      <Container size="lg">
        <div className="relative rounded-3xl border border-border/80 bg-card p-8 sm:p-14 overflow-hidden shadow-xs">
          {/* Subtle Ambient Background glow */}
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 size-96 rounded-full bg-[#FF6B35]/10 blur-3xl pointer-events-none" />

          <div className="max-w-2xl space-y-6 text-left relative z-10">
            <Badge
              variant="outline"
              className="text-xs py-1 px-3 font-bold bg-[#FF6B35]/10 text-[#FF6B35] border-[#FF6B35]/30 inline-flex items-center gap-1.5"
            >
              <Sparkles className="size-3.5" />
              <span>{t("customPrint.badge")}</span>
            </Badge>

            <h1 className="font-heading text-3xl sm:text-5xl font-black tracking-tight text-foreground leading-[1.15]">
              {t("customPrint.titleLine1")}{" "}
              <span className="text-[#FF6B35]">
                {t("customPrint.titleHighlight")}
              </span>
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              {t("customPrint.description")}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <Link href="/custom-prints/new" className="w-full sm:w-auto">
                <Button
                  variant="default"
                  size="lg"
                  className="w-full sm:w-auto font-bold h-12 px-8 shadow-sm"
                  iconRight={<NextIcon className="size-4" />}
                >
                  {t("customPrintApp.newRequestCta")}
                </Button>
              </Link>

              <Link href="/custom-prints/my-requests" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto font-semibold h-12 px-6"
                >
                  {t("customPrintApp.myRequestsCta")}
                </Button>
              </Link>
            </div>

            {/* Security Guarantee Pills */}
            <div className="flex items-center gap-4 pt-4 text-xs text-muted-foreground flex-wrap">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-[#FF6B35]" />
                <span>NDA & Design IP Protected</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="size-4 text-[#FF6B35]" />
                <span>24-Hour Quotation Turnaround</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Box className="size-4 text-[#FF6B35]" />
                <span>Up to 50 MB Models</span>
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* 2. Process Workflow */}
      <Container size="lg">
        <div className="text-center max-w-xl mx-auto space-y-2 mb-12">
          <Badge variant="outline" className="text-xs py-0.5 px-3 font-semibold">
            Production Pipeline
          </Badge>
          <h2 className="font-heading text-2xl sm:text-3xl font-black text-foreground">
            How Custom Manufacturing Works
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Engineering precision and automated slicing every step of the way.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={s.num}
                className="relative rounded-2xl border border-border/80 bg-card p-6 text-left space-y-4 shadow-xs transition-all hover:border-[#FF6B35]/40 hover:-translate-y-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-[#FF6B35]/10 text-[#FF6B35] shadow-xs">
                    <Icon className="size-5" />
                  </div>
                  <span className="font-mono text-2xl font-black text-muted-foreground/30">
                    {s.num}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="font-heading text-base font-bold text-foreground">
                    {s.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Container>

      {/* 3. Engineering Materials Matrix */}
      <Container size="lg">
        <div className="text-center max-w-xl mx-auto space-y-2 mb-12">
          <Badge variant="outline" className="text-xs py-0.5 px-3 font-semibold">
            Materials Library
          </Badge>
          <h2 className="font-heading text-2xl sm:text-3xl font-black text-foreground">
            Industrial Filaments & Resins
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Calibrated on Bambu X1-Carbon and 8K resin stations for high tolerances.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((m) => (
            <div
              key={m.name}
              className="rounded-2xl border border-border/80 bg-card p-6 text-left space-y-3.5 shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-heading text-base font-bold text-foreground">
                  {m.name}
                </h3>
                <Badge
                  variant="outline"
                  className={`text-[10px] py-0 px-2 font-mono font-bold ${m.badgeColor}`}
                >
                  {m.tag}
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {m.desc}
              </p>

              <div className="flex items-center gap-4 pt-2 border-t border-border/60 text-[11px] font-mono text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Flame className="size-3 text-[#FF6B35]" />
                  <span>{m.temp}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="size-3 text-amber-500" />
                  <span>{m.strength}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>

      {/* 4. Ready to Build Banner */}
      <Container size="lg">
        <div className="rounded-3xl border border-[#FF6B35]/40 bg-[#FF6B35]/5 p-8 sm:p-12 text-center space-y-5">
          <h2 className="font-heading text-2xl sm:text-3xl font-black text-foreground">
            Ready to Fabricate Your 3D Part?
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto">
            Upload your STL or 3MF file now. Our engineering team reviews all models within 24 hours.
          </p>
          <Link href="/custom-prints/new" className="inline-block">
            <Button
              variant="default"
              size="lg"
              className="font-bold h-12 px-8 shadow-sm"
              iconRight={<NextIcon className="size-4" />}
            >
              {t("customPrintApp.newRequestCta")}
            </Button>
          </Link>
        </div>
      </Container>
    </div>
  );
}

