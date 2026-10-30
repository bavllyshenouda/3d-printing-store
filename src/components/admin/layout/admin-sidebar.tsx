"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  CreditCard,
  Layers,
  Package,
  FolderTree,
  Users,
  MessageSquare,
  Store,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  X,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function AdminSidebar({
  collapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onMobileClose,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const { t, isRTL } = useTranslation();
  const { logout } = useAuth();

  const navLinks = [
    {
      href: "/admin",
      label: t("admin.overview"),
      icon: LayoutDashboard,
      exact: true,
    },
    {
      href: "/admin/orders",
      label: t("admin.orders"),
      icon: ShoppingBag,
    },
    {
      href: "/admin/payments",
      label: t("admin.payments"),
      icon: CreditCard,
    },
    {
      href: "/admin/custom-prints",
      label: t("admin.customPrints"),
      icon: Layers,
    },
    {
      href: "/admin/products",
      label: t("admin.products"),
      icon: Package,
    },
    {
      href: "/admin/categories",
      label: t("admin.categories"),
      icon: FolderTree,
    },
    {
      href: "/admin/customers",
      label: t("admin.customers"),
      icon: Users,
    },
    {
      href: "/admin/whatsapp",
      label: t("admin.whatsapp"),
      icon: MessageSquare,
    },
  ];

  const isLinkActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#111318] text-white select-none">
      {/* Studio Admin Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 shrink-0">
        <Link
          href="/admin"
          className="flex items-center gap-2.5 group overflow-hidden"
          onClick={onMobileClose}
        >
          <div className="size-9 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#E0531A] flex items-center justify-center shadow-lg shadow-[#FF6B35]/20 group-hover:scale-105 transition-transform shrink-0">
            <ShieldCheck className="size-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-heading font-black text-sm tracking-tight text-white uppercase truncate">
                PRINT STUDIO
              </span>
              <span className="text-[10px] font-mono tracking-widest text-[#FF6B35] font-semibold uppercase">
                OPS CONSOLE
              </span>
            </div>
          )}
        </Link>

        {/* Mobile close button */}
        {isMobileOpen && (
          <button
            type="button"
            onClick={onMobileClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 md:hidden"
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        )}
      </div>

      {/* Navigation items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin scrollbar-thumb-white/10">
        <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-gray-400 font-semibold">
          {!collapsed && t("admin.dashboard")}
        </div>

        {navLinks.map((link) => {
          const Icon = link.icon;
          const active = isLinkActive(link.href, link.exact);
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onMobileClose}
              title={collapsed ? link.label : undefined}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 relative",
                active
                  ? "bg-[#FF6B35] text-white shadow-md shadow-[#FF6B35]/25 font-bold"
                  : "text-gray-300 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon
                className={cn(
                  "size-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                  active ? "text-white" : "text-gray-400 group-hover:text-white"
                )}
              />
              {!collapsed && <span className="truncate">{link.label}</span>}
              {active && !collapsed && (
                <span
                  className={cn(
                    "absolute size-1.5 rounded-full bg-white",
                    isRTL ? "left-3" : "right-3"
                  )}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions: Storefront & Logout */}
      <div className="p-3 border-t border-white/10 space-y-1 shrink-0 bg-white/[0.02]">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          title={collapsed ? t("admin.backToStore") : undefined}
          className="group flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
        >
          <Store className="size-4 shrink-0 text-emerald-400" />
          {!collapsed && (
            <div className="flex items-center justify-between flex-1 min-w-0">
              <span className="truncate">{t("admin.backToStore")}</span>
              <span className="text-[10px] font-mono text-gray-400 uppercase">
                ↗
              </span>
            </div>
          )}
        </Link>

        <button
          type="button"
          onClick={() => logout()}
          title={collapsed ? t("admin.logout") : undefined}
          className="group flex items-center gap-3 w-full px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="size-4 shrink-0" />
          {!collapsed && <span className="truncate">{t("admin.logout")}</span>}
        </button>

        {/* Desktop Collapse Toggle */}
        {onToggleCollapse && (
          <div className="hidden md:flex pt-2 justify-center border-t border-white/5">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                isRTL ? (
                  <ChevronLeft className="size-4" />
                ) : (
                  <ChevronRight className="size-4" />
                )
              ) : isRTL ? (
                <ChevronRight className="size-4" />
              ) : (
                <ChevronLeft className="size-4" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col shrink-0 border-e border-white/10 transition-all duration-300 z-30",
          collapsed ? "w-20" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          <aside
            className={cn(
              "relative flex flex-col w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in",
              isRTL ? "slide-in-from-right" : "slide-in-from-left"
            )}
          >
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}

