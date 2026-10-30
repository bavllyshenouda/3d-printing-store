"use client";

import React from "react";
import {
  Layers,
  Compass,
  Cpu,
  Clock,
  Palette,
  Boxes,
  CheckCircle2,
  Sliders,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProductDetail } from "@/lib/data/product-detail";
import { useTranslation } from "@/lib/i18n/context";
import { getLocalizedField } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export interface ProductSpecsProps {
  product: ProductDetail;
  className?: string;
}

export function ProductSpecs({ product, className }: ProductSpecsProps) {
  const { t, locale } = useTranslation();

  const localizedCategory = product.category
    ? getLocalizedField(
        product.category as unknown as Record<string, unknown>,
        "name",
        locale,
        product.category.name
      )
    : "-";

  const specsList = [
    {
      label: t("product.specMaterial"),
      value: product.material || "PLA+ Engineering Grade",
      icon: <Layers className="size-4 text-[#FF6B35]" />,
    },
    {
      label: t("product.specTolerance"),
      value: t("product.specToleranceValue"),
      icon: <Compass className="size-4 text-[#FF6B35]" />,
    },
    {
      label: t("product.specInfill"),
      value: t("product.specInfillValue"),
      icon: <Cpu className="size-4 text-[#FF6B35]" />,
    },
    {
      label: t("product.specTechnology"),
      value: t("product.specTechnologyValue"),
      icon: <Sliders className="size-4 text-[#FF6B35]" />,
    },
    {
      label: t("product.specLeadTime"),
      value: t("product.specLeadTimeValue"),
      icon: <Clock className="size-4 text-[#FF6B35]" />,
    },
    {
      label: t("product.specColors"),
      value:
        product.available_colors && product.available_colors.length > 0
          ? product.available_colors.join(", ")
          : "Standard Black",
      icon: <Palette className="size-4 text-[#FF6B35]" />,
    },
    {
      label: t("product.specCategory"),
      value: localizedCategory,
      icon: <Boxes className="size-4 text-[#FF6B35]" />,
    },
  ];

  return (
    <section className={cn("py-12 border-t border-border/60", className)}>
      <div className="flex flex-col gap-6">
        <div>
          <Badge variant="charcoal" size="sm" className="mb-2">
            {t("catalog.badge")}
          </Badge>
          <h2 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {t("product.specifications")}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {specsList.map((spec, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3.5 p-4 rounded-2xl border border-border/70 bg-card hover:border-[#FF6B35]/40 transition-colors shadow-xs"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#FF6B35]/10 shrink-0">
                {spec.icon}
              </div>
              <div className="space-y-0.5">
                <span className="text-xs text-muted-foreground font-medium block">
                  {spec.label}
                </span>
                <span className="text-sm font-bold text-foreground block">
                  {spec.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

