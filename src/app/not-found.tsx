"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Home, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { useTranslation } from "@/lib/i18n/context";

export default function NotFound() {
  const { t, isRTL } = useTranslation();
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-16 px-4 bg-background">
      <Container size="default" className="text-center max-w-lg space-y-6">
        <div className="inline-flex items-center justify-center size-20 rounded-3xl bg-[#FF6B35]/10 text-[#FF6B35] font-mono font-black text-3xl border border-[#FF6B35]/20 shadow-xs">
          404
        </div>
        <div className="space-y-2">
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {t("notFound.title")}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {t("notFound.description")}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <Button variant="default" size="default" asChild>
            <Link href="/" className="flex items-center gap-2">
              <Home className="size-4" />
              <span>{t("notFound.backHome")}</span>
            </Link>
          </Button>
          <Button variant="outline" size="default" asChild>
            <Link href="/products" className="flex items-center gap-2">
              <ShoppingBag className="size-4" />
              <span>{t("notFound.browseProducts")}</span>
              <ArrowIcon className="size-3.5 rtl:rotate-180" />
            </Link>
          </Button>
        </div>
      </Container>
    </div>
  );
}

