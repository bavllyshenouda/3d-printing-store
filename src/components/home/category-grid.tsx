"use client";

import React from "react";
import Link from "next/link";
import {
  Cog,
  Cpu,
  Layers,
  Box,
  ArrowRight,
  Sparkles,
  Compass,
  Palette,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/layout/container";
import { Grid } from "@/components/layout/grid";
import { HomepageCategory } from "@/lib/data/homepage";

export interface CategoryGridProps {
  categories: HomepageCategory[];
}

const defaultCategoryMetadata = [
  {
    name: "Mechanical & Robotics",
    slug: "mechanical",
    description: "Planetary gearboxes, motor mounts, timing pulleys, and linear bearings.",
    icon: <Cog className="size-6 text-[#FF6B35]" />,
  },
  {
    name: "Studio & Desk Gear",
    slug: "desk-organization",
    description: "Modular hex sorters, headphone docks, and parametric cable guides.",
    icon: <Box className="size-6 text-[#FF6B35]" />,
  },
  {
    name: "Drones & RC Vehicles",
    slug: "drone-rc",
    description: "FPV camera guards, TPU bumper skids, and aerodynamic wings.",
    icon: <Compass className="size-6 text-[#FF6B35]" />,
  },
  {
    name: "Electronics Enclosures",
    slug: "electronics-enclosures",
    description: "Snap-fit cases for Raspberry Pi, Arduino, custom PCBs, and sensor pods.",
    icon: <Cpu className="size-6 text-[#FF6B35]" />,
  },
  {
    name: "Prototyping & Jigs",
    slug: "prototyping-jigs",
    description: "Assembly alignment jigs, drill guides, and rapid inspection gauges.",
    icon: <Layers className="size-6 text-[#FF6B35]" />,
  },
  {
    name: "Art, Props & Replicas",
    slug: "art-props",
    description: "8K SLA resin figurines, cosplay armor pieces, and architectural models.",
    icon: <Palette className="size-6 text-[#FF6B35]" />,
  },
];

export function CategoryGrid({ categories }: CategoryGridProps) {
  // Use backend categories if available, otherwise blend with curated metadata
  const displayCategories =
    categories && categories.length > 0
      ? categories.map((cat, idx) => ({
          name: cat.name,
          slug: cat.slug,
          description: cat.description || defaultCategoryMetadata[idx % defaultCategoryMetadata.length].description,
          icon: defaultCategoryMetadata[idx % defaultCategoryMetadata.length].icon,
        }))
      : defaultCategoryMetadata;

  return (
    <section className="py-16 sm:py-24 border-b border-border/60 bg-muted/20">
      <Container size="xl">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-12">
          <Badge variant="electric" size="sm" className="mb-2">
            Catalog Taxonomy
          </Badge>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Shop by Engineering Application
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-2 leading-relaxed">
            Browse through pre-sliced and tested models grouped by mechanical engineering, robotics, studio gear, and prototyping.
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
                    <ArrowRight className="size-4 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-[#FF6B35]" />
                  </div>

                  <h3 className="font-heading text-lg font-bold text-foreground transition-colors group-hover:text-[#FF6B35]">
                    {cat.name}
                  </h3>

                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">
                    {cat.description}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-border/50 flex items-center justify-between text-xs font-mono text-muted-foreground">
                  <span>Explore models</span>
                  <span className="text-[#FF6B35] font-semibold group-hover:underline">
                    Browse →
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

