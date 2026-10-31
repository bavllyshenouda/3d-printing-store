"use client";

import React from "react";
import { Globe } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export interface LanguageSwitcherProps {
  className?: string;
  variant?: "pill" | "dropdown" | "mobile" | "icon";
}

export function LanguageSwitcher({
  className,
  variant = "pill",
}: LanguageSwitcherProps) {
  const { locale, setLocale } = useTranslation();

  const handleToggle = () => {
    const next: Locale = locale === "en" ? "ar" : "en";
    setLocale(next);
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          "flex size-8 sm:size-9 items-center justify-center rounded-xl border border-border/80 bg-background/80 text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35]",
          className
        )}
        title={locale === "en" ? "التبديل إلى العربية" : "Switch to English"}
        aria-label={
          locale === "en" ? "Switch language to Arabic" : "تغيير اللغة إلى الإنجليزية"
        }
      >
        <Globe className="size-4" />
      </button>
    );
  }

  if (variant === "mobile") {
    return (
      <div
        className={cn(
          "flex items-center justify-between rounded-xl border border-border/80 bg-muted/40 p-3",
          className
        )}
      >
        <div className="flex items-center gap-2.5 text-sm font-medium">
          <Globe className="size-4 text-[#FF6B35]" />
          <span>{locale === "en" ? "Language (English)" : "اللغة (العربية)"}</span>
        </div>

        <div className="flex items-center gap-1 bg-background/80 p-1 rounded-lg border border-border/60">
          <button
            type="button"
            onClick={() => setLocale("en")}
            className={cn(
              "px-2.5 py-1 text-xs font-semibold rounded-md transition-all",
              locale === "en"
                ? "bg-[#FF6B35] text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label="Switch to English"
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLocale("ar")}
            className={cn(
              "px-2.5 py-1 text-xs font-semibold rounded-md transition-all font-sans",
              locale === "ar"
                ? "bg-[#FF6B35] text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label="التبديل إلى العربية"
          >
            عربي
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={cn(
        "group relative inline-flex items-center gap-1.5 h-9 px-2.5 rounded-xl border border-border/80 bg-background/80 hover:bg-muted/80 text-foreground text-xs font-medium backdrop-blur-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35]",
        className
      )}
      title={locale === "en" ? "التبديل إلى العربية" : "Switch to English"}
      aria-label={locale === "en" ? "Switch language to Arabic" : "تغيير اللغة إلى الإنجليزية"}
    >
      <Globe className="size-3.5 text-muted-foreground group-hover:text-[#FF6B35] transition-colors" />
      <span className="font-semibold uppercase tracking-wider">
        {locale === "en" ? "العربية" : "EN"}
      </span>
    </button>
  );
}

