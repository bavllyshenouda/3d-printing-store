"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Minus,
  Plus,
  Trash2,
  AlertTriangle,
  Loader2,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CartItem } from "@/lib/cart/context";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

export interface CartItemRowProps {
  item: CartItem;
  isUpdating?: boolean;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  compact?: boolean;
  className?: string;
}

export function CartItemRow({
  item,
  isUpdating = false,
  onUpdateQuantity,
  onRemove,
  compact = false,
  className,
}: CartItemRowProps) {
  const { t } = useTranslation();
  const product = item.product;

  const maxStock = product?.available_stock || 99;
  const isOutOfStock = !item.is_available;

  return (
    <div
      className={cn(
        "relative flex items-center gap-4 py-4 border-b border-border/60 transition-all duration-200",
        isOutOfStock && "opacity-80 bg-red-500/5 -mx-3 px-3 rounded-xl",
        className
      )}
    >
      {/* 1. Product Thumbnail */}
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border border-border/70 bg-muted/30 shrink-0",
          compact ? "size-16 sm:size-18" : "size-20 sm:size-24"
        )}
      >
        {product?.primary_image ? (
          <Image
            src={product.primary_image}
            alt={product.name || "Product"}
            fill
            sizes="96px"
            className="object-cover object-center"
          />
        ) : (
          <div className="flex size-full items-center justify-center font-mono text-[10px] text-muted-foreground bg-muted/40">
            <Layers className="size-5 text-[#FF6B35] opacity-40" />
          </div>
        )}
      </div>

      {/* 2. Details & Controls */}
      <div className="flex flex-1 flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start justify-between gap-2">
            {/* Title */}
            <Link
              href={product?.slug ? `/products/${product.slug}` : "#"}
              className="font-heading font-bold text-sm sm:text-base text-foreground hover:text-[#FF6B35] transition-colors truncate"
            >
              {product?.name || "3D Printed Model"}
            </Link>

            {/* Remove Button */}
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              disabled={isUpdating}
              className="text-muted-foreground hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-500/10 shrink-0"
              aria-label={t("cart.removeItem")}
            >
              <Trash2 className="size-4" />
            </button>
          </div>

          {/* Color & Material Badges */}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {item.color && (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <span className="size-2 rounded-full bg-[#FF6B35]" />
                <span>
                  {t("cart.colorLabel")}: {item.color}
                </span>
              </span>
            )}

            {product?.material && (
              <Badge variant="charcoal" size="sm" className="text-[10px] py-0 px-1.5">
                {product.material}
              </Badge>
            )}
          </div>

          {/* Stock / Availability Warning */}
          {item.unavailable_reason && (
            <p className="flex items-center gap-1.5 text-xs text-red-500 mt-1 font-medium">
              <AlertTriangle className="size-3.5 shrink-0" />
              <span>{item.unavailable_reason}</span>
            </p>
          )}
        </div>

        {/* 3. Stepper & Price Line */}
        <div className="flex items-center justify-between gap-3 mt-3 pt-2">
          {/* Quantity Stepper */}
          <div className="flex items-center border border-border/80 rounded-xl bg-white dark:bg-[#15181E] p-0.5 shadow-xs">
            <button
              type="button"
              disabled={item.quantity <= 1 || isUpdating}
              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
              className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus className="size-3.5" />
            </button>

            <span className="w-8 text-center text-xs font-bold text-foreground">
              {isUpdating ? (
                <Loader2 className="size-3 animate-spin mx-auto text-[#FF6B35]" />
              ) : (
                item.quantity
              )}
            </span>

            <button
              type="button"
              disabled={item.quantity >= maxStock || isUpdating}
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              aria-label="Increase quantity"
            >
              <Plus className="size-3.5" />
            </button>
          </div>

          {/* Authoritative Line Price */}
          <div className="text-end">
            <p className="font-heading text-sm sm:text-base font-bold text-foreground">
              {item.line_total.toLocaleString()}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                {t("common.egp")}
              </span>
            </p>
            {item.quantity > 1 && (
              <p className="text-[10px] text-muted-foreground">
                {item.unit_price.toLocaleString()} {t("common.egp")}/ea
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

