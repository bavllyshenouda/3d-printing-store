"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Layers, Box, UploadCloud, ShieldCheck } from "lucide-react";
import { ProductCard } from "@/components/ui/product-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { Container } from "@/components/layout/container";
import { Grid } from "@/components/layout/grid";
import { toast } from "@/components/ui/toast";
import { HomepageProduct } from "@/lib/data/homepage";

export interface FeaturedProductsProps {
  products: HomepageProduct[];
}

export function FeaturedProducts({ products }: FeaturedProductsProps) {
  const [selectedProduct, setSelectedProduct] = useState<HomepageProduct | null>(null);

  const handleAddToCart = (productId: string, color?: string) => {
    const item = products.find((p) => p.id === productId);
    toast.success(
      "Added to Cart",
      `${item?.name || "Product"} (${color || "Standard"}) has been added to your shopping cart.`
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
              Studio Showcase
            </Badge>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Featured 3D Printed Models
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-1 max-w-xl">
              Precision-tested mechanical parts, functional desk gear, and calibrated components ready for dispatch.
            </p>
          </div>

          <Button variant="outline" size="sm" asChild className="self-start md:self-auto">
            <Link href="/products" className="flex items-center gap-1.5">
              <span>View Full Catalog</span>
              <ArrowRight className="size-4" />
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
                  currency="EGP"
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
            title="Catalog Refreshing"
            description="Our print farm is currently slicing new production batches. You can upload a custom 3D model for immediate quotation."
            action={
              <Button variant="default" size="sm" asChild>
                <Link href="/custom-prints" className="flex items-center gap-1.5">
                  <UploadCloud className="size-4" />
                  <span>Request Custom Print</span>
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
          description={`Category: ${selectedProduct.category?.name || "Functional Print"} · Material: ${selectedProduct.material || "PETG"}`}
          maxWidth="xl"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setSelectedProduct(null)}>
                Close
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  handleAddToCart(selectedProduct.id);
                  setSelectedProduct(null);
                }}
              >
                Add to Cart ({Number(selectedProduct.price).toLocaleString()} EGP)
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
                <span className="text-muted-foreground block text-[10px]">Material</span>
                <span className="font-bold text-foreground">
                  {selectedProduct.material || "PLA+"}
                </span>
              </div>
              <div className="rounded-xl border border-border p-3 bg-muted/20">
                <span className="text-muted-foreground block text-[10px]">Stock Status</span>
                <span className="font-bold text-emerald-500">
                  {selectedProduct.stock > 0 ? `${selectedProduct.stock} in stock` : "On Demand"}
                </span>
              </div>
              <div className="rounded-xl border border-border p-3 bg-muted/20">
                <span className="text-muted-foreground block text-[10px]">Price</span>
                <span className="font-bold text-[#FF6B35]">
                  {Number(selectedProduct.price).toLocaleString()} EGP
                </span>
              </div>
              <div className="rounded-xl border border-border p-3 bg-muted/20">
                <span className="text-muted-foreground block text-[10px]">Tolerance</span>
                <span className="font-bold text-foreground">±0.08 mm</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-4 text-[#FF6B35]" />
              <span>Full dimensional accuracy and satisfaction guarantee included.</span>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}

