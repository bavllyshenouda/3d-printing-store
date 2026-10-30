"use client";

import React from "react";
import { X, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CatalogCategory } from "@/lib/data/catalog";
import { CatalogFilterState } from "./catalog-filters";
import { useTranslation } from "@/lib/i18n/context";
import { getLocalizedField } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export interface CatalogActiveFiltersProps {
  filters: CatalogFilterState;
  search?: string;
  categories: CatalogCategory[];
  onRemoveFilter: (key: keyof CatalogFilterState | "search") => void;
  onClearAll: () => void;
  className?: string;
}

export function CatalogActiveFilters({
  filters,
  search,
  categories,
  onRemoveFilter,
  onClearAll,
  className,
}: CatalogActiveFiltersProps) {
  const { t, locale } = useTranslation();

  const hasSearch = Boolean(search && search.trim());
  const hasCategory = Boolean(filters.category);
  const hasPrice = filters.min_price !== undefined || filters.max_price !== undefined;
  const hasMaterial = Boolean(filters.material);
  const hasInStock = Boolean(filters.in_stock_only);

  const hasAnyFilter = hasSearch || hasCategory || hasPrice || hasMaterial || hasInStock;

  if (!hasAnyFilter) {
    return null;
  }

  // Get localized category name
  const activeCategory = filters.category
    ? categories.find((c) => c.slug === filters.category)
    : null;
  const categoryDisplayName = activeCategory
    ? getLocalizedField(
        activeCategory as unknown as Record<string, unknown>,
        "name",
        locale,
        activeCategory.name
      )
    : filters.category;

  // Format price label
  let priceLabel = "";
  if (filters.min_price !== undefined && filters.max_price !== undefined) {
    priceLabel = `${filters.min_price} - ${filters.max_price} ${t("common.egp")}`;
  } else if (filters.min_price !== undefined) {
    priceLabel = `≥ ${filters.min_price} ${t("common.egp")}`;
  } else if (filters.max_price !== undefined) {
    priceLabel = `≤ ${filters.max_price} ${t("common.egp")}`;
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2 pt-2 pb-1", className)}>
      <span className="text-xs text-muted-foreground font-semibold me-1">
        {t("catalog.activeFilters")}
      </span>

      {/* Search Filter Chip */}
      {hasSearch && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#FF6B35]/10 text-[#FF6B35] border border-[#FF6B35]/20">
          <span>{t("catalog.filterSearch", { query: search || "" })}</span>
          <button
            type="button"
            onClick={() => onRemoveFilter("search")}
            className="rounded-full hover:bg-[#FF6B35]/20 p-0.5 transition-colors"
            aria-label="Remove search filter"
          >
            <X className="size-3" />
          </button>
        </span>
      )}

      {/* Category Filter Chip */}
      {hasCategory && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#FF6B35]/10 text-[#FF6B35] border border-[#FF6B35]/20">
          <span>{categoryDisplayName}</span>
          <button
            type="button"
            onClick={() => onRemoveFilter("category")}
            className="rounded-full hover:bg-[#FF6B35]/20 p-0.5 transition-colors"
            aria-label="Remove category filter"
          >
            <X className="size-3" />
          </button>
        </span>
      )}

      {/* Price Range Chip */}
      {hasPrice && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#FF6B35]/10 text-[#FF6B35] border border-[#FF6B35]/20">
          <span>{priceLabel}</span>
          <button
            type="button"
            onClick={() => onRemoveFilter("min_price")}
            className="rounded-full hover:bg-[#FF6B35]/20 p-0.5 transition-colors"
            aria-label="Remove price filter"
          >
            <X className="size-3" />
          </button>
        </span>
      )}

      {/* Material Chip */}
      {hasMaterial && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#FF6B35]/10 text-[#FF6B35] border border-[#FF6B35]/20">
          <span>{t("catalog.filterMaterial", { material: filters.material || "" })}</span>
          <button
            type="button"
            onClick={() => onRemoveFilter("material")}
            className="rounded-full hover:bg-[#FF6B35]/20 p-0.5 transition-colors"
            aria-label="Remove material filter"
          >
            <X className="size-3" />
          </button>
        </span>
      )}

      {/* In-stock Chip */}
      {hasInStock && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#FF6B35]/10 text-[#FF6B35] border border-[#FF6B35]/20">
          <span>{t("catalog.filterInStock")}</span>
          <button
            type="button"
            onClick={() => onRemoveFilter("in_stock_only")}
            className="rounded-full hover:bg-[#FF6B35]/20 p-0.5 transition-colors"
            aria-label="Remove in stock filter"
          >
            <X className="size-3" />
          </button>
        </span>
      )}

      {/* Clear All Button */}
      <button
        type="button"
        onClick={onClearAll}
        className="text-xs text-muted-foreground hover:text-[#FF6B35] transition-colors underline ms-1"
      >
        {t("catalog.clearAllFilters")}
      </button>
    </div>
  );
}
