"use client";

import React from "react";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

export interface DimensionIndicatorsProps {
  width?: number | null;
  height?: number | null;
  unit?: string;
  className?: string;
  variant?: "card" | "detail";
}

/**
 * Clean, architectural dimension indicators overlay for product images.
 * Displays vertical height along the side and horizontal width along the bottom.
 * Hidden automatically if dimensions are empty or null.
 */
export function DimensionIndicators({
  width,
  height,
  unit,
  className,
  variant = "card",
}: DimensionIndicatorsProps) {
  const { locale } = useTranslation();
  const displayUnit = unit || (locale === "ar" ? "سم" : "cm");

  const hasWidth = width !== null && width !== undefined && Number(width) > 0;
  const hasHeight = height !== null && height !== undefined && Number(height) > 0;

  if (!hasWidth && !hasHeight) {
    return null;
  }

  return (
    <div
      className={cn(
        "absolute inset-0 pointer-events-none select-none z-10",
        className
      )}
      aria-hidden="true"
    >
      {/* 1. Vertical Height Indicator (Right Side) */}
      {hasHeight && (
        <div
          className={cn(
            "absolute end-2 sm:end-2.5 flex flex-col items-center justify-between",
            variant === "card"
              ? "top-12 bottom-10"
              : "top-16 bottom-14"
          )}
        >
          {/* Top arrow tick */}
          <div className="w-2.5 h-[1.5px] bg-white/70 shadow-xs rounded-full" />
          {/* Vertical line top */}
          <div className="w-[1.5px] flex-1 bg-gradient-to-b from-white/70 via-white/40 to-white/10" />

          {/* Height Pill Badge */}
          <div className="my-1 px-1.5 py-0.5 rounded-full bg-black/75 backdrop-blur-md border border-white/25 text-white shadow-md flex items-center justify-center">
            <span className="font-mono font-bold tracking-tight text-[10px] sm:text-[11px] leading-none whitespace-nowrap">
              {height} {displayUnit}
            </span>
          </div>

          {/* Vertical line bottom */}
          <div className="w-[1.5px] flex-1 bg-gradient-to-t from-white/70 via-white/40 to-white/10" />
          {/* Bottom arrow tick */}
          <div className="w-2.5 h-[1.5px] bg-white/70 shadow-xs rounded-full" />
        </div>
      )}

      {/* 2. Horizontal Width Indicator (Bottom Edge) */}
      {hasWidth && (
        <div
          className={cn(
            "absolute flex items-center justify-between transition-opacity duration-200",
            variant === "card"
              ? "bottom-2 sm:bottom-2.5 start-6 end-6 group-hover:opacity-0 sm:group-hover:opacity-0"
              : "bottom-3 start-8 end-8"
          )}
        >
          {/* Left arrow tick */}
          <div className="h-2.5 w-[1.5px] bg-white/70 shadow-xs rounded-full" />
          {/* Horizontal line left */}
          <div className="h-[1.5px] flex-1 bg-gradient-to-r from-white/70 via-white/40 to-white/10" />

          {/* Width Pill Badge */}
          <div className="mx-1.5 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md border border-white/25 text-white shadow-md flex items-center justify-center">
            <span className="font-mono font-bold tracking-tight text-[10px] sm:text-[11px] leading-none whitespace-nowrap">
              {width} {displayUnit}
            </span>
          </div>

          {/* Horizontal line right */}
          <div className="h-[1.5px] flex-1 bg-gradient-to-l from-white/70 via-white/40 to-white/10" />
          {/* Right arrow tick */}
          <div className="h-2.5 w-[1.5px] bg-white/70 shadow-xs rounded-full" />
        </div>
      )}
    </div>
  );
}

