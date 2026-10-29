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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/layout/container";
import { cn } from "@/lib/utils";

export interface NavItem {
  label: string;
  href: string;
  badge?: string;
}

const navItems: NavItem[] = [
  { label: "Catalog", href: "/products" },
  { label: "Custom 3D Print", href: "/custom-prints", badge: "Instant Quote" },
  { label: "Materials & Tech", href: "/materials" },
  { label: "Track Order", href: "/orders" },
  { label: "Studio", href: "/about" },
];

export interface NavbarProps {
  cartCount?: number;
  user?: { email?: string; name?: string } | null;
  onCartClick?: () => void;
  onSearchClick?: () => void;
}

export function Navbar({
  cartCount = 0,
  user = null,
  onCartClick,
  onSearchClick,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

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

  return (
    <header className="sticky top-0 z-40 w-full">
      {/* Top Studio Status Ticker */}
      <div className="bg-[#111318] text-white py-1.5 px-4 text-xs font-mono border-b border-white/5 overflow-hidden">
        <Container size="xl" className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-gray-300">
              Farm Online · Precision Multi-Material 3D Printing (PETG, PLA+, Carbon Fiber)
            </span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-gray-400 text-[11px]">
            <span>Fast Cairo & Giza Delivery</span>
            <span>•</span>
            <Link
              href="/custom-prints"
              className="text-[#FF6B35] hover:underline flex items-center gap-1"
            >
              Upload STL/3MF File <ArrowRight className="size-3" />
            </Link>
          </div>
        </Container>
      </div>

      {/* Main Navigation Bar */}
      <nav
        className={cn(
          "w-full border-b transition-all duration-300 bg-background/85 backdrop-blur-md",
          isScrolled
            ? "border-border/80 shadow-soft py-3"
            : "border-border/50 py-4"
        )}
      >
        <Container size="xl" className="flex items-center justify-between gap-4">
          {/* Logo Branding */}
          <Link
            href="/"
            className="group flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] rounded-lg"
          >
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#111318] text-white shadow-sm transition-transform duration-300 group-hover:scale-105 border border-white/10">
              <Layers className="size-5 text-[#FF6B35]" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-lg font-black tracking-tight text-foreground leading-none">
                PRINT<span className="text-[#FF6B35]">STUDIO</span>
              </span>
              <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
                Additives · Lab
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

          {/* Right Action Icons & CTA */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Trigger */}
            <button
              onClick={onSearchClick}
              className="flex size-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors focus-visible:ring-2 focus-visible:ring-[#FF6B35]"
              aria-label="Search catalog"
            >
              <Search className="size-4" />
            </button>

            {/* Cart Trigger */}
            <button
              onClick={onCartClick}
              className="relative flex size-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors focus-visible:ring-2 focus-visible:ring-[#FF6B35]"
              aria-label={`Shopping cart with ${cartCount} items`}
            >
              <ShoppingBag className="size-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-[#FF6B35] text-[10px] font-bold text-white shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Account / Profile */}
            <Link
              href={user ? "/profile" : "/auth"}
              className="hidden sm:flex size-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors focus-visible:ring-2 focus-visible:ring-[#FF6B35]"
              aria-label={user ? "Customer profile" : "Sign in"}
            >
              <User className="size-4" />
            </Link>

            {/* Quote CTA Button */}
            <div className="hidden sm:block">
              <Button
                variant="default"
                size="sm"
                iconRight={<ArrowRight className="size-3.5" />}
                asChild
              >
                <Link href="/custom-prints">Instant Quote</Link>
              </Button>
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden flex size-9 items-center justify-center rounded-xl border border-border/80 text-foreground hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-[#FF6B35]"
              aria-label={mobileMenuOpen ? "Close menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </Container>
      </nav>

      {/* Animated Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[88px] z-50 bg-[#111318]/95 backdrop-blur-xl transition-all duration-300 animate-in fade-in slide-in-from-top-4 flex flex-col p-6 overflow-y-auto">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-2">
              Studio Navigation
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
              iconRight={<ArrowRight className="size-4" />}
              asChild
            >
              <Link href="/custom-prints" onClick={() => setMobileMenuOpen(false)}>
                Request Custom 3D Print
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
                Explore Catalog
              </Link>
            </Button>

            <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-400">
              <Link href="/orders" onClick={() => setMobileMenuOpen(false)}>
                Track Order
              </Link>
              <span>•</span>
              <Link href="/about" onClick={() => setMobileMenuOpen(false)}>
                Studio & Lab
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
