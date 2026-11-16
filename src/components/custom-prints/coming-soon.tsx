"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ShoppingBag, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/layout/container";
import { useTranslation } from "@/lib/i18n/context";

export function CustomPrintsComingSoon() {
  const { t, isRTL } = useTranslation();
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-16 px-4 bg-background">
      <Container size="default" className="text-center max-w-lg space-y-6">
        <Badge
          variant="outline"
          className="text-xs py-1 px-3 font-bold bg-[#FF6B35]/10 text-[#FF6B35] border-[#FF6B35]/30 inline-flex items-center gap-1.5"
        >
          <Sparkles className="size-3.5" />
          <span>{t("customPrintsComingSoon.badge")}</span>
        </Badge>

        <div className="space-y-3">
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {t("customPrintsComingSoon.title")}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {t("customPrintsComingSoon.description")}
          </p>
        </div>

        <div className="pt-4 flex justify-center">
          <Button variant="default" size="lg" asChild className="h-12 px-8 font-bold shadow-sm">
            <Link href="/products" className="flex items-center gap-2">
              <ShoppingBag className="size-4" />
              <span>{t("customPrintsComingSoon.backToProducts")}</span>
              <ArrowIcon className="size-4 rtl:rotate-180" />
            </Link>
          </Button>
        </div>
      </Container>
    </div>
  );
}

