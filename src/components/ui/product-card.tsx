"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Eye, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

export interface ProductCardProps {
  id: string;
  slug: string;
  name: string;
  price: number;
  currency?: string;
  primaryImageUrl?: string | null;
  secondaryImageUrl?: string | null;
  material?: string;
  stockQuantity?: number;
  availableColors?: string[];
  categoryName?: string;
  isFeatured?: boolean;
  onAddToCart?: (id: string, color?: string) => void;
  onQuickView?: (id: string) => void;
  className?: string;
}

export function ProductCard({
  id,
  slug,
  name,
  price,
  currency,
  primaryImageUrl,
  secondaryImageUrl,
  material,
  stockQuantity = 10,
  availableColors = [],
  categoryName,
  isFeatured = false,
  onAddToCart,
  onQuickView,
  className,
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | undefined>(
    availableColors[0]
  );
  const [isFavorited, setIsFavorited] = useState(false);
  const { t } = useTranslation();

  const isOutOfStock = stockQuantity <= 0;
  const isLowStock = stockQuantity > 0 && stockQuantity <= 3;
  const displayCurrency = currency || t("common.egp");

  return (
    <Card
      variant="interactive"
      className={cn("group flex flex-col overflow-hidden p-0", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image Section */}
      <div className="relative aspect-square w-full overflow-hidden bg-muted/30">
        {/* Badges Overlay */}
        <div className="absolute top-3 start-3 z-10 flex flex-col gap-1.5 items-start">
          {isFeatured && (
            <Badge variant="electric" size="sm">
              {t("featured.badge")}
            </Badge>
          )}
          {material && (
            <Badge variant="charcoal" size="sm">
              {material}
            </Badge>
          )}
          {isOutOfStock ? (
            <Badge variant="destructive" size="sm" dot>
              {t("common.soldOut")}
            </Badge>
          ) : isLowStock ? (
            <Badge variant="warning" size="sm" dot pulse>
              {t("common.lowStock", { count: stockQuantity })}
            </Badge>
          ) : null}
        </div>

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            setIsFavorited(!isFavorited);
          }}
          className="absolute top-3 end-3 z-10 flex size-8 items-center justify-center rounded-full bg-white/80 dark:bg-[#111318]/80 text-foreground backdrop-blur-md transition-all hover:bg-white dark:hover:bg-[#111318] hover:scale-110 active:scale-95 shadow-sm"
          aria-label={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            className={cn(
              "size-4 transition-colors",
              isFavorited
                ? "fill-[#FF6B35] text-[#FF6B35]"
                : "text-muted-foreground hover:text-foreground"
            )}
          />
        </button>

        {/* Image Preview with Hover Swap */}
        <Link href={`/products/${slug}`} className="block h-full w-full">
          {primaryImageUrl ? (
            <div className="relative h-full w-full transition-transform duration-500 group-hover:scale-105">
              <Image
                src={isHovered && secondaryImageUrl ? secondaryImageUrl : primaryImageUrl}
                alt={name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover object-center"
              />
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted/40 font-mono text-xs text-muted-foreground">
              [No Image Available]
            </div>
          )}
        </Link>

        {/* Quick View Button on Hover */}
        {onQuickView && (
          <div className="absolute inset-x-3 bottom-3 z-10 opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
            <Button
              variant="charcoal"
              size="sm"
              className="w-full backdrop-blur-md bg-[#111318]/90 text-white"
              iconLeft={<Eye className="size-3.5" />}
              onClick={() => onQuickView(id)}
            >
              {t("common.quickView")}
            </Button>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex flex-1 flex-col p-5">
        {categoryName && (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            {categoryName}
          </span>
        )}

        <Link href={`/products/${slug}`} className="group/title">
          <h4 className="font-heading text-base font-bold text-foreground line-clamp-1 transition-colors group-hover/title:text-[#FF6B35]">
            {name}
          </h4>
        </Link>

        {/* Available Colors */}
        {availableColors.length > 0 && (
          <div className="mt-2.5 flex items-center gap-1.5">
            {availableColors.slice(0, 5).map((color) => {
              const isSelected = selectedColor === color;
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  title={color}
                  className={cn(
                    "size-3.5 rounded-full border transition-all duration-200",
                    isSelected
                      ? "ring-2 ring-[#FF6B35] ring-offset-1 scale-110"
                      : "opacity-75 hover:opacity-100"
                  )}
                  style={{
                    backgroundColor:
                      color.toLowerCase() === "black"
                        ? "#111318"
                        : color.toLowerCase() === "white"
                        ? "#FFFFFF"
                        : color.toLowerCase() === "orange"
                        ? "#FF6B35"
                        : color.toLowerCase() === "silver"
                        ? "#C0C0C0"
                        : color,
                  }}
                  aria-label={`Select color ${color}`}
                />
              );
            })}
            {availableColors.length > 5 && (
              <span className="text-[10px] text-muted-foreground ms-1">
                +{availableColors.length - 5}
              </span>
            )}
          </div>
        )}

        {/* Pricing and Action */}
        <div className="mt-4 flex items-center justify-between pt-3 border-t border-border/50">
          <div>
            <span className="text-xs text-muted-foreground">{t("common.price")}</span>
            <p className="font-heading text-lg font-bold text-foreground">
              {price.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{displayCurrency}</span>
            </p>
          </div>

          <Button
            size="sm"
            variant="default"
            disabled={isOutOfStock}
            onClick={() => onAddToCart?.(id, selectedColor)}
            iconLeft={<ShoppingBag className="size-3.5" />}
          >
            {isOutOfStock ? t("common.soldOut") : t("common.addToCart")}
          </Button>
        </div>
      </div>
    </Card>
  );
}
