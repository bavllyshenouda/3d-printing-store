"use client";

import React from "react";
import { Sun, Moon, Laptop } from "lucide-react";
import { useTheme } from "@/lib/theme/context";
import { useTranslation } from "@/lib/i18n/context";
import { Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export interface ThemeToggleProps {
  className?: string;
  variant?: "icon" | "segmented" | "mobile";
}

export function ThemeToggle({
  className,
  variant = "icon",
}: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme, isMounted } = useTheme();
  const { t, locale } = useTranslation();

  if (variant === "mobile") {
    return (
      <div
        className={cn(
          "flex items-center justify-between rounded-xl border border-border/80 bg-muted/40 p-3",
          className
        )}
      >
        <div className="flex items-center gap-2.5 text-sm font-medium">
          {resolvedTheme === "dark" ? (
            <Moon className="size-4 text-[#FF6B35]" />
          ) : (
            <Sun className="size-4 text-[#FF6B35]" />
          )}
          <span>{t("nav.theme")}</span>
        </div>

        <div className="flex items-center gap-1 bg-background/80 p-1 rounded-lg border border-border/60">
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-all",
              theme === "light"
                ? "bg-[#FF6B35] text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            title={t("nav.light")}
            aria-label={t("nav.light")}
          >
            <Sun className="size-3.5" />
            <span className="hidden sm:inline">{t("nav.light")}</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-all",
              theme === "dark"
                ? "bg-[#FF6B35] text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            title={t("nav.dark")}
            aria-label={t("nav.dark")}
          >
            <Moon className="size-3.5" />
            <span className="hidden sm:inline">{t("nav.dark")}</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme("system")}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-all",
              theme === "system"
                ? "bg-[#FF6B35] text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            title={t("nav.system")}
            aria-label={t("nav.system")}
          >
            <Laptop className="size-3.5" />
            <span className="hidden sm:inline">{t("nav.system")}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "group relative flex size-8 sm:size-9 items-center justify-center rounded-xl border border-border/80 bg-background/80 hover:bg-muted/80 text-foreground backdrop-blur-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35]",
        className
      )}
      title={
        isMounted
          ? resolvedTheme === "dark"
            ? locale === "ar"
              ? "التبديل إلى الوضع الفاتح"
              : "Switch to Light Mode"
            : locale === "ar"
            ? "التبديل إلى الوضع الداكن"
            : "Switch to Dark Mode"
          : t("nav.theme")
      }
      aria-label={
        isMounted
          ? resolvedTheme === "dark"
            ? t("nav.themeToggleToLight")
            : t("nav.themeToggleToDark")
          : t("nav.toggleTheme")
      }
    >
      <div className="relative size-4">
        {/* Sun Icon */}
        <Sun
          className={cn(
            "absolute inset-0 size-4 text-[#FF6B35] transition-all duration-300",
            !isMounted || resolvedTheme === "dark"
              ? "rotate-90 scale-0 opacity-0"
              : "rotate-0 scale-100 opacity-100"
          )}
        />
        {/* Moon Icon */}
        <Moon
          className={cn(
            "absolute inset-0 size-4 text-[#FF6B35] transition-all duration-300",
            !isMounted || resolvedTheme === "light"
              ? "-rotate-90 scale-0 opacity-0"
              : "rotate-0 scale-100 opacity-100"
          )}
        />
      </div>
    </button>
  );
}

