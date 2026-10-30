"use client";

import React from "react";
import Link from "next/link";
import {
  Cog,
  Cpu,
  Layers,
  Box,
  ArrowRight,
  Compass,
  Palette,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/layout/container";
import { Grid } from "@/components/layout/grid";
import { HomepageCategory } from "@/lib/data/homepage";
import { useTranslation } from "@/lib/i18n/context";
import { getLocalizedField } from "@/lib/i18n";

export interface CategoryGridProps {
  categories: HomepageCategory[];
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  const { t, locale } = useTranslation();

  const defaultCategoryMetadata = [
    {
      name: t("categories.mechanicalTitle"),
      slug: "mechanical",
      description: t("categories.mechanicalDesc"),
      icon: <Cog className="size-6 text-[#FF6B35]" />,
    },
    {
      name: t("categories.deskTitle"),
      slug: "desk-organization",
      description: t("categories.deskDesc"),
      icon: <Box className="size-6 text-[#FF6B35]" />,
    },
    {
      name: t("categories.droneTitle"),
      slug: "drone-rc",
      description: t("categories.droneDesc"),
      icon: <Compass className="size-6 text-[#FF6B35]" />,
    },
    {
      name: t("categories.electronicsTitle"),
      slug: "electronics-enclosures",
      description: t("categories.electronicsDesc"),
      icon: <Cpu className="size-6 text-[#FF6B35]" />,
    },
    {
      name: t("categories.prototypingTitle"),
      slug: "prototyping-jigs",
      description: t("categories.prototypingDesc"),
      icon: <Layers className="size-6 text-[#FF6B35]" />,
    },
    {
      name: t("categories.artTitle"),
      slug: "art-props",
      description: t("categories.artDesc"),
      icon: <Palette className="size-6 text-[#FF6B35]" />,
    },
  ];

  // Use backend categories if available, otherwise blend with curated metadata
  const displayCategories =
    categories && categories.length > 0
      ? categories.map((cat, idx) => ({
          name: getLocalizedField(
            cat as unknown as Record<string, unknown>,
            "name",
            locale,
            cat.name
          ),
          slug: cat.slug,
          description:
            getLocalizedField(
              cat as unknown as Record<string, unknown>,
              "description",
              locale,
              cat.description || ""
            ) || defaultCategoryMetadata[idx % defaultCategoryMetadata.length].description,
          icon: defaultCategoryMetadata[idx % defaultCategoryMetadata.length].icon,
        }))
      : defaultCategoryMetadata;

  return (
    <section className="py-16 sm:py-24 border-b border-border/60 bg-muted/20">
      <Container size="xl">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-12">
          <Badge variant="electric" size="sm" className="mb-2">
            {t("categories.badge")}
          </Badge>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            {t("categories.title")}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-2 leading-relaxed">
            {t("categories.description")}
          </p>
        </div>

        {/* Categories Grid */}
        <Grid cols={3} gap="default">
          {displayCategories.map((cat) => (
            <Link key={cat.slug} href={`/products?category=${cat.slug}`} className="group block">
              <Card
                variant="interactive"
                className="h-full p-6 flex flex-col justify-between transition-all duration-300"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex size-12 items-center justify-center rounded-2xl border border-border/80 bg-white dark:bg-[#111318] shadow-sm transition-transform duration-300 group-hover:scale-110">
                      {cat.icon}
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180 group-hover:text-[#FF6B35]" />
                  </div>

                  <h3 className="font-heading text-lg font-bold text-foreground transition-colors group-hover:text-[#FF6B35]">
                    {cat.name}
                  </h3>

                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">
                    {cat.description}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-border/50 flex items-center justify-between text-xs font-mono text-muted-foreground">
                  <span>{t("categories.explore")}</span>
                  <span className="text-[#FF6B35] font-semibold group-hover:underline">
                    {t("categories.browse")} →
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </Grid>
      </Container>
    </section>
  );
}
