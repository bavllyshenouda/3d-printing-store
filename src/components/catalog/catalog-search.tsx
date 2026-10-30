"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

export interface CatalogSearchProps {
  initialValue?: string;
  onSearch: (query: string) => void;
  className?: string;
}

export function CatalogSearch({
  initialValue = "",
  onSearch,
  className,
}: CatalogSearchProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [isPending, startTransition] = useTransition();

  // Sync internal state if initialValue prop changes (e.g. on clear all)
  useEffect(() => {
    setSearchTerm(initialValue);
  }, [initialValue]);

  // Debounce search input updates (350ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== initialValue) {
        startTransition(() => {
          onSearch(searchTerm.trim());
        });
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchTerm, initialValue, onSearch]);

  const handleClear = () => {
    setSearchTerm("");
    startTransition(() => {
      onSearch("");
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      startTransition(() => {
        onSearch(searchTerm.trim());
      });
    } else if (e.key === "Escape") {
      handleClear();
    }
  };

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative flex items-center">
        {/* Leading Search Icon / Pending Loader */}
        <div className="pointer-events-none absolute start-3.5 flex items-center justify-center text-muted-foreground">
          {isPending ? (
            <Loader2 className="size-4 animate-spin text-[#FF6B35]" />
          ) : (
            <Search className="size-4" />
          )}
        </div>

        {/* Input Field */}
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("catalog.searchPlaceholder")}
          aria-label={t("catalog.searchAria")}
          className={cn(
            "h-11 w-full rounded-xl border border-border/80 bg-white dark:bg-[#15181E] px-10 text-sm text-foreground placeholder:text-muted-foreground/70",
            "shadow-xs transition-all duration-200 outline-none",
            "focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20",
            "hover:border-border"
          )}
        />

        {/* Clear Button */}
        {searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute end-3 flex size-6 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label={t("catalog.clearSearch")}
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

