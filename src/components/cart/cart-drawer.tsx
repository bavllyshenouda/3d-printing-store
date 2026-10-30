"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  X,
  ArrowRight,
  ShieldCheck,
  Lock,
  Box,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CartItemRow } from "./cart-item-row";
import { useCart } from "@/lib/cart/context";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

export function CartDrawer() {
  const {
    items,
    summary,
    isDrawerOpen,
    closeDrawer,
    updateQuantity,
    removeItem,
    updatingItemIds,
  } = useCart();
  const { t, isRTL } = useTranslation();

  // Prevent background scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDrawerOpen) {
        closeDrawer();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  if (!isDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* 1. Backdrop Blur */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* 2. Slide-out Drawer Panel */}
      <div
        className={cn(
          "relative z-50 flex flex-col w-full max-w-md h-full bg-white dark:bg-[#111318] shadow-2xl transition-transform duration-300 ease-out",
          isRTL ? "me-auto" : "ms-auto"
        )}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#FF6B35]/15 text-[#FF6B35]">
              <ShoppingBag className="size-4" />
            </div>
            <h2 className="font-heading text-lg font-bold text-foreground">
              {t("cart.drawerTitle")}
            </h2>
            {summary.total_items > 0 && (
              <Badge variant="electric" size="sm" className="font-mono">
                {summary.total_items}
              </Badge>
            )}
          </div>

          <button
            type="button"
            onClick={closeDrawer}
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label={t("cart.closeDrawer")}
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Drawer Body (Items or Empty State) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-[#FF6B35]/10 text-[#FF6B35]">
                <Box className="size-8" />
              </div>
              <h3 className="font-heading text-lg font-bold text-foreground">
                {t("cart.emptyTitle")}
              </h3>
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                {t("cart.emptyDesc")}
              </p>
              <Link href="/shop" onClick={closeDrawer} className="pt-2">
                <Button variant="default" size="default">
                  {t("cart.exploreCta")}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {items.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  compact
                  isUpdating={updatingItemIds.has(item.id)}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                />
              ))}
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        {items.length > 0 && (
          <div className="p-5 border-t border-border/60 bg-muted/20 space-y-4">
            {/* Subtotal Display */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("cart.subtotal")}</span>
                <span className="font-heading font-black text-lg text-foreground">
                  {summary.subtotal.toLocaleString()}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    {t("common.egp")}
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t("cart.shipping")}</span>
                <span>{t("cart.shippingCalculated")}</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-2.5">
              <Link
                href="/checkout"
                onClick={closeDrawer}
                className={cn(summary.has_unavailable_items && "pointer-events-none opacity-50")}
              >
                <Button
                  variant="default"
                  size="default"
                  className="w-full h-11 text-sm font-bold shadow-sm"
                  disabled={summary.has_unavailable_items}
                  iconLeft={<Lock className="size-4" />}
                  iconRight={<ArrowRight className="size-4 rtl:rotate-180" />}
                >
                  {t("cart.proceedToCheckout")}
                </Button>
              </Link>

              <Link href="/cart" onClick={closeDrawer}>
                <Button
                  variant="outline"
                  size="default"
                  className="w-full text-xs h-10 border-border/80"
                >
                  {t("cart.viewCart")}
                </Button>
              </Link>
            </div>

            {/* Trust Guarantee Note */}
            <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1.5">
              <ShieldCheck className="size-3.5 text-[#FF6B35]" />
              <span>{t("cart.guaranteeNotice")}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

