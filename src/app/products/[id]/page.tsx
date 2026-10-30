import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Box, ArrowLeft, ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ProductGallery,
  ProductInfo,
  ProductSpecs,
  ProductCustomCta,
  ProductRelated,
} from "@/components/product";
import { getProductDetail, getRelatedProducts } from "@/lib/data/product-detail";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductDetail(id);

  if (!product) {
    return {
      title: "Product Not Found | PrintStudio",
      description: "The requested 3D model could not be found.",
    };
  }

  const primaryImage =
    product.images?.find((img) => img.is_primary)?.image_url ||
    product.images?.[0]?.image_url;

  return {
    title: `${product.name} | PrintStudio 3D`,
    description:
      product.description ||
      `Precision 3D printed ${product.name} in ${product.material || "high-grade polymer"} by PrintStudio.`,
    openGraph: {
      title: `${product.name} | PrintStudio 3D`,
      description:
        product.description ||
        `Precision 3D printed ${product.name} in ${product.material || "high-grade polymer"} by PrintStudio.`,
      images: primaryImage ? [{ url: primaryImage }] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { id } = await params;

  // 1. Fetch Authoritative Product Data
  const product = await getProductDetail(id);

  if (!product) {
    return (
      <div className="py-24 bg-background min-h-[60vh] flex items-center">
        <Container size="sm">
          <EmptyState
            icon={<Box className="size-8 text-[#FF6B35]" />}
            title="Product Not Found"
            description="The 3D model you are looking for does not exist or has been retired from the catalog."
            action={
              <Link href="/shop">
                <Button variant="default" size="default">
                  Back to Catalog
                </Button>
              </Link>
            }
          />
        </Container>
      </div>
    );
  }

  // 2. Fetch Related Products using Real Catalog Data
  const relatedProducts = await getRelatedProducts(
    product.id,
    product.category_id,
    4
  );

  return (
    <div className="bg-background min-h-screen py-8 sm:py-12">
      <Container size="xl">
        {/* Main 2-Column Product Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          {/* Left Column: Interactive Image Gallery */}
          <div className="lg:col-span-7 sticky top-24">
            <ProductGallery
              images={product.images}
              productName={product.name}
              material={product.material}
              isFeatured={product.is_featured}
              stock={product.stock}
            />
          </div>

          {/* Right Column: Information, Pricing, Swatches & Add-to-Cart */}
          <div className="lg:col-span-5">
            <ProductInfo product={product} />
          </div>
        </div>

        {/* Technical Engineering Specifications */}
        <ProductSpecs product={product} className="mt-16" />

        {/* Customization Upsell Banner */}
        <ProductCustomCta />

        {/* Related Products Grid */}
        <ProductRelated products={relatedProducts} className="mt-6" />
      </Container>
    </div>
  );
}

