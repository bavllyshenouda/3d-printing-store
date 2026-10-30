"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

export interface CatalogPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function CatalogPagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: CatalogPaginationProps) {
  const { t, isRTL } = useTranslation();

  if (totalPages <= 1) {
    return null;
  }

  // Generate page numbers array with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const delta = 1; // Number of pages to show around current

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== "...") {
        pages.push("...");
      }
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <nav
      role="navigation"
      aria-label="Pagination Navigation"
      className={cn("flex flex-wrap items-center justify-center gap-1.5 sm:gap-2", className)}
    >
      {/* Previous Page Button */}
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="h-9 px-3 gap-1 font-medium border-border/80"
        aria-label={t("catalog.paginationPrev")}
      >
        {isRTL ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        <span className="hidden sm:inline">{t("catalog.paginationPrev")}</span>
      </Button>

      {/* Numbered Page Buttons */}
      <div className="flex items-center gap-1">
        {pages.map((p, idx) => {
          if (p === "...") {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="flex size-9 items-center justify-center text-xs font-mono text-muted-foreground"
              >
                ...
              </span>
            );
          }

          const pageNum = Number(p);
          const isActive = pageNum === currentPage;

          return (
            <button
              key={`page-${pageNum}`}
              type="button"
              onClick={() => onPageChange(pageNum)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex size-9 items-center justify-center rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200",
                isActive
                  ? "bg-[#FF6B35] text-white shadow-xs scale-105"
                  : "border border-border/70 bg-white dark:bg-[#15181E] text-foreground hover:border-[#FF6B35]/50 hover:bg-muted/40"
              )}
            >
              {pageNum}
            </button>
          );
        })}
      </div>

      {/* Next Page Button */}
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="h-9 px-3 gap-1 font-medium border-border/80"
        aria-label={t("catalog.paginationNext")}
      >
        <span className="hidden sm:inline">{t("catalog.paginationNext")}</span>
        {isRTL ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
      </Button>
    </nav>
  );
}

