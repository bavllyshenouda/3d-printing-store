"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, RotateCcw, UploadCloud, Eye, ShoppingBag } from "lucide-react";
import { ProductCard } from "@/components/ui/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { CatalogProduct } from "@/lib/data/catalog";
import { useTranslation } from "@/lib/i18n/context";
import { getLocalizedField } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export interface CatalogGridProps {
  products: CatalogProduct[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onResetFilters?: () => void;
  className?: string;
}

export function CatalogGrid({
  products,
  isLoading = false,
  error = null,
  onRetry,
  onResetFilters,
  className,
}: CatalogGridProps) {
  const { t, locale } = useTranslation();
  const [quickViewProduct, setQuickViewProduct] = useState<CatalogProduct | null>(null);

  // 1. Error State
  if (error) {
    return (
      <div className="py-12">
        <ErrorState
          title={t("common.error")}
          message={error}
          onRetry={onRetry}
          retryLabel={t("common.retry")}
        />
      </div>
    );
  }

  // 2. Loading Skeletons
  if (isLoading) {
    return (
      <div
        className={cn(
          "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6",
          className
        )}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={`product-skeleton-${i}`}
            className="flex flex-col rounded-2xl border border-border/70 bg-card overflow-hidden"
          >
            {/* Square image placeholder */}
            <Skeleton className="aspect-square w-full rounded-none" />

            {/* Content placeholders */}
            <div className="p-5 space-y-3">
              <Skeleton className="h-3 w-1/3 rounded-md" />
              <Skeleton className="h-5 w-4/5 rounded-md" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-3.5 w-3.5 rounded-full" />
                <Skeleton className="h-3.5 w-3.5 rounded-full" />
                <Skeleton className="h-3.5 w-3.5 rounded-full" />
              </div>
              <div className="pt-4 flex items-center justify-between border-t border-border/40">
                <div className="space-y-1">
                  <Skeleton className="h-2.5 w-10 rounded-sm" />
                  <Skeleton className="h-5 w-16 rounded-md" />
                </div>
                <Skeleton className="h-8 w-24 rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 3. Empty State
  if (!products || products.length === 0) {
    return (
      <div className="py-8">
        <EmptyState
          icon={<Search className="size-7" />}
          title={t("catalog.noProductsFound")}
          description={t("catalog.noProductsFoundDesc")}
          action={
            onResetFilters && (
              <Button
                variant="default"
                size="default"
                onClick={onResetFilters}
                iconLeft={<RotateCcw className="size-4" />}
              >
                {t("catalog.resetFilters")}
              </Button>
            )
          }
          secondaryAction={
            <Link href="/custom-prints">
              <Button
                variant="outline"
                size="default"
                iconLeft={<UploadCloud className="size-4 text-[#FF6B35]" />}
              >
                {t("catalog.customPrintCta")}
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  // 4. Products Grid
  return (
    <>
      <div
        className={cn(
          "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6",
          className
        )}
      >
        {products.map((product) => {
          const localizedName = getLocalizedField(
            product as unknown as Record<string, unknown>,
            "name",
            locale,
            product.name
          );
          const localizedCategory = product.category
            ? getLocalizedField(
                product.category as unknown as Record<string, unknown>,
                "name",
                locale,
                product.category.name
              )
            : undefined;

          const primaryImg = product.images?.find((img) => img.is_primary)?.image_url ||
            product.images?.[0]?.image_url;
          const secondaryImg = product.images?.[1]?.image_url;

          return (
            <div key={product.id} className="transition-all duration-300">
              <ProductCard
                id={product.id}
                slug={product.slug}
                name={localizedName}
                price={product.price}
                material={product.material || undefined}
                stockQuantity={product.stock}
                availableColors={product.available_colors || []}
                categoryName={localizedCategory}
                isFeatured={product.is_featured}
                primaryImageUrl={primaryImg}
                secondaryImageUrl={secondaryImg}
                onQuickView={() => setQuickViewProduct(product)}
                onAddToCart={(id) => {
                  // Direct to product page or cart toast
                  window.location.href = `/products/${product.slug}`;
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <Modal
          open={Boolean(quickViewProduct)}
          onClose={() => setQuickViewProduct(null)}
          title={getLocalizedField(
            quickViewProduct as unknown as Record<string, unknown>,
            "name",
            locale,
            quickViewProduct.name
          )}
          maxWidth="lg"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-1">
            {/* Image Preview */}
            <div className="relative aspect-square rounded-xl overflow-hidden bg-muted/30 border border-border/60">
              {quickViewProduct.images?.[0]?.image_url ? (
                <img
                  src={quickViewProduct.images[0].image_url}
                  alt={quickViewProduct.name}
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-mono text-xs text-muted-foreground">
                  [No Preview Available]
                </div>
              )}
            </div>

            {/* Details & Actions */}
            <div className="flex flex-col justify-between space-y-4">
              <div>
                {quickViewProduct.category && (
                  <Badge variant="outline" size="sm" className="mb-2">
                    {getLocalizedField(
                      quickViewProduct.category as unknown as Record<string, unknown>,
                      "name",
                      locale,
                      quickViewProduct.category.name
                    )}
                  </Badge>
                )}

                <h3 className="font-heading text-xl font-bold text-foreground">
                  {getLocalizedField(
                    quickViewProduct as unknown as Record<string, unknown>,
                    "name",
                    locale,
                    quickViewProduct.name
                  )}
                </h3>

                <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-4">
                  {getLocalizedField(
                    quickViewProduct as unknown as Record<string, unknown>,
                    "description",
                    locale,
                    quickViewProduct.description || ""
                  ) || t("catalog.pageSubtitle")}
                </p>

                {quickViewProduct.material && (
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-semibold">
                      {t("common.material")}:
                    </span>
                    <Badge variant="charcoal" size="sm">
                      {quickViewProduct.material}
                    </Badge>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-border/60">
                <div className="flex items-baseline justify-between mb-4">
                  <span className="text-xs text-muted-foreground">
                    {t("common.price")}
                  </span>
                  <span className="font-heading text-2xl font-bold text-foreground">
                    {quickViewProduct.price.toLocaleString()}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      {t("common.egp")}
                    </span>
                  </span>
                </div>

                <div className="flex gap-3">
                  <Link
                    href={`/products/${quickViewProduct.slug}`}
                    className="flex-1"
                  >
                    <Button variant="default" size="default" className="w-full">
                      {t("common.exploreCatalog")}
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() => setQuickViewProduct(null)}
                  >
                    {t("common.close")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
