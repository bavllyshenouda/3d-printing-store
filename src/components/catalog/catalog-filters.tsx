"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  Filter,
  Check,
  RotateCcw,
  Sparkles,
  Banknote,
  Boxes,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CatalogCategory } from "@/lib/data/catalog";
import { useTranslation } from "@/lib/i18n/context";
import { getLocalizedField } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export interface CatalogFilterState {
  category?: string;
  min_price?: number;
  max_price?: number;
  material?: string;
  in_stock_only?: boolean;
}

export interface CatalogFiltersProps {
  categories: CatalogCategory[];
  materials: string[];
  filters: CatalogFilterState;
  onFilterChange: (newFilters: Partial<CatalogFilterState>) => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
  className?: string;
}

export function CatalogFilters({
  categories,
  materials,
  filters,
  onFilterChange,
  onResetFilters,
  hasActiveFilters,
  className,
}: CatalogFiltersProps) {
  const { t, locale } = useTranslation();

  // Local price input state for smooth typing before applying
  const [minPriceInput, setMinPriceInput] = useState<string>(
    filters.min_price !== undefined ? String(filters.min_price) : ""
  );
  const [maxPriceInput, setMaxPriceInput] = useState<string>(
    filters.max_price !== undefined ? String(filters.max_price) : ""
  );

  // Synchronize when external props reset or change
  useEffect(() => {
    setMinPriceInput(filters.min_price !== undefined ? String(filters.min_price) : "");
    setMaxPriceInput(filters.max_price !== undefined ? String(filters.max_price) : "");
  }, [filters.min_price, filters.max_price]);

  const handleApplyPrice = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const min = minPriceInput.trim() !== "" ? Number(minPriceInput) : undefined;
    const max = maxPriceInput.trim() !== "" ? Number(maxPriceInput) : undefined;

    onFilterChange({
      min_price: min !== undefined && !isNaN(min) && min >= 0 ? min : undefined,
      max_price: max !== undefined && !isNaN(max) && max >= 0 ? max : undefined,
    });
  };

  const handlePricePreset = (min?: number, max?: number) => {
    setMinPriceInput(min !== undefined ? String(min) : "");
    setMaxPriceInput(max !== undefined ? String(max) : "");
    onFilterChange({
      min_price: min,
      max_price: max,
    });
  };

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {/* Filters Title Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-[#FF6B35]" />
          <h3 className="font-heading text-sm font-bold tracking-tight text-foreground uppercase">
            {t("catalog.filters")}
          </h3>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-[#FF6B35] transition-colors"
          >
            <RotateCcw className="size-3" />
            <span>{t("catalog.resetFilters")}</span>
          </button>
        )}
      </div>

      {/* 1. Category Filter */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Boxes className="size-3.5 text-[#FF6B35]" />
          {t("catalog.categories")}
        </label>
        <div className="flex flex-col gap-1">
          {/* All Categories Option */}
          <button
            type="button"
            onClick={() => onFilterChange({ category: undefined })}
            className={cn(
              "flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all text-start",
              !filters.category
                ? "bg-[#FF6B35]/10 text-[#FF6B35] font-semibold"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <span>{t("catalog.allCategories")}</span>
            {!filters.category && <Check className="size-3.5 text-[#FF6B35]" />}
          </button>

          {/* Individual Categories */}
          {categories.map((cat) => {
            const isSelected = filters.category === cat.slug;
            const localizedName = getLocalizedField(
              cat as unknown as Record<string, unknown>,
              "name",
              locale,
              cat.name
            );

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onFilterChange({ category: cat.slug })}
                className={cn(
                  "flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all text-start",
                  isSelected
                    ? "bg-[#FF6B35]/10 text-[#FF6B35] font-semibold"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <span className="truncate">{localizedName}</span>
                {isSelected && <Check className="size-3.5 text-[#FF6B35] shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Price Range Filter */}
      <div className="space-y-3 pt-3 border-t border-border/50">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Banknote className="size-3.5 text-[#FF6B35]" />
          {t("catalog.priceRange")}
        </label>

        <form onSubmit={handleApplyPrice} className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[11px] text-muted-foreground mb-1 block">
                {t("catalog.minPrice")}
              </span>
              <input
                type="number"
                min="0"
                step="10"
                placeholder="0"
                value={minPriceInput}
                onChange={(e) => setMinPriceInput(e.target.value)}
                className="w-full h-9 rounded-lg border border-border/80 bg-white dark:bg-[#15181E] px-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-[#FF6B35]"
              />
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground mb-1 block">
                {t("catalog.maxPrice")}
              </span>
              <input
                type="number"
                min="0"
                step="10"
                placeholder="5000"
                value={maxPriceInput}
                onChange={(e) => setMaxPriceInput(e.target.value)}
                className="w-full h-9 rounded-lg border border-border/80 bg-white dark:bg-[#15181E] px-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-[#FF6B35]"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="w-full text-xs h-8"
          >
            {t("catalog.applyPrice")}
          </Button>

          {/* Quick Price Presets */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => handlePricePreset(undefined, 200)}
              className="text-[11px] px-2 py-1 rounded-md border border-border/60 bg-muted/30 hover:border-[#FF6B35]/40 hover:text-[#FF6B35] transition-colors"
            >
              &lt; 200 {t("common.egp")}
            </button>
            <button
              type="button"
              onClick={() => handlePricePreset(200, 600)}
              className="text-[11px] px-2 py-1 rounded-md border border-border/60 bg-muted/30 hover:border-[#FF6B35]/40 hover:text-[#FF6B35] transition-colors"
            >
              200 - 600 {t("common.egp")}
            </button>
            <button
              type="button"
              onClick={() => handlePricePreset(600, undefined)}
              className="text-[11px] px-2 py-1 rounded-md border border-border/60 bg-muted/30 hover:border-[#FF6B35]/40 hover:text-[#FF6B35] transition-colors"
            >
              &gt; 600 {t("common.egp")}
            </button>
          </div>
        </form>
      </div>

      {/* 3. Materials Filter */}
      <div className="space-y-3 pt-3 border-t border-border/50">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Layers className="size-3.5 text-[#FF6B35]" />
          {t("catalog.materials")}
        </label>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => onFilterChange({ material: undefined })}
            className={cn(
              "text-xs px-2.5 py-1.5 rounded-lg border transition-all",
              !filters.material
                ? "border-[#FF6B35] bg-[#FF6B35]/10 text-[#FF6B35] font-semibold"
                : "border-border/70 bg-white dark:bg-[#15181E] text-muted-foreground hover:text-foreground"
            )}
          >
            {t("catalog.allMaterials")}
          </button>
          {materials.map((mat) => {
            const isSelected = filters.material === mat;
            return (
              <button
                key={mat}
                type="button"
                onClick={() =>
                  onFilterChange({ material: isSelected ? undefined : mat })
                }
                className={cn(
                  "text-xs px-2.5 py-1.5 rounded-lg border transition-all",
                  isSelected
                    ? "border-[#FF6B35] bg-[#FF6B35]/10 text-[#FF6B35] font-semibold"
                    : "border-border/70 bg-white dark:bg-[#15181E] text-muted-foreground hover:text-foreground"
                )}
              >
                {mat}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Availability / Stock Status Filter */}
      <div className="pt-3 border-t border-border/50">
        <label className="flex items-center gap-2.5 cursor-pointer group select-none">
          <input
            type="checkbox"
            checked={Boolean(filters.in_stock_only)}
            onChange={(e) => onFilterChange({ in_stock_only: e.target.checked || undefined })}
            className="size-4 rounded border-border/80 text-[#FF6B35] focus:ring-[#FF6B35]/20 cursor-pointer accent-[#FF6B35]"
          />
          <span className="text-xs sm:text-sm font-medium text-foreground group-hover:text-[#FF6B35] transition-colors">
            {t("catalog.inStockOnly")}
          </span>
        </label>
      </div>
    </div>
  );
}

