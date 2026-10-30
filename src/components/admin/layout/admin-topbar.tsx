"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  User,
  LogOut,
  Store,
  Activity,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useTranslation } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import { cn } from "@/lib/utils";

interface AdminTopbarProps {
  onOpenMobileMenu: () => void;
}

export function AdminTopbar({ onOpenMobileMenu }: AdminTopbarProps) {
  const pathname = usePathname();
  const { t, isRTL } = useTranslation();
  const { user, profile, logout } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Generate dynamic breadcrumbs
  const pathSegments = pathname.split("/").filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const url = "/" + pathSegments.slice(0, index + 1).join("/");
    let label = segment;

    if (segment === "admin") {
      label = t("admin.dashboard");
    } else if (segment === "orders") {
      label = t("admin.orders");
    } else if (segment === "payments") {
      label = t("admin.payments");
    } else if (segment === "custom-prints") {
      label = t("admin.customPrints");
    } else if (segment === "products") {
      label = t("admin.products");
    } else if (segment === "categories") {
      label = t("admin.categories");
    } else if (segment === "customers") {
      label = t("admin.customers");
    } else if (segment === "whatsapp") {
      label = t("admin.whatsapp");
    } else if (segment.length > 20) {
      label = "#" + segment.slice(0, 8);
    }

    return {
      label,
      url,
      isLast: index === pathSegments.length - 1,
    };
  });

  const displayName = profile?.first_name
    ? `${profile.first_name} ${profile.last_name || ""}`.trim()
    : user?.email?.split("@")[0] || t("admin.adminUser");

  const initial = displayName.charAt(0).toUpperCase();

  const SeparatorIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <header className="h-16 border-b border-border bg-card/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left side: Hamburger (mobile) + Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted md:hidden shrink-0"
          aria-label="Open mobile menu"
        >
          <Menu className="size-5" />
        </button>

        {/* Dynamic Breadcrumbs */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs text-muted-foreground overflow-x-auto no-scrollbar py-1"
        >
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.url}>
              {idx > 0 && <SeparatorIcon className="size-3 text-muted-foreground/60 shrink-0" />}
              {crumb.isLast ? (
                <span className="font-semibold text-foreground truncate max-w-[150px] sm:max-w-[240px]">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.url}
                  className="hover:text-foreground transition-colors shrink-0"
                >
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right side: Studio Status + Language + Theme + Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Operational Status Pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-mono">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium">{t("admin.metrics.operational")}</span>
        </div>

        {/* Theme and Language switchers */}
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>

        {/* Admin Profile Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-muted text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35]"
            aria-expanded={profileDropdownOpen}
          >
            <div className="size-8 rounded-lg bg-[#FF6B35] text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {initial}
            </div>
            <div className="hidden sm:flex flex-col text-start">
              <span className="text-xs font-bold leading-tight truncate max-w-[120px]">
                {displayName}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                Admin
              </span>
            </div>
          </button>

          {profileDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setProfileDropdownOpen(false)}
                aria-hidden="true"
              />
              <div
                className={cn(
                  "absolute top-full mt-2 w-56 rounded-2xl border border-border bg-card p-2 shadow-xl z-50 animate-in fade-in zoom-in-95",
                  isRTL ? "left-0" : "right-0"
                )}
              >
                <div className="px-3 py-2 border-b border-border/60 mb-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground truncate">
                    <ShieldCheck className="size-3.5 text-[#FF6B35]" />
                    <span>{displayName}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>

                <Link
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <Store className="size-4 text-emerald-500" />
                  <span>{t("admin.backToStore")}</span>
                </Link>

                <div className="pt-1 mt-1 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      logout();
                    }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-medium text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="size-4" />
                    <span>{t("admin.logout")}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

