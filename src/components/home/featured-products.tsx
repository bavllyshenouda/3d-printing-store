"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Box, UploadCloud, ShieldCheck } from "lucide-react";
import { ProductCard } from "@/components/ui/product-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { Container } from "@/components/layout/container";
import { Grid } from "@/components/layout/grid";
import { toast } from "@/components/ui/toast";
import { HomepageProduct } from "@/lib/data/homepage";
import { useTranslation } from "@/lib/i18n/context";

export interface FeaturedProductsProps {
  products: HomepageProduct[];
}

export function FeaturedProducts({ products }: FeaturedProductsProps) {
  const [selectedProduct, setSelectedProduct] = useState<HomepageProduct | null>(null);
  const { t } = useTranslation();

  const handleAddToCart = (productId: string, color?: string) => {
    const item = products.find((p) => p.id === productId);
    toast.success(
      t("featured.addedToastTitle"),
      t("featured.addedToastDesc", {
        name: item?.name || "Product",
        color: color || "Standard",
      })
    );
  };

  const handleQuickView = (productId: string) => {
    const item = products.find((p) => p.id === productId);
    if (item) {
      setSelectedProduct(item);
    }
  };

  return (
    <section className="py-16 sm:py-24 border-b border-border/60">
      <Container size="xl">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <Badge variant="electric" size="sm" className="mb-2">
              {t("featured.badge")}
            </Badge>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              {t("featured.title")}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-1 max-w-xl">
              {t("featured.description")}
            </p>
          </div>

          <Button variant="outline" size="sm" asChild className="self-start md:self-auto">
            <Link href="/products" className="flex items-center gap-1.5">
              <span>{t("featured.viewAll")}</span>
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Link>
          </Button>
        </div>

        {/* Product Grid or Empty State */}
        {products && products.length > 0 ? (
          <Grid cols={3} gap="default">
            {products.map((product) => {
              const primaryImg =
                product.images?.find((img) => img.is_primary)?.image_url ||
                product.images?.[0]?.image_url ||
                null;

              const secondaryImg =
                product.images?.find((img) => !img.is_primary)?.image_url ||
                null;

              return (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  slug={product.slug}
                  name={product.name}
                  price={Number(product.price)}
                  currency={t("common.egp")}
                  primaryImageUrl={primaryImg}
                  secondaryImageUrl={secondaryImg}
                  material={product.material || "PLA+"}
                  stockQuantity={product.stock ?? 10}
                  availableColors={product.available_colors || ["Black", "Orange", "Silver"]}
                  categoryName={product.category?.name || "General Print"}
                  isFeatured={product.is_featured}
                  onAddToCart={handleAddToCart}
                  onQuickView={handleQuickView}
                />
              );
            })}
          </Grid>
        ) : (
          <EmptyState
            icon={<Box className="size-8 text-[#FF6B35]" />}
            title={t("featured.emptyTitle")}
            description={t("featured.emptyDesc")}
            action={
              <Button variant="default" size="sm" asChild>
                <Link href="/custom-prints" className="flex items-center gap-1.5">
                  <UploadCloud className="size-4" />
                  <span>{t("featured.emptyCta")}</span>
                </Link>
              </Button>
            }
          />
        )}
      </Container>

      {/* Quick View Modal */}
      {selectedProduct && (
        <Modal
          open={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          title={selectedProduct.name}
          description={`${t("featured.modalCategory")}: ${selectedProduct.category?.name || "Functional Print"} · ${t("featured.modalMaterial")}: ${selectedProduct.material || "PETG"}`}
          maxWidth="xl"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setSelectedProduct(null)}>
                {t("common.close")}
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  handleAddToCart(selectedProduct.id);
                  setSelectedProduct(null);
                }}
              >
                {t("common.addToCart")} ({Number(selectedProduct.price).toLocaleString()} {t("common.egp")})
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {selectedProduct.description ||
                "Engineered with industrial dimensional tolerances. Calibrated for high mechanical durability and precision layer adhesion."}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs font-mono">
              <div className="rounded-xl border border-border p-3 bg-muted/20">
                <span className="text-muted-foreground block text-[10px]">{t("featured.modalMaterial")}</span>
                <span className="font-bold text-foreground">
                  {selectedProduct.material || "PLA+"}
                </span>
              </div>
              <div className="rounded-xl border border-border p-3 bg-muted/20">
                <span className="text-muted-foreground block text-[10px]">{t("featured.modalStockStatus")}</span>
                <span className="font-bold text-emerald-500">
                  {selectedProduct.stock > 0 ? `${selectedProduct.stock} ${t("common.inStock")}` : t("common.onDemand")}
                </span>
              </div>
              <div className="rounded-xl border border-border p-3 bg-muted/20">
                <span className="text-muted-foreground block text-[10px]">{t("featured.modalPrice")}</span>
                <span className="font-bold text-[#FF6B35]">
                  {Number(selectedProduct.price).toLocaleString()} {t("common.egp")}
                </span>
              </div>
              <div className="rounded-xl border border-border p-3 bg-muted/20">
                <span className="text-muted-foreground block text-[10px]">{t("featured.modalTolerance")}</span>
                <span className="font-bold text-foreground">±0.08 mm</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-4 text-[#FF6B35] shrink-0" />
              <span>{t("featured.modalGuarantee")}</span>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}
