"use client";

import React, { useState, useEffect } from "react";
import { Filter, X, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CatalogFilters,
  CatalogFilterState,
  CatalogFiltersProps,
} from "./catalog-filters";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

export interface CatalogFilterDrawerProps extends Omit<CatalogFiltersProps, "className"> {
  activeFilterCount: number;
}

export function CatalogFilterDrawer({
  categories,
  materials,
  filters,
  onFilterChange,
  onResetFilters,
  hasActiveFilters,
  activeFilterCount,
}: CatalogFilterDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { t, isRTL } = useTranslation();

  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <>
      {/* Mobile Drawer Trigger Button */}
      <Button
        variant="outline"
        size="default"
        onClick={() => setIsOpen(true)}
        className="relative flex lg:hidden items-center gap-2 border-border/80 bg-white dark:bg-[#15181E] h-11"
        iconLeft={<SlidersHorizontal className="size-4 text-[#FF6B35]" />}
      >
        <span>{t("catalog.openFilters")}</span>
        {activeFilterCount > 0 && (
          <span className="flex size-5 items-center justify-center rounded-full bg-[#FF6B35] text-[11px] font-bold text-white">
            {activeFilterCount}
          </span>
        )}
      </Button>

      {/* Drawer Overlay & Content */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-out Sheet */}
          <div
            className={cn(
              "relative z-50 flex flex-col w-full max-w-sm h-full bg-white dark:bg-[#111318] shadow-2xl transition-transform duration-300 ease-out",
              isRTL ? "ms-auto" : "me-auto"
            )}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-5 border-b border-border/60">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="size-5 text-[#FF6B35]" />
                <h2 className="font-heading text-lg font-bold text-foreground">
                  {t("catalog.filterDrawerTitle")}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label={t("catalog.closeFilters")}
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Scrollable Filters Body */}
            <div className="flex-1 overflow-y-auto p-5">
              <CatalogFilters
                categories={categories}
                materials={materials}
                filters={filters}
                onFilterChange={onFilterChange}
                onResetFilters={onResetFilters}
                hasActiveFilters={hasActiveFilters}
              />
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-border/60 bg-muted/20 flex items-center gap-3">
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="default"
                  className="flex-1"
                  onClick={() => {
                    onResetFilters();
                  }}
                >
                  {t("catalog.resetFilters")}
                </Button>
              )}
              <Button
                variant="default"
                size="default"
                className="flex-1"
                onClick={() => setIsOpen(false)}
              >
                {t("catalog.applyFilters")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
