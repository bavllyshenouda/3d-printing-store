"use client";

import React from "react";
import Link from "next/link";
import {
  ShoppingBag,
  ArrowLeft,
  ArrowRight,
  Box,
  UploadCloud,
  Layers,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { CartItemRow } from "./cart-item-row";
import { CartSummaryCard } from "./cart-summary";
import { useCart } from "@/lib/cart/context";
import { useTranslation } from "@/lib/i18n/context";

export function CartView() {
  const { items, summary, isLoading, updateQuantity, removeItem, updatingItemIds } =
    useCart();
  const { t, isRTL } = useTranslation();

  // 1. Loading Skeleton
  if (isLoading) {
    return (
      <div className="py-10 sm:py-16 bg-background min-h-[70vh]">
        <Container size="xl">
          <div className="space-y-6">
            <Skeleton className="h-10 w-64 rounded-xl" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 space-y-4">
                <Skeleton className="h-28 w-full rounded-2xl" />
                <Skeleton className="h-28 w-full rounded-2xl" />
                <Skeleton className="h-28 w-full rounded-2xl" />
              </div>
              <div className="lg:col-span-4">
                <Skeleton className="h-72 w-full rounded-3xl" />
              </div>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  // 2. Empty Cart State
  if (items.length === 0) {
    return (
      <div className="py-16 sm:py-24 bg-background min-h-[70vh] flex items-center">
        <Container size="default">
          <EmptyState
            icon={<ShoppingBag className="size-8" />}
            title={t("cart.emptyTitle")}
            description={t("cart.emptyDesc")}
            action={
              <Link href="/shop">
                <Button variant="default" size="default">
                  {t("cart.exploreCta")}
                </Button>
              </Link>
            }
            secondaryAction={
              <Link href="/custom-prints">
                <Button
                  variant="outline"
                  size="default"
                  iconLeft={<UploadCloud className="size-4 text-[#FF6B35]" />}
                >
                  {t("common.requestCustomPrint")}
                </Button>
              </Link>
            }
          />
        </Container>
      </div>
    );
  }

  // 3. Full Cart Layout
  return (
    <div className="py-10 sm:py-16 bg-background min-h-screen">
      <Container size="xl" className="space-y-8">
        {/* Page Title & Count Badge */}
        <div className="flex items-center justify-between pb-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              {t("cart.title")}
            </h1>
            <Badge variant="electric" size="sm" className="font-mono">
              {summary.total_items === 1
                ? t("cart.singleItem")
                : t("cart.itemsCount", { count: summary.total_items })}
            </Badge>
          </div>

          <Link
            href="/shop"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-[#FF6B35] transition-colors"
          >
            {isRTL ? <ArrowRight className="size-3.5" /> : <ArrowLeft className="size-3.5" />}
            <span>{t("cart.continueShopping")}</span>
          </Link>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Cart Items List (8 Columns) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs divide-y divide-border/60">
              {items.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  isUpdating={updatingItemIds.has(item.id)}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                />
              ))}
            </div>

            {/* Bottom Continue Shopping Link */}
            <div className="pt-2">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-[#FF6B35] transition-colors"
              >
                {isRTL ? (
                  <ArrowRight className="size-4" />
                ) : (
                  <ArrowLeft className="size-4" />
                )}
                <span>{t("cart.continueShopping")}</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Order Summary Card (4 Columns) */}
          <div className="lg:col-span-4">
            <CartSummaryCard summary={summary} />
          </div>
        </div>
      </Container>
    </div>
  );
}
