"use client";

import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  RefreshCw,
  Inbox,
  Loader2,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface PaginationMeta {
  page: number;
  limit: number;
  total_items?: number;
  total_pages?: number;
  has_next_page?: boolean;
  has_prev_page?: boolean;
}

interface AdminTableShellProps {
  title?: string;
  subtitle?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  onSearchSubmit?: () => void;
  filterSlot?: React.ReactNode;
  actionSlot?: React.ReactNode;
  children: React.ReactNode;
  pagination?: PaginationMeta;
  onPageChange?: (newPage: number) => void;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRefresh?: () => void;
}

export function AdminTableShell({
  title,
  subtitle,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  filterSlot,
  actionSlot,
  children,
  pagination,
  onPageChange,
  isLoading,
  isEmpty,
  emptyTitle,
  emptyDescription,
  onRefresh,
}: AdminTableShellProps) {
  const { t, isRTL } = useTranslation();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onSearchSubmit) {
      onSearchSubmit();
    }
  };

  const PrevIcon = isRTL ? ChevronRight : ChevronLeft;
  const NextIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
      {/* Table Header: Title + Subtitle + Actions */}
      {(title || subtitle || actionSlot) && (
        <div className="p-4 sm:p-5 border-b border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            {title && (
              <h2 className="text-base sm:text-lg font-heading font-bold text-foreground">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
                className="h-9 px-2.5 text-xs"
                title={t("admin.actions.refresh") || "Refresh"}
              >
                <RefreshCw
                  className={cn("size-3.5", isLoading && "animate-spin text-[#FF6B35]")}
                />
              </Button>
            )}
            {actionSlot}
          </div>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      {(onSearchChange || filterSlot) && (
        <div className="p-3 sm:p-4 bg-muted/30 border-b border-border/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {onSearchChange && (
            <div className="relative flex-1 max-w-md">
              <Search className="size-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchValue || ""}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder || t("admin.searchPlaceholder")}
                className="ps-9 h-9 text-xs bg-background"
              />
            </div>
          )}

          {filterSlot && (
            <div className="flex items-center gap-2 flex-wrap sm:ms-auto">
              {filterSlot}
            </div>
          )}
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-x-auto relative min-h-[220px]">
        {isLoading && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="size-5 animate-spin text-[#FF6B35]" />
              <span className="text-xs font-mono">Loading data...</span>
            </div>
          </div>
        )}

        {!isLoading && isEmpty && (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="size-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mb-3">
              <Inbox className="size-6" />
            </div>
            <h3 className="text-sm font-bold text-foreground">
              {emptyTitle || t("admin.tables.empty")}
            </h3>
            {emptyDescription && (
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                {emptyDescription}
              </p>
            )}
          </div>
        )}

        {!isLoading && !isEmpty && children}
      </div>

      {/* Pagination Footer */}
      {pagination && (pagination.total_pages || 1) > 1 && (
        <div className="p-3 sm:p-4 border-t border-border/80 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="font-mono">
            <span>
              Page {pagination.page} of {pagination.total_pages}
            </span>
            {pagination.total_items !== undefined && (
              <span className="ms-2 text-muted-foreground/80">
                ({pagination.total_items} total)
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange && onPageChange(pagination.page - 1)}
              disabled={!pagination.has_prev_page && pagination.page <= 1}
              className="h-8 px-2 text-xs"
            >
              <PrevIcon className="size-3.5 me-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange && onPageChange(pagination.page + 1)}
              disabled={
                !pagination.has_next_page &&
                pagination.page >= (pagination.total_pages || 1)
              }
              className="h-8 px-2 text-xs"
            >
              Next
              <NextIcon className="size-3.5 ms-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

