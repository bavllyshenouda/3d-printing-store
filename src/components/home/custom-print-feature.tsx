"use client";

import React from "react";
import Link from "next/link";
import {
  UploadCloud,
  FileCode,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/layout/container";

export function CustomPrintFeature() {
  return (
    <section className="py-16 sm:py-24 border-b border-border/60 bg-[#111318] text-white relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF6B35]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      <Container size="xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Copy & Value Proposition */}
          <div className="lg:col-span-7 space-y-6">
            <Badge variant="electric" size="sm">
              Custom Manufacturing Service
            </Badge>

            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              Have a 3D Model? <br />
              <span className="text-[#FF6B35]">We Slice, Optimize & Print It.</span>
            </h2>

            <p className="text-base sm:text-lg text-gray-300 leading-relaxed max-w-xl">
              Upload your STL, 3MF, or STEP file. Our hardware engineers inspect model geometry, optimize slicing orientations for mechanical load, and calculate an exact quotation within minutes.
            </p>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[#FF6B35]">
                  <CheckCircle2 className="size-4" />
                </div>
                <div>
                  <h4 className="font-heading text-sm font-bold text-white">
                    Automated Slicing Analysis
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                    Precise weight, layer height, and print duration calculations.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[#FF6B35]">
                  <CheckCircle2 className="size-4" />
                </div>
                <div>
                  <h4 className="font-heading text-sm font-bold text-white">
                    Orientation Optimization
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                    Angled slicing to minimize layer delamination under stress.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[#FF6B35]">
                  <CheckCircle2 className="size-4" />
                </div>
                <div>
                  <h4 className="font-heading text-sm font-bold text-white">
                    Industrial Materials
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                    PETG-Carbon Fiber, Tough ABS, Flexible TPU 95A, and 8K Resin.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[#FF6B35]">
                  <CheckCircle2 className="size-4" />
                </div>
                <div>
                  <h4 className="font-heading text-sm font-bold text-white">
                    Strict File Privacy
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                    All proprietary CAD designs are stored securely and protected by NDA.
                  </p>
                </div>
              </div>
            </div>

            {/* Direct CTA Button */}
            <div className="pt-4">
              <Button
                variant="default"
                size="lg"
                iconRight={<ArrowRight className="size-4" />}
                asChild
              >
                <Link href="/custom-prints" className="flex items-center gap-2">
                  <UploadCloud className="size-5" />
                  <span>Upload STL/3MF File for Instant Quote</span>
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
                      Custom Slicing Engine
                    </span>
                    <span className="block font-mono text-[10px] text-gray-400">
                      STEP / STL / 3MF / OBJ
                    </span>
                  </div>
                </div>
                <Badge variant="charcoal" size="sm">
                  Ready to Slice
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
                        quadcopter_arm_reinforce.3mf
                      </span>
                      <span className="block font-mono text-[10px] text-gray-400">
                        18.4 MB · 340 Layers
                      </span>
                    </div>
                  </div>
                  <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono text-emerald-400 border border-emerald-500/30">
                    Geometry Verified
                  </span>
                </div>

                {/* Technical Parameter Chips */}
                <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                  <div className="rounded-lg bg-white/5 p-2 text-center border border-white/5">
                    <span className="text-[9px] text-gray-400 block">Infill</span>
                    <span className="font-bold text-white">35% Gyroid</span>
                  </div>
                  <div className="rounded-lg bg-white/5 p-2 text-center border border-white/5">
                    <span className="text-[9px] text-gray-400 block">Material</span>
                    <span className="font-bold text-[#FF6B35]">PETG-CF</span>
                  </div>
                  <div className="rounded-lg bg-white/5 p-2 text-center border border-white/5">
                    <span className="text-[9px] text-gray-400 block">Est. Time</span>
                    <span className="font-bold text-white">2h 45m</span>
                  </div>
                </div>
              </div>

              {/* Quote Breakdown Output */}
              <div className="mt-5 space-y-2.5 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs font-mono">
                <div className="flex items-center justify-between text-gray-400">
                  <span>Filament Consumption:</span>
                  <span className="text-white font-bold">64 grams</span>
                </div>
                <div className="flex items-center justify-between text-gray-400">
                  <span>Print Farm Machine Time:</span>
                  <span className="text-white font-bold">2.75 machine hrs</span>
                </div>
                <div className="flex items-center justify-between text-gray-400">
                  <span>Post-Processing & Annealing:</span>
                  <span className="text-emerald-400">Included</span>
                </div>
                <div className="border-t border-white/10 pt-2 flex items-center justify-between text-sm">
                  <span className="font-bold text-white">Estimated Quote:</span>
                  <span className="font-bold text-[#FF6B35] text-base">210 EGP</span>
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
                    Drop Files in Slicing Portal →
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

