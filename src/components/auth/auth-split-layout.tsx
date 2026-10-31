"use client";

import React from "react";
import Link from "next/link";
import { Layers, CheckCircle2, Zap, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

export interface AuthSplitLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  titleKey?: string;
  subtitleKey?: string;
}

export function AuthSplitLayout({
  children,
  title,
  subtitle,
  titleKey,
  subtitleKey,
}: AuthSplitLayoutProps) {
  const { t, isRTL } = useTranslation();

  const resolvedTitle = titleKey ? t(titleKey) : title;
  const resolvedSubtitle = subtitleKey ? t(subtitleKey) : subtitle;

  const benefits = [
    t("auth.feature1"),
    t("auth.feature2"),
    t("auth.feature3"),
  ];

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-10 px-4 sm:px-6 bg-background">
      <div className="w-full max-w-5xl rounded-3xl border border-border/70 bg-card overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-12">
        {/* Left/Start Column: Studio Aesthetic Showcase Panel */}
        <div className="lg:col-span-5 order-2 lg:order-1 relative bg-[#111318] text-white p-8 sm:p-10 flex flex-col justify-between overflow-hidden">
          {/* Subtle Layer Lines & Radial Orange Glow */}
          <div className="absolute inset-0 bg-studio-grid opacity-25 pointer-events-none" />
          <div
            className="pointer-events-none absolute -top-16 -start-16 size-80 rounded-full bg-[#FF6B35]/20 blur-[100px]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-16 -end-16 size-80 rounded-full bg-[#FF6B35]/15 blur-[100px]"
            aria-hidden="true"
          />

          {/* Top Brand & Status */}
          <div className="relative z-10 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="flex size-9 items-center justify-center rounded-xl bg-white/10 text-white border border-white/10 transition-transform duration-300 group-hover:scale-105">
                <Layers className="size-5 text-[#FF6B35]" />
              </div>
              <div className="flex flex-col">
                <span className="font-heading text-lg font-black tracking-tight text-white leading-none">
                  PRINT<span className="text-[#FF6B35]">STUDIO</span>
                </span>
                <span className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">
                  {t("auth.splitBadge")}
                </span>
              </div>
            </Link>

            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[11px] text-[#FF6B35]">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{t("auth.brandPill")}</span>
              </span>
            </div>
          </div>

          {/* Middle Value Proposition */}
          <div className="relative z-10 my-8 sm:my-12 space-y-5">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
              {t("auth.splitHeading")}
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              {t("auth.splitDesc")}
            </p>

            {/* Feature Checklist */}
            <div className="space-y-3 pt-2">
              {benefits.map((benefit, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-gray-300">
                  <CheckCircle2 className="size-4 text-[#FF6B35] shrink-0 mt-0.5" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Telemetry Ticker Note */}
          <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-gray-400">
            <span>Bambu Farm #01-#12</span>
            <span className="text-emerald-400">Online · Ready</span>
          </div>
        </div>

        {/* Right/End Column: Authentication Form */}
        <div className="lg:col-span-7 order-1 lg:order-2 p-6 sm:p-10 md:p-12 flex flex-col justify-center bg-card">
          <div className="max-w-md w-full mx-auto space-y-6">
            <div className="space-y-2">
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {resolvedTitle}
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {resolvedSubtitle}
              </p>
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

