"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SlidersHorizontal, Loader2 } from "lucide-react";
import { Container } from "@/components/layout/container";
import { CatalogHeader } from "./catalog-header";
import { CatalogSearch } from "./catalog-search";
import { CatalogSort, SortOption } from "./catalog-sort";
import { CatalogFilters, CatalogFilterState } from "./catalog-filters";
import { CatalogActiveFilters } from "./catalog-active-filters";
import { CatalogFilterDrawer } from "./catalog-filter-drawer";
import { CatalogPagination } from "./catalog-pagination";
import { CatalogGrid } from "./catalog-grid";
import {
  CatalogProduct,
  CatalogCategory,
  CatalogPagination as PaginationType,
} from "@/lib/data/catalog";
import { useTranslation } from "@/lib/i18n/context";

export interface CatalogContainerProps {
  initialProducts: CatalogProduct[];
  categories: CatalogCategory[];
  materials: string[];
  initialPagination: PaginationType;
  initialFilters: CatalogFilterState;
  initialSearch?: string;
  initialSort?: SortOption;
}

export function CatalogContainer({
  initialProducts,
  categories,
  materials,
  initialPagination,
  initialFilters,
  initialSearch = "",
  initialSort = "newest",
}: CatalogContainerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  const [products, setProducts] = useState<CatalogProduct[]>(initialProducts);
  const [pagination, setPagination] = useState<PaginationType>(initialPagination);
  const [filters, setFilters] = useState<CatalogFilterState>(initialFilters);
  const [search, setSearch] = useState<string>(initialSearch);
  const [sort, setSort] = useState<SortOption>(initialSort);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Helper to build URL query string from state
  const buildQueryString = useCallback(
    (
      currentFilters: CatalogFilterState,
      currentSearch: string,
      currentSort: SortOption,
      currentPage: number
    ) => {
      const params = new URLSearchParams();

      if (currentPage > 1) {
        params.set("page", String(currentPage));
      }

      if (currentSearch && currentSearch.trim()) {
        params.set("search", currentSearch.trim());
      }

      if (currentFilters.category) {
        params.set("category", currentFilters.category);
      }

      if (currentFilters.min_price !== undefined) {
        params.set("min_price", String(currentFilters.min_price));
      }

      if (currentFilters.max_price !== undefined) {
        params.set("max_price", String(currentFilters.max_price));
      }

      if (currentFilters.material) {
        params.set("material", currentFilters.material);
      }

      if (currentFilters.in_stock_only) {
        params.set("in_stock", "true");
      }

      if (currentSort && currentSort !== "newest") {
        params.set("sort", currentSort);
      }

      return params.toString();
    },
    []
  );

  // Fetch products from API whenever parameters change
  const fetchProducts = useCallback(
    async (
      f: CatalogFilterState,
      s: string,
      so: SortOption,
      p: number,
      updateHistory = true
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const query = buildQueryString(f, s, so, p);
        const url = `/api/products?limit=12&${query}`;

        const res = await fetch(url);
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.error || "Failed to load products");
        }

        let fetchedProducts: CatalogProduct[] = json.data.products || [];

        // Apply in_stock_only filter if toggled
        if (f.in_stock_only) {
          fetchedProducts = fetchedProducts.filter((p) => p.stock > 0);
        }

        setProducts(fetchedProducts);
        setPagination({
          page: json.data.pagination.page,
          limit: json.data.pagination.limit,
          total: f.in_stock_only ? fetchedProducts.length : json.data.pagination.total,
          totalPages: json.data.pagination.total_pages,
          hasNextPage: json.data.pagination.has_next_page,
          hasPrevPage: json.data.pagination.has_prev_page,
        });

        // Update URL query params without full page reload
        if (updateHistory) {
          const newRelativePathQuery = query ? `${pathname}?${query}` : pathname;
          window.history.pushState(null, "", newRelativePathQuery);
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setError(
          err instanceof Error
            ? err.message
            : "An unexpected error occurred while loading products."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [buildQueryString, pathname]
  );

  // Handle browser back/forward navigation (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const page = Number(urlParams.get("page")) || 1;
      const s = urlParams.get("search") || "";
      const cat = urlParams.get("category") || undefined;
      const minP = urlParams.get("min_price") ? Number(urlParams.get("min_price")) : undefined;
      const maxP = urlParams.get("max_price") ? Number(urlParams.get("max_price")) : undefined;
      const mat = urlParams.get("material") || undefined;
      const inStock = urlParams.get("in_stock") === "true";
      const so = (urlParams.get("sort") as SortOption) || "newest";

      const newFilters: CatalogFilterState = {
        category: cat,
        min_price: minP,
        max_price: maxP,
        material: mat,
        in_stock_only: inStock ? true : undefined,
      };

      setFilters(newFilters);
      setSearch(s);
      setSort(so);
      fetchProducts(newFilters, s, so, page, false);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [fetchProducts]);

  // Handler: Search query change
  const handleSearchChange = (query: string) => {
    setSearch(query);
    fetchProducts(filters, query, sort, 1);
  };

  // Handler: Filters update
  const handleFilterChange = (newFilters: Partial<CatalogFilterState>) => {
    const updated: CatalogFilterState = {
      ...filters,
      ...newFilters,
    };
    setFilters(updated);
    fetchProducts(updated, search, sort, 1);
  };

  // Handler: Sort change
  const handleSortChange = (newSort: SortOption) => {
    setSort(newSort);
    fetchProducts(filters, search, newSort, pagination.page);
  };

  // Handler: Page change
  const handlePageChange = (newPage: number) => {
    fetchProducts(filters, search, sort, newPage);
    // Smooth scroll to top of catalog section
    const catalogTop = document.getElementById("catalog-content");
    if (catalogTop) {
      catalogTop.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Handler: Remove individual filter
  const handleRemoveFilter = (key: keyof CatalogFilterState | "search") => {
    if (key === "search") {
      setSearch("");
      fetchProducts(filters, "", sort, 1);
    } else if (key === "min_price") {
      const updated = { ...filters, min_price: undefined, max_price: undefined };
      setFilters(updated);
      fetchProducts(updated, search, sort, 1);
    } else {
      const updated = { ...filters, [key]: undefined };
      setFilters(updated);
      fetchProducts(updated, search, sort, 1);
    }
  };

  // Handler: Clear all filters
  const handleResetFilters = () => {
    const emptyFilters: CatalogFilterState = {};
    setFilters(emptyFilters);
    setSearch("");
    setSort("newest");
    fetchProducts(emptyFilters, "", "newest", 1);
  };

  // Count active filters for badge
  const activeFilterCount =
    (filters.category ? 1 : 0) +
    (filters.min_price !== undefined || filters.max_price !== undefined ? 1 : 0) +
    (filters.material ? 1 : 0) +
    (filters.in_stock_only ? 1 : 0) +
    (search ? 1 : 0);

  const hasActiveFilters = activeFilterCount > 0;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* 1. Catalog Header Hero */}
      <CatalogHeader />

      {/* 2. Catalog Content Section */}
      <section id="catalog-content" className="py-8 sm:py-12 flex-1">
        <Container size="xl">
          {/* Top Control Bar: Search & Sort & Mobile Filter Drawer */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
            {/* Search Input Bar */}
            <div className="flex-1 max-w-xl">
              <CatalogSearch
                initialValue={search}
                onSearch={handleSearchChange}
              />
            </div>

            {/* Sort & Mobile Trigger */}
            <div className="flex flex-wrap items-center justify-between gap-3 sm:flex-nowrap sm:justify-end">
              <CatalogFilterDrawer
                categories={categories}
                materials={materials}
                filters={filters}
                onFilterChange={handleFilterChange}
                onResetFilters={handleResetFilters}
                hasActiveFilters={hasActiveFilters}
                activeFilterCount={activeFilterCount}
              />

              <CatalogSort value={sort} onChange={handleSortChange} />
            </div>
          </div>

          {/* Active Filter Chips */}
          <CatalogActiveFilters
            filters={filters}
            search={search}
            categories={categories}
            onRemoveFilter={handleRemoveFilter}
            onClearAll={handleResetFilters}
            className="mb-6"
          />

          {/* Main 2-Column Catalog Body (Desktop Sidebar + Product Grid) */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
            {/* Desktop Filters Sidebar (1 Column) */}
            <aside className="hidden lg:block lg:col-span-1 rounded-2xl border border-border/70 bg-card p-6 shadow-xs sticky top-24">
              <CatalogFilters
                categories={categories}
                materials={materials}
                filters={filters}
                onFilterChange={handleFilterChange}
                onResetFilters={handleResetFilters}
                hasActiveFilters={hasActiveFilters}
              />
            </aside>

            {/* Product Grid & Pagination (3 Columns) */}
            <main className="lg:col-span-3 space-y-8">
              {/* Results Count Header */}
              <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground pb-2 border-b border-border/40">
                <span>
                  {pagination.total === 1
                    ? t("catalog.showingSingleResult")
                    : t("catalog.showingResults", {
                        count: products.length,
                        total: pagination.total,
                      })}
                </span>
                {isLoading && (
                  <div className="flex items-center gap-1.5 text-[#FF6B35]">
                    <Loader2 className="size-3.5 animate-spin" />
                    <span className="text-xs">{t("catalog.loadingModels")}</span>
                  </div>
                )}
              </div>

              {/* Product Grid Component */}
              <CatalogGrid
                products={products}
                isLoading={isLoading}
                error={error}
                onRetry={() =>
                  fetchProducts(filters, search, sort, pagination.page)
                }
                onResetFilters={handleResetFilters}
              />

              {/* Pagination Bar */}
              <div className="pt-6 border-t border-border/50">
                <CatalogPagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            </main>
          </div>
        </Container>
      </section>
    </div>
  );
}

