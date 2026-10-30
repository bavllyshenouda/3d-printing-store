"use client";

import React from "react";
import { ProductCard } from "@/components/ui/product-card";
import { CatalogProduct } from "@/lib/data/catalog";
import { useTranslation } from "@/lib/i18n/context";
import { getLocalizedField } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export interface ProductRelatedProps {
  products: CatalogProduct[];
  className?: string;
}

export function ProductRelated({ products, className }: ProductRelatedProps) {
  const { t, locale } = useTranslation();

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className={cn("py-12 border-t border-border/60", className)}>
      <div className="flex flex-col gap-8">
        <div>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {t("product.relatedProducts")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("product.relatedProductsSubtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

            const primaryImg =
              product.images?.find((img) => img.is_primary)?.image_url ||
              product.images?.[0]?.image_url;
            const secondaryImg = product.images?.[1]?.image_url;

            return (
              <ProductCard
                key={product.id}
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
                onAddToCart={() => {
                  window.location.href = `/products/${product.slug}`;
                }}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

