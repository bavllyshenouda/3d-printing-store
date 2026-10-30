"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Check,
  ChevronRight,
  Minus,
  Plus,
  Loader2,
  ShieldCheck,
  Truck,
  RotateCcw,
  Zap,
  MessageCircle,
  AlertTriangle,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { ProductDetail } from "@/lib/data/product-detail";
import { ProductAuthModal } from "./product-auth-modal";
import { useTranslation } from "@/lib/i18n/context";
import { useCart } from "@/lib/cart/context";
import { getLocalizedField } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export interface ProductInfoProps {
  product: ProductDetail;
  className?: string;
}

export function ProductInfo({ product, className }: ProductInfoProps) {
  const { t, locale, isRTL } = useTranslation();
  const { openDrawer } = useCart();

  const colors =
    product.available_colors && product.available_colors.length > 0
      ? product.available_colors
      : ["Standard"];

  const [selectedColor, setSelectedColor] = useState<string>(colors[0]);
  const [quantity, setQuantity] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 3;
  const maxAvailable = product.stock;

  const localizedName = getLocalizedField(
    product as unknown as Record<string, unknown>,
    "name",
    locale,
    product.name
  );

  const localizedDesc = getLocalizedField(
    product as unknown as Record<string, unknown>,
    "description",
    locale,
    product.description || ""
  );

  const localizedCategoryName = product.category
    ? getLocalizedField(
        product.category as unknown as Record<string, unknown>,
        "name",
        locale,
        product.category.name
      )
    : null;

  // Quantity control handlers
  const handleDecrement = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleIncrement = () => {
    if (quantity < maxAvailable) {
      setQuantity((prev) => prev + 1);
    }
  };

  const handleQuantityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 1) {
      setQuantity(1);
    } else if (val > maxAvailable) {
      setQuantity(maxAvailable);
    } else {
      setQuantity(val);
    }
  };

  // Add to cart submission with authoritative backend validation
  const handleAddToCart = async () => {
    if (isOutOfStock || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: product.id,
          color: selectedColor,
          quantity,
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        // Unauthenticated customer
        setShowAuthModal(true);
        return;
      }

      if (!response.ok || !data.success) {
        toast.error(
          t("common.error"),
          data.error || "Failed to add product to cart"
        );
        return;
      }

      // Success feedback
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2500);

      toast.success(
        t("product.itemAddedToastTitle"),
        t("product.itemAddedToastDesc", {
          name: localizedName,
          color: selectedColor,
          quantity,
        })
      );

      // Open slide-out cart drawer
      openDrawer();

      // Notify global listeners (e.g. Navbar cart badge)
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("cart-updated"));
      }
    } catch (err) {
      console.error("Cart addition failed:", err);
      toast.error(t("common.error"), t("common.somethingWentWrong"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {/* 1. Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap"
      >
        <Link
          href="/"
          className="hover:text-foreground transition-colors hover:underline"
        >
          {t("product.breadcrumbHome")}
        </Link>
        <ChevronRight className="size-3 rtl:rotate-180 text-muted-foreground/60" />
        <Link
          href="/shop"
          className="hover:text-foreground transition-colors hover:underline"
        >
          {t("product.breadcrumbCatalog")}
        </Link>
        {product.category && (
          <>
            <ChevronRight className="size-3 rtl:rotate-180 text-muted-foreground/60" />
            <Link
              href={`/shop?category=${product.category.slug}`}
              className="hover:text-foreground transition-colors hover:underline"
            >
              {localizedCategoryName}
            </Link>
          </>
        )}
      </nav>

      {/* 2. Header: Category Pill & Title */}
      <div className="space-y-2">
        {product.category && (
          <Link href={`/shop?category=${product.category.slug}`}>
            <Badge
              variant="outline"
              size="sm"
              className="hover:border-[#FF6B35]/60 hover:text-[#FF6B35] transition-colors"
            >
              {localizedCategoryName}
            </Badge>
          </Link>
        )}

        <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
          {localizedName}
        </h1>
      </div>

      {/* 3. Availability Banner */}
      <div className="flex items-center gap-2">
        {isOutOfStock ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">
            <span className="size-2 rounded-full bg-red-500" />
            <span>{t("product.outOfStock")}</span>
          </div>
        ) : isLowStock ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
            <span>{t("product.lowStockWarning", { count: product.stock })}</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span>{t("product.readyToDispatch")}</span>
          </div>
        )}
      </div>

      {/* 4. Price Display */}
      <div className="p-4 rounded-2xl bg-muted/30 border border-border/70 flex items-baseline justify-between">
        <div>
          <span className="text-xs text-muted-foreground block mb-0.5">
            {t("common.price")}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-heading text-3xl sm:text-4xl font-black text-foreground">
              {product.price.toLocaleString()}
            </span>
            <span className="text-sm font-semibold text-muted-foreground">
              {t("common.egp")}
            </span>
          </div>
        </div>

        {product.material && (
          <div className="text-end">
            <span className="text-xs text-muted-foreground block mb-0.5">
              {t("common.material")}
            </span>
            <Badge variant="charcoal" size="sm">
              {product.material}
            </Badge>
          </div>
        )}
      </div>

      {/* 5. Description */}
      {localizedDesc && (
        <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line border-b border-border/50 pb-6">
          {localizedDesc}
        </div>
      )}

      {/* 6. Color Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold uppercase tracking-wider text-muted-foreground">
            {t("product.selectColor")}
          </span>
          <span className="font-medium text-foreground">
            {t("product.selectedColor", { color: selectedColor })}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {colors.map((color) => {
            const isSelected = selectedColor === color;
            const cLower = color.toLowerCase();

            // Color swatch styling
            const swatchBg =
              cLower === "black" || cLower === "matte black"
                ? "#111318"
                : cLower === "white" || cLower === "pure white"
                ? "#FFFFFF"
                : cLower === "orange" || cLower === "electric orange"
                ? "#FF6B35"
                : cLower === "grey" || cLower === "gray" || cLower === "silver"
                ? "#808080"
                : cLower === "blue" || cLower === "cyan"
                ? "#0070F3"
                : cLower === "red"
                ? "#E00"
                : cLower === "green"
                ? "#00AA66"
                : "#666666";

            return (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                className={cn(
                  "group relative flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all duration-200 outline-none",
                  isSelected
                    ? "border-[#FF6B35] bg-[#FF6B35]/10 text-foreground ring-2 ring-[#FF6B35]/20 shadow-xs"
                    : "border-border/80 bg-white dark:bg-[#15181E] text-muted-foreground hover:border-border hover:text-foreground"
                )}
                aria-label={`Select color ${color}`}
              >
                <span
                  className="size-3.5 rounded-full border border-black/20 dark:border-white/20 shrink-0"
                  style={{ backgroundColor: swatchBg }}
                />
                <span>{color}</span>
                {isSelected && <Check className="size-3.5 text-[#FF6B35] ms-1" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 7. Quantity Selector & Add to Cart Controls */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Quantity Controls */}
          <div className="flex items-center justify-between sm:justify-start border border-border/80 rounded-xl bg-white dark:bg-[#15181E] p-1 h-12 shadow-xs">
            <button
              type="button"
              disabled={quantity <= 1 || isOutOfStock}
              onClick={handleDecrement}
              className="flex size-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus className="size-4" />
            </button>

            <input
              type="number"
              min="1"
              max={maxAvailable}
              value={quantity}
              onChange={handleQuantityInputChange}
              disabled={isOutOfStock}
              className="w-12 text-center text-sm font-bold bg-transparent outline-none text-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              aria-label={t("product.quantity")}
            />

            <button
              type="button"
              disabled={quantity >= maxAvailable || isOutOfStock}
              onClick={handleIncrement}
              className="flex size-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              aria-label="Increase quantity"
            >
              <Plus className="size-4" />
            </button>
          </div>

          {/* Add to Cart Primary Button */}
          <Button
            variant="default"
            size="default"
            disabled={isOutOfStock || isSubmitting}
            onClick={handleAddToCart}
            className={cn(
              "flex-1 h-12 text-sm sm:text-base font-bold shadow-md transition-all duration-300",
              justAdded && "bg-emerald-600 hover:bg-emerald-600"
            )}
            iconLeft={
              isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : justAdded ? (
                <Check className="size-5" />
              ) : (
                <ShoppingBag className="size-5" />
              )
            }
          >
            {isSubmitting
              ? t("product.addingToCart")
              : justAdded
              ? t("product.addedSuccess")
              : isOutOfStock
              ? t("common.soldOut")
              : t("product.addToCart")}
          </Button>
        </div>

        {/* Max Stock Helper Warning */}
        {quantity >= maxAvailable && !isOutOfStock && maxAvailable > 0 && (
          <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
            <AlertTriangle className="size-3.5 shrink-0" />
            <span>{t("product.maxStockReached", { stock: maxAvailable })}</span>
          </p>
        )}
      </div>

      {/* 8. Studio Trust Points */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/50">
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/20 border border-border/50">
          <ShieldCheck className="size-4 text-[#FF6B35] shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-foreground">
              {t("product.trustTitle1")}
            </h4>
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
              {t("product.trustDesc1")}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/20 border border-border/50">
          <Truck className="size-4 text-[#FF6B35] shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-foreground">
              {t("product.trustTitle2")}
            </h4>
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
              {t("product.trustDesc2")}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/20 border border-border/50">
          <Zap className="size-4 text-[#FF6B35] shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-foreground">
              {t("product.trustTitle3")}
            </h4>
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
              {t("product.trustDesc3")}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/20 border border-border/50">
          <MessageCircle className="size-4 text-[#FF6B35] shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-foreground">
              {t("product.trustTitle4")}
            </h4>
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
              {t("product.trustDesc4")}
            </p>
          </div>
        </div>
      </div>

      {/* 9. Unauthenticated Login Modal */}
      <ProductAuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        productSlug={product.slug}
      />
    </div>
  );
}

