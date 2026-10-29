"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  UploadCloud,
  Box,
  Layers,
  Sparkles,
  Cpu,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/layout/container";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 sm:pt-16 sm:pb-24 border-b border-border/60 bg-studio-grid">
      {/* Background Radial Glow */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full bg-[#FF6B35]/12 blur-[120px] -z-10"
        aria-hidden="true"
      />

      <Container size="xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headlines & CTAs */}
          <div className="lg:col-span-7 flex flex-col items-start gap-6">
            {/* Live Telemetry Pill */}
            <div className="flex items-center gap-2 rounded-full border border-border/80 bg-white/80 dark:bg-[#1A1D24]/80 px-3.5 py-1.5 backdrop-blur-md shadow-sm">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-xs font-medium text-foreground">
                Print Farm Online · 24h Prototyping Turnaround
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.08]">
              From Digital CAD to{" "}
              <span className="text-[#FF6B35]">Physical Precision.</span>
            </h1>

            {/* Supporting Description */}
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
              Transform your 3D models into production-grade functional prototypes, mechanical parts, and custom assemblies. Industrial multi-material FDM & 8K SLA resin printing delivered across Egypt.
            </p>

            {/* Dual CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2 w-full sm:w-auto">
              <Button
                variant="default"
                size="lg"
                iconRight={<ArrowRight className="size-4" />}
                asChild
                className="w-full sm:w-auto"
              >
                <Link href="/products">Shop Catalog</Link>
              </Button>

              <Button
                variant="charcoal"
                size="lg"
                iconLeft={<UploadCloud className="size-4 text-[#FF6B35]" />}
                asChild
                className="w-full sm:w-auto"
              >
                <Link href="/custom-prints">Request Custom Print</Link>
              </Button>
            </div>

            {/* Engineering Highlights Strip */}
            <div className="pt-4 border-t border-border/60 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-[#FF6B35] shrink-0" />
                <span>±0.08mm Tolerances</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-[#FF6B35] shrink-0" />
                <span>PETG-CF & Tough ABS</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-[#FF6B35] shrink-0" />
                <span>Instant Slicing Quote</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-[#FF6B35] shrink-0" />
                <span>COD & InstaPay</span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual 3D Studio Showcase */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            {/* Ambient Lighting Behind Visual */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-[#FF6B35]/20 via-[#111318]/5 to-transparent blur-2xl -z-10" />

            {/* Main Studio Frame */}
            <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#111318] p-6 text-white shadow-2xl shadow-black/30 overflow-hidden">
              {/* Build Volume Grid Pattern */}
              <div className="absolute inset-0 bg-studio-grid opacity-30 pointer-events-none" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF6B35]/20 rounded-full blur-3xl pointer-events-none" />

              {/* Header Telemetry Bar */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-[#FF6B35]/20 text-[#FF6B35]">
                    <Layers className="size-4" />
                  </div>
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                    Bambu X1-Carbon #04
                  </span>
                </div>
                <Badge variant="success" size="sm" dot pulse>
                  Printing
                </Badge>
              </div>

              {/* Isometric Print Representation */}
              <div className="relative h-56 w-full rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center p-6 overflow-hidden">
                {/* Slicing Layer Visual Lines */}
                <div className="absolute inset-0 bg-layer-lines opacity-60" />

                {/* Hotend & Printed Model Graphic */}
                <div className="relative flex flex-col items-center justify-center z-10">
                  {/* Extruder Nozzle Simulation */}
                  <div className="w-8 h-3 bg-gradient-to-b from-gray-400 to-amber-600 rounded-t-sm" />
                  <div className="w-3 h-3 bg-amber-500 rounded-b-full shadow-[0_0_15px_3px_rgba(255,107,53,0.8)]" />

                  {/* 3D Part Wireframe Block */}
                  <div className="mt-4 flex flex-col items-center">
                    <div className="flex size-20 items-center justify-center rounded-2xl border-2 border-[#FF6B35] bg-[#FF6B35]/15 backdrop-blur-md shadow-glow-sm transition-transform duration-700 hover:rotate-6">
                      <Box className="size-10 text-[#FF6B35]" />
                    </div>
                    <span className="mt-2 font-mono text-[10px] text-gray-400">
                      Z: 42.80 mm · Infill: 30% Gyroid
                    </span>
                  </div>
                </div>

                {/* Print Progress Bar */}
                <div className="absolute bottom-3 inset-x-4">
                  <div className="flex justify-between text-[10px] font-mono text-gray-400 mb-1">
                    <span>Progress: Layer 214/340</span>
                    <span className="text-[#FF6B35] font-bold">63%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-[#FF6B35] rounded-full w-[63%] shadow-[0_0_8px_rgba(255,107,53,0.6)]" />
                  </div>
                </div>
              </div>

              {/* Telemetry Stats Grid */}
              <div className="mt-6 grid grid-cols-3 gap-2.5 font-mono text-xs">
                <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
                  <span className="text-[10px] text-gray-400 block">Nozzle</span>
                  <span className="font-bold text-white">250°C</span>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
                  <span className="text-[10px] text-gray-400 block">Bed Temp</span>
                  <span className="font-bold text-white">65°C</span>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
                  <span className="text-[10px] text-gray-400 block">Speed</span>
                  <span className="font-bold text-[#FF6B35]">250 mm/s</span>
                </div>
              </div>
            </div>

            {/* Floating Floating Telemetry Badges */}
            <div className="hidden sm:flex absolute -bottom-4 -left-6 items-center gap-2.5 rounded-2xl border border-white/10 bg-[#1A1D24]/90 p-3 shadow-xl backdrop-blur-md animate-float">
              <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                <Sparkles className="size-4" />
              </div>
              <div>
                <span className="block text-[11px] font-bold text-white">Carbon Fiber Reinforced</span>
                <span className="block text-[10px] text-gray-400">High stiffness & tensile load</span>
              </div>
            </div>

            <div className="hidden sm:flex absolute -top-4 -right-4 items-center gap-2.5 rounded-2xl border border-white/10 bg-[#1A1D24]/90 p-3 shadow-xl backdrop-blur-md animate-float-delayed">
              <div className="flex size-8 items-center justify-center rounded-xl bg-[#FF6B35]/15 text-[#FF6B35]">
                <Cpu className="size-4" />
              </div>
              <div>
                <span className="block text-[11px] font-bold text-white">Automatic Slicing Engine</span>
                <span className="block text-[10px] text-gray-400">Instant weight & print time</span>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

