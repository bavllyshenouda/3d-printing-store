"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Container } from "@/components/layout/container";

export function ProductSkeleton() {
  return (
    <div className="py-8 sm:py-12 bg-background">
      <Container size="xl">
        {/* Main 2-column Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Gallery Skeleton */}
          <div className="lg:col-span-7 space-y-4">
            <Skeleton className="aspect-square w-full rounded-2xl" />
            <div className="flex gap-3">
              <Skeleton className="size-20 rounded-xl" />
              <Skeleton className="size-20 rounded-xl" />
              <Skeleton className="size-20 rounded-xl" />
            </div>
          </div>

          {/* Info Skeleton */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-20 rounded-md" />
              <Skeleton className="h-4 w-4 rounded-md" />
              <Skeleton className="h-4 w-24 rounded-md" />
            </div>

            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton className="h-10 w-4/5 rounded-xl" />
            <Skeleton className="h-6 w-36 rounded-full" />

            <div className="p-4 rounded-2xl border border-border/60 bg-muted/20 space-y-2">
              <Skeleton className="h-3 w-12 rounded-sm" />
              <Skeleton className="h-8 w-32 rounded-lg" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-5/6 rounded-md" />
              <Skeleton className="h-4 w-2/3 rounded-md" />
            </div>

            <div className="space-y-3 pt-2">
              <Skeleton className="h-4 w-24 rounded-sm" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-20 rounded-xl" />
                <Skeleton className="h-9 w-20 rounded-xl" />
                <Skeleton className="h-9 w-20 rounded-xl" />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Skeleton className="h-12 w-28 rounded-xl" />
              <Skeleton className="h-12 flex-1 rounded-xl" />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4">
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

