"use client";

import React from "react";
import { ArrowUpDown } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

export type SortOption =
  | "newest"
  | "oldest"
  | "price_asc"
  | "price_desc"
  | "name_asc"
  | "name_desc";

export interface CatalogSortProps {
  value: SortOption;
  onChange: (sort: SortOption) => void;
  className?: string;
}

export function CatalogSort({
  value,
  onChange,
  className,
}: CatalogSortProps) {
  const { t } = useTranslation();

  const options: { value: SortOption; label: string }[] = [
    { value: "newest", label: t("catalog.sortNewest") },
    { value: "oldest", label: t("catalog.sortOldest") },
    { value: "price_asc", label: t("catalog.sortPriceAsc") },
    { value: "price_desc", label: t("catalog.sortPriceDesc") },
    { value: "name_asc", label: t("catalog.sortNameAsc") },
    { value: "name_desc", label: t("catalog.sortNameDesc") },
  ];

  return (
    <div className={cn("relative flex items-center gap-2", className)}>
      <label
        htmlFor="catalog-sort"
        className="text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap hidden sm:inline-block"
      >
        {t("catalog.sortBy")}:
      </label>

      <div className="relative flex items-center">
        <ArrowUpDown className="pointer-events-none absolute start-3 size-3.5 text-muted-foreground" />
        <select
          id="catalog-sort"
          aria-label={t("catalog.sortBy")}
          value={value}
          onChange={(e) => onChange(e.target.value as SortOption)}
          className={cn(
            "h-10 rounded-xl border border-border/80 bg-white dark:bg-[#15181E] ps-8 pe-9 text-xs sm:text-sm font-medium text-foreground",
            "shadow-xs transition-colors outline-none cursor-pointer appearance-none",
            "focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 hover:border-border"
          )}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-background text-foreground">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute end-3 flex items-center text-muted-foreground">
          <svg
            className="size-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

