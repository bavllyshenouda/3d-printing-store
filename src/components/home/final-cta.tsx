"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, UploadCloud, Box, Zap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";

export function FinalCta() {
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
              <span>Next-Generation Additive Manufacturing</span>
            </span>

            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              Ready to Bring Your Digital CAD <br className="hidden sm:inline" />
              Into <span className="text-[#FF6B35]">Physical Reality?</span>
            </h2>

            <p className="text-base sm:text-lg text-gray-300 leading-relaxed max-w-2xl mx-auto">
              Whether you need a single precision prototype, high-durability mechanical replacement parts, or an on-demand production run, our studio print farm is standing by.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Button
                variant="default"
                size="lg"
                iconLeft={<UploadCloud className="size-5" />}
                iconRight={<ArrowRight className="size-4" />}
                asChild
              >
                <Link href="/custom-prints">
                  Upload STL / 3MF for Quote
                </Link>
              </Button>

              <Button
                variant="charcoal"
                size="lg"
                iconLeft={<Box className="size-4 text-[#FF6B35]" />}
                asChild
                className="border-white/20 hover:bg-white/10"
              >
                <Link href="/products">
                  Explore Verified Catalog
                </Link>
              </Button>
            </div>

            {/* Trust highlights */}
            <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-400 font-mono">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-emerald-400" />
                <span>±0.08mm Dimensional Tolerance</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Zap className="size-4 text-[#FF6B35]" />
                <span>24h Rapid Cairo & Giza Dispatch</span>
              </span>
              <span>•</span>
              <span>InstaPay, COD & Vodafone Cash</span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

