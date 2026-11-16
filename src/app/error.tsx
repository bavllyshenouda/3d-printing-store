"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { RotateCcw, Home, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { useTranslation } from "@/lib/i18n/context";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    console.error("Application error boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-16 px-4 bg-background">
      <Container size="default" className="text-center max-w-lg space-y-6">
        <div className="inline-flex items-center justify-center size-20 rounded-3xl bg-red-500/10 text-red-500 border border-red-500/20 shadow-xs">
          <AlertTriangle className="size-9" />
        </div>
        <div className="space-y-2">
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {t("errorPage.title")}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {t("errorPage.description")}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <Button
            variant="default"
            size="default"
            onClick={() => reset()}
            className="flex items-center gap-2"
          >
            <RotateCcw className="size-4" />
            <span>{t("errorPage.retry")}</span>
          </Button>
          <Button variant="outline" size="default" asChild>
            <Link href="/" className="flex items-center gap-2">
              <Home className="size-4" />
              <span>{t("notFound.backHome")}</span>
            </Link>
          </Button>
        </div>
      </Container>
    </div>
  );
}

