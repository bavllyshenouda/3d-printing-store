"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingBag,
  Search,
  Menu,
  X,
  Layers,
  ArrowRight,
  User,
  Box,
  LogOut,
  ChevronDown,
  MapPin,
  UploadCloud,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/layout/container";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useTranslation } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import { useCart } from "@/lib/cart/context";
import { cn } from "@/lib/utils";

export interface NavbarProps {
  cartCount?: number;
  user?: { email?: string; name?: string } | null;
  onCartClick?: () => void;
  onSearchClick?: () => void;
}

export function Navbar({
  cartCount: propCartCount = 0,
  user: propUser = null,
  onCartClick,
  onSearchClick,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(propCartCount);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const { t, isRTL } = useTranslation();
  const { user: authUser, profile, logout, isAuthenticated, isAdmin } = useAuth();
  const { summary, openDrawer } = useCart();

  const currentUser = authUser || propUser;
  const activeCartCount = summary.total_items > 0 ? summary.total_items : (cartCount || propCartCount);
  const userDisplayName =
    profile?.first_name
      ? `${profile.first_name} ${profile.last_name || ""}`.trim()
      : currentUser?.email?.split("@")[0] || t("common.profile");
  const userInitial =
    profile?.first_name
      ? profile.first_name[0].toUpperCase()
      : currentUser?.email
      ? currentUser.email[0].toUpperCase()
      : "U";

  // Synchronize cart count from prop
  useEffect(() => {
    setCartCount(propCartCount);
  }, [propCartCount]);

  // Listen to cart-updated events and fetch live count
  useEffect(() => {
    const fetchCartCount = async () => {
      try {
        const res = await fetch("/api/cart");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data?.cart) {
            setCartCount(json.data.cart.total_items || 0);
          }
        }
      } catch {
        // Silently ignore if unauthenticated or network error
      }
    };

    fetchCartCount();

    const handleCartUpdated = () => {
      fetchCartCount();
    };

    window.addEventListener("cart-updated", handleCartUpdated);
    return () => window.removeEventListener("cart-updated", handleCartUpdated);
  }, []);

  const navItems = [
    { label: t("nav.catalog"), href: "/products" },
    {
      label: t("nav.customPrint"),
      href: "/custom-prints",
      badge: t("common.instantQuote"),
    },
    { label: t("nav.materials"), href: "/materials" },
    { label: t("nav.trackOrder"), href: "/orders" },
    { label: t("nav.studio"), href: "/about" },
  ];

  // Scroll detection for enhanced shadow / blur
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is active
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Close mobile menu on escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    },
    [mobileMenuOpen]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Close mobile menu on route change
  useEffect(() => {
    const timer = setTimeout(() => {
      setMobileMenuOpen(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 w-full">
      {/* Top Studio Status Ticker */}
      <div className="bg-[#111318] text-white py-1.5 px-4 text-xs font-mono border-b border-white/5 overflow-hidden">
        <Container size="xl" className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-gray-300 truncate">
              {t("nav.tickerStatus")}
            </span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-gray-400 text-[11px] shrink-0">
            <span>{t("nav.tickerDelivery")}</span>
            <span>•</span>
            <Link
              href="/custom-prints"
              className="text-[#FF6B35] hover:underline flex items-center gap-1"
            >
              <span>{t("nav.tickerUploadCta")}</span>
              <ArrowRight className="size-3 rtl:rotate-180" />
            </Link>
          </div>
        </Container>
      </div>

      {/* Main Navigation Bar */}
      <nav
        className={cn(
          "w-full border-b transition-all duration-300 bg-background/90 dark:bg-[#111318]/90 backdrop-blur-md",
          isScrolled
            ? "border-border/80 shadow-soft py-2.5"
            : "border-border/50 py-3.5"
        )}
      >
        <Container size="xl" className="flex items-center justify-between gap-3">
          {/* Logo Branding */}
          <Link
            href="/"
            className="group flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] rounded-lg shrink-0"
          >
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#111318] dark:bg-white/10 text-white shadow-sm transition-transform duration-300 group-hover:scale-105 border border-white/10">
              <Layers className="size-5 text-[#FF6B35]" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-lg font-black tracking-tight text-foreground leading-none">
                PRINT<span className="text-[#FF6B35]">STUDIO</span>
              </span>
              <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
                {t("common.brandTagline")}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35]",
                    isActive
                      ? "text-foreground font-semibold bg-muted/60"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  )}
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <Badge variant="electric" size="sm" className="py-0 px-1.5 text-[10px]">
                      {item.badge}
                    </Badge>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 inset-x-3 h-0.5 bg-[#FF6B35] rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Action Icons & Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Language Switcher */}
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Search Trigger */}
            {onSearchClick ? (
              <button
                onClick={onSearchClick}
                className="flex size-9 items-center justify-center rounded-xl border border-border/80 bg-background/80 hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-[#FF6B35]"
                aria-label={t("nav.searchCatalogAria")}
              >
                <Search className="size-4" />
              </button>
            ) : (
              <Link
                href="/shop"
                className="flex size-9 items-center justify-center rounded-xl border border-border/80 bg-background/80 hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-[#FF6B35]"
                aria-label={t("nav.searchCatalogAria")}
              >
                <Search className="size-4" />
              </Link>
            )}

            {/* Cart Trigger */}
            <button
              onClick={onCartClick || openDrawer}
              className="relative flex size-9 items-center justify-center rounded-xl border border-border/80 bg-background/80 hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-[#FF6B35]"
              aria-label={t("nav.cartAria", { count: activeCartCount })}
            >
              <ShoppingBag className="size-4" />
              {activeCartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-[#FF6B35] text-[10px] font-bold text-white shadow-sm transition-transform duration-300 scale-100">
                  {activeCartCount}
                </span>
              )}
            </button>

            {/* User Account / Profile Dropdown */}
            {isAuthenticated ? (
              <div className="relative hidden sm:block">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 h-9 px-2.5 rounded-xl border border-border/80 bg-background/80 hover:bg-muted/80 text-foreground transition-all focus-visible:ring-2 focus-visible:ring-[#FF6B35]"
                  aria-expanded={userMenuOpen}
                  aria-label={t("nav.accountAria")}
                >
                  <span className="flex size-5 items-center justify-center rounded-md bg-[#FF6B35]/15 text-[11px] font-bold text-[#FF6B35]">
                    {userInitial}
                  </span>
                  <span className="text-xs font-semibold max-w-[90px] truncate">
                    {userDisplayName}
                  </span>
                  <ChevronDown className="size-3 text-muted-foreground" />
                </button>

                {/* Floating User Menu */}
                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                      aria-hidden="true"
                    />
                    <div className="absolute end-0 mt-2 w-56 rounded-2xl border border-border/80 bg-card p-2 shadow-xl z-50 animate-in fade-in zoom-in-95">
                      <div className="px-3 py-2 border-b border-border/50 mb-1">
                        <p className="text-xs font-bold text-foreground truncate">
                          {userDisplayName}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {currentUser?.email}
                        </p>
                      </div>

                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#FF6B35] bg-[#FF6B35]/10 hover:bg-[#FF6B35]/20 transition-colors mb-1"
                        >
                          <ShieldCheck className="size-4 text-[#FF6B35]" />
                          <span>{t("admin.adminDashboard")}</span>
                        </Link>
                      )}

                      <Link
                        href="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-muted transition-colors"
                      >
                        <User className="size-4 text-[#FF6B35]" />
                        <span>{t("common.profile")}</span>
                      </Link>

                      <Link
                        href="/orders"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-muted transition-colors"
                      >
                        <ShoppingBag className="size-4 text-[#FF6B35]" />
                        <span>{t("common.trackOrder")}</span>
                      </Link>

                      <Link
                        href="/custom-prints/my-requests"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-muted transition-colors"
                      >
                        <UploadCloud className="size-4 text-[#FF6B35]" />
                        <span>{t("customPrintApp.myRequestsCta")}</span>
                      </Link>

                      <Link
                        href="/profile/addresses"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-muted transition-colors"
                      >
                        <MapPin className="size-4 text-[#FF6B35]" />
                        <span>{t("profile.addressesLink")}</span>
                      </Link>

                      <div className="pt-1 mt-1 border-t border-border/50">
                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false);
                            logout();
                          }}
                          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-medium text-red-500 hover:bg-red-500/10 transition-colors"
                        >
                          <LogOut className="size-4" />
                          <span>{t("auth.logout")}</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-xl border border-border/80 bg-background/80 hover:bg-muted/80 text-xs font-semibold text-foreground transition-all focus-visible:ring-2 focus-visible:ring-[#FF6B35]"
                aria-label={t("auth.loginButton")}
              >
                <User className="size-3.5 text-[#FF6B35]" />
                <span>{t("auth.loginButton")}</span>
              </Link>
            )}

            {/* Instant Quote CTA Button */}
            <div className="hidden sm:block">
              <Button
                variant="default"
                size="sm"
                iconRight={<ArrowRight className="size-3.5 rtl:rotate-180" />}
                asChild
              >
                <Link href="/custom-prints">{t("common.instantQuote")}</Link>
              </Button>
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden flex size-9 items-center justify-center rounded-xl border border-border/80 text-foreground hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-[#FF6B35]"
              aria-label={mobileMenuOpen ? t("nav.menuCloseAria") : t("nav.menuOpenAria")}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </Container>
      </nav>

      {/* Animated Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[88px] z-50 bg-[#111318]/95 dark:bg-[#0B0D11]/98 backdrop-blur-xl transition-all duration-300 animate-in fade-in slide-in-from-top-4 flex flex-col p-6 overflow-y-auto">
          {/* Mobile Global Controls: Language & Theme */}
          <div className="flex flex-col gap-2.5 pb-4 border-b border-white/10 mb-4">
            <LanguageSwitcher variant="mobile" />
            <ThemeToggle variant="mobile" />
          </div>

          {/* Mobile User Profile Section */}
          <div className="mb-5 pb-5 border-b border-white/10">
            {isAuthenticated ? (
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-[#FF6B35]/20 text-[#FF6B35] font-bold text-sm shrink-0">
                    {userInitial}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">
                      {userDisplayName}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {currentUser?.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 rounded-xl bg-[#FF6B35]/20 text-[#FF6B35] hover:bg-[#FF6B35]/30 transition-colors"
                      aria-label="Admin Dashboard"
                      title="Admin Dashboard"
                    >
                      <ShieldCheck className="size-4" />
                    </Link>
                  )}
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
                    aria-label="Profile"
                  >
                    <User className="size-4" />
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="p-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                    aria-label="Logout"
                  >
                    <LogOut className="size-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center h-11 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors"
                >
                  {t("auth.loginButton")}
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center h-11 rounded-xl bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white text-xs font-bold transition-colors shadow-sm"
                >
                  {t("auth.registerButton")}
                </Link>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-2">
              {t("nav.studioNavTitle")}
            </span>

            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center justify-between rounded-xl px-4 py-3.5 text-base font-medium transition-colors",
                    isActive
                      ? "bg-white/10 text-white font-semibold"
                      : "text-gray-300 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <span className="font-heading">{item.label}</span>
                  {item.badge && (
                    <Badge variant="electric" size="sm">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 flex flex-col gap-3">
            <Button
              variant="default"
              size="lg"
              className="w-full justify-center"
              iconRight={<ArrowRight className="size-4 rtl:rotate-180" />}
              asChild
            >
              <Link href="/custom-prints" onClick={() => setMobileMenuOpen(false)}>
                {t("common.requestCustomPrint")}
              </Link>
            </Button>

            <Button
              variant="charcoal"
              size="lg"
              className="w-full justify-center border-white/20"
              iconLeft={<Box className="size-4" />}
              asChild
            >
              <Link href="/products" onClick={() => setMobileMenuOpen(false)}>
                {t("common.exploreCatalog")}
              </Link>
            </Button>

            <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-400">
              <Link href="/orders" onClick={() => setMobileMenuOpen(false)}>
                {t("common.trackOrder")}
              </Link>
              <span>•</span>
              <Link href="/about" onClick={() => setMobileMenuOpen(false)}>
                {t("nav.studio")}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
