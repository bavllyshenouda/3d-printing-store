"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Layers,
  ShieldCheck,
  Zap,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { CustomPrintLink } from "@/components/common/custom-print-link";
import { useTranslation } from "@/lib/i18n/context";

export function Footer() {
  const pathname = usePathname();
  const { t } = useTranslation();

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="w-full bg-[#111318] text-white border-t border-white/10 mt-auto">
      {/* Studio Value Highlights */}
      <div className="border-b border-white/10 py-10 bg-black/30">
        <Container size="xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex items-start gap-3.5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-[#FF6B35]">
                <Zap className="size-5" />
              </div>
              <div>
                <h4 className="font-heading text-sm font-bold text-white">
                  {t("footer.val1Title")}
                </h4>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  {t("footer.val1Desc")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-[#FF6B35]">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <h4 className="font-heading text-sm font-bold text-white">
                  {t("footer.val2Title")}
                </h4>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  {t("footer.val2Desc")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-[#FF6B35]">
                <Layers className="size-5" />
              </div>
              <div>
                <h4 className="font-heading text-sm font-bold text-white">
                  {t("footer.val3Title")}
                </h4>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  {t("footer.val3Desc")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-[#FF6B35]">
                <Phone className="size-5" />
              </div>
              <div>
                <h4 className="font-heading text-sm font-bold text-white">
                  {t("footer.val4Title")}
                </h4>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  {t("footer.val4Desc")}
                </p>
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* Main Footer Links */}
      <div className="py-16 sm:py-20">
        <Container size="xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
            {/* Brand Column */}
            <div className="lg:col-span-2 space-y-4">
              <Link href="/" className="flex items-center gap-2.5 group">
                <Image
                  src="/trio_logo.svg"
                  alt="Trio"
                  width={38}
                  height={32}
                  className="h-8 sm:h-9 w-auto brightness-0 invert transition-transform duration-300 group-hover:scale-105 shrink-0"
                />
                <div className="flex flex-col">
                  <span className="font-heading text-lg font-black tracking-tight text-white leading-none">
                    TRIO
                  </span>
                  <span className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">
                    {t("common.brandTagline")}
                  </span>
                </div>
              </Link>

              <p className="text-sm text-gray-400 leading-relaxed max-w-sm">
                {t("footer.about")}
              </p>

              <div className="pt-2 space-y-2 text-xs text-gray-400">
                <p className="flex items-center gap-2">
                  <MapPin className="size-3.5 text-[#FF6B35] shrink-0" />
                  <span>{t("footer.location")}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="size-3.5 text-[#FF6B35] shrink-0" />
                  <a
                    href={`mailto:${t("footer.email")}`}
                    className="hover:text-white transition-colors underline-offset-2 hover:underline"
                  >
                    {t("footer.email")}
                  </a>
                </p>
              </div>
            </div>

            {/* Shop Navigation */}
            <div className="space-y-3">
              <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-white">
                {t("footer.catalogCol")}
              </h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="/products" className="hover:text-white transition-colors">
                    {t("footer.allProducts")}
                  </Link>
                </li>
                <li>
                  <Link href="/products?category=mechanical" className="hover:text-white transition-colors">
                    {t("footer.gearsMechanical")}
                  </Link>
                </li>
                <li>
                  <Link href="/products?category=desk-organization" className="hover:text-white transition-colors">
                    {t("footer.studioDeskGear")}
                  </Link>
                </li>
                <li>
                  <Link href="/products?category=drone-rc" className="hover:text-white transition-colors">
                    {t("footer.dronesRc")}
                  </Link>
                </li>
                <li>
                  <Link href="/products?category=cosplay" className="hover:text-white transition-colors">
                    {t("footer.cosplay")}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Custom Manufacturing */}
            <div className="space-y-3">
              <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-white">
                {t("footer.customCol")}
              </h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <CustomPrintLink
                    href="/custom-prints"
                    className="hover:text-white transition-colors text-[#FF6B35]"
                  >
                    {t("footer.requestQuote")}
                  </CustomPrintLink>
                </li>
              </ul>
            </div>

            {/* Orders */}
            <div className="space-y-3">
              <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-white">
                {t("footer.ordersCol")}
              </h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="/orders" className="hover:text-white transition-colors">
                    {t("footer.trackOrder")}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </Container>
      </div>

      {/* Bottom Sub-Footer Bar */}
      <div className="border-t border-white/10 py-6 bg-[#0B0D11] text-xs text-gray-400">
        <Container size="xl" className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-mono">
              © {new Date().getFullYear()} {t("common.brandName")}. {t("footer.rights")}
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {t("footer.farmTelemetry")}
            </span>
          </div>

          {/* Payment Method Badges */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-500 mr-1">{t("footer.accepted")}</span>
            <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-mono border border-white/10">
              {t("footer.cod")}
            </span>
            <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-mono border border-white/10 text-pink-400">
              {t("footer.instapay")}
            </span>
            <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-mono border border-white/10 text-red-400">
              {t("footer.vodafone")}
            </span>
          </div>
        </Container>
      </div>
    </footer>
  );
}
