"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  Layers,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { ProductDetailImage } from "@/lib/data/product-detail";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

export interface ProductGalleryProps {
  images: ProductDetailImage[];
  productName: string;
  material?: string | null;
  isFeatured?: boolean;
  stock: number;
  className?: string;
}

export function ProductGallery({
  images,
  productName,
  material,
  isFeatured,
  stock,
  className,
}: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const { t, isRTL } = useTranslation();

  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock <= 3;

  const validImages =
    images && images.length > 0
      ? images
      : [
          {
            id: "fallback",
            image_url: "",
            alt_text: productName,
            is_primary: true,
            sort_order: 0,
          },
        ];

  const currentImage = validImages[activeIndex] || validImages[0];

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : validImages.length - 1));
  }, [validImages.length]);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev < validImages.length - 1 ? prev + 1 : 0));
  }, [validImages.length]);

  // Keyboard navigation for gallery
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (validImages.length <= 1) return;
      if (e.key === "ArrowLeft") {
        isRTL ? handleNext() : handlePrev();
      } else if (e.key === "ArrowRight") {
        isRTL ? handlePrev() : handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev, isRTL, validImages.length]);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* 1. Main Viewport Showcase */}
      <div className="group relative aspect-square w-full rounded-2xl border border-border/80 bg-muted/20 overflow-hidden shadow-xs select-none">
        {/* Badges Overlay */}
        <div className="absolute top-4 start-4 z-10 flex flex-col items-start gap-2 pointer-events-none">
          {isFeatured && (
            <Badge variant="electric" size="sm" className="shadow-xs">
              <Sparkles className="size-3 me-1" />
              <span>{t("featured.badge")}</span>
            </Badge>
          )}

          {material && (
            <Badge variant="charcoal" size="sm" className="shadow-xs">
              <Layers className="size-3 me-1 text-[#FF6B35]" />
              <span>{material}</span>
            </Badge>
          )}

          {isOutOfStock ? (
            <Badge variant="destructive" size="sm" dot>
              {t("common.soldOut")}
            </Badge>
          ) : isLowStock ? (
            <Badge variant="warning" size="sm" dot pulse>
              {t("common.lowStock", { count: stock })}
            </Badge>
          ) : (
            <Badge variant="success" size="sm" dot>
              {t("common.inStock")}
            </Badge>
          )}
        </div>

        {/* Zoom Button */}
        {currentImage.image_url && (
          <button
            type="button"
            onClick={() => setIsZoomOpen(true)}
            className="absolute top-4 end-4 z-10 flex size-9 items-center justify-center rounded-xl bg-white/80 dark:bg-[#111318]/80 text-foreground backdrop-blur-md transition-all hover:bg-white dark:hover:bg-[#111318] hover:scale-105 active:scale-95 shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
            aria-label={t("product.enlargeImage")}
          >
            <Maximize2 className="size-4" />
          </button>
        )}

        {/* Main Image */}
        {currentImage.image_url ? (
          <div
            className="relative h-full w-full cursor-zoom-in transition-transform duration-500 hover:scale-105"
            onClick={() => setIsZoomOpen(true)}
          >
            <Image
              src={currentImage.image_url}
              alt={currentImage.alt_text || productName}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
              className="object-cover object-center transition-opacity duration-300"
            />
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center text-muted-foreground bg-muted/40 font-mono text-xs">
            <Layers className="size-10 mb-2 opacity-40 text-[#FF6B35]" />
            <span>[No High-Resolution Image Available]</span>
          </div>
        )}

        {/* Prev & Next Floating Arrow Triggers */}
        {validImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute start-3 top-1/2 -translate-y-1/2 z-10 flex size-9 items-center justify-center rounded-full bg-white/90 dark:bg-[#111318]/90 text-foreground backdrop-blur-md shadow-sm transition-all hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100 focus:opacity-100"
              aria-label={t("product.prevImage")}
            >
              {isRTL ? (
                <ChevronRight className="size-4" />
              ) : (
                <ChevronLeft className="size-4" />
              )}
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute end-3 top-1/2 -translate-y-1/2 z-10 flex size-9 items-center justify-center rounded-full bg-white/90 dark:bg-[#111318]/90 text-foreground backdrop-blur-md shadow-sm transition-all hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100 focus:opacity-100"
              aria-label={t("product.nextImage")}
            >
              {isRTL ? (
                <ChevronLeft className="size-4" />
              ) : (
                <ChevronRight className="size-4" />
              )}
            </button>

            {/* Bottom Image Counter Pill */}
            <div className="absolute bottom-3 end-3 z-10 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-mono pointer-events-none">
              {t("product.imageOf", {
                current: activeIndex + 1,
                total: validImages.length,
              })}
            </div>
          </>
        )}
      </div>

      {/* 2. Thumbnail Navigation Strip */}
      {validImages.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
          {validImages.map((img, idx) => {
            const isSelected = idx === activeIndex;
            return (
              <button
                key={img.id || idx}
                type="button"
                onClick={() => setActiveIndex(idx)}
                aria-label={`Thumbnail ${idx + 1}`}
                className={cn(
                  "relative size-18 sm:size-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-200 outline-none",
                  isSelected
                    ? "border-[#FF6B35] ring-2 ring-[#FF6B35]/20 scale-105 shadow-sm"
                    : "border-border/60 hover:border-border opacity-70 hover:opacity-100"
                )}
              >
                {img.image_url ? (
                  <Image
                    src={img.image_url}
                    alt={img.alt_text || `${productName} thumbnail ${idx + 1}`}
                    fill
                    sizes="80px"
                    className="object-cover object-center"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-muted text-[10px] text-muted-foreground font-mono">
                    #{idx + 1}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* 3. High-Resolution Zoom Lightbox Modal */}
      {isZoomOpen && currentImage.image_url && (
        <Modal
          open={isZoomOpen}
          onClose={() => setIsZoomOpen(false)}
          title={productName}
          maxWidth="4xl"
        >
          <div className="relative aspect-square sm:aspect-4/3 w-full max-h-[75vh] rounded-xl overflow-hidden bg-black/5 dark:bg-black/40">
            <Image
              src={currentImage.image_url}
              alt={currentImage.alt_text || productName}
              fill
              sizes="90vw"
              className="object-contain"
            />
          </div>
        </Modal>
      )}
    </div>
  );
}

