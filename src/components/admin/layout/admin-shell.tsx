"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, Loader2 } from "lucide-react";
import { AdminSidebar } from "./admin-sidebar";
import { AdminTopbar } from "./admin-topbar";
import { useAuth } from "@/lib/auth/context";
import { useTranslation } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";

interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { isAdmin, isLoading, isAuthenticated } = useAuth();
  const { t } = useTranslation();

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#111318] text-white flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 animate-in fade-in">
          <div className="size-12 rounded-2xl bg-[#FF6B35] flex items-center justify-center text-white shadow-xl shadow-[#FF6B35]/25">
            <Loader2 className="size-6 animate-spin" />
          </div>
          <div className="text-center">
            <h2 className="font-heading font-black text-lg tracking-tight">
              PRINT STUDIO OPS
            </h2>
            <p className="text-xs text-gray-400 font-mono mt-1">
              Verifying administrative credentials...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthorized / Access Denied State
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-card border border-border rounded-3xl p-8 text-center shadow-xl">
          <div className="size-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="size-8" />
          </div>
          <h1 className="font-heading font-bold text-xl mb-2">
            Access Restricted
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Administrator privileges are required to access the operations console. Please sign in with an authorized studio administrator account.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" asChild>
              <Link href="/">
                <ArrowLeft className="size-4 me-2" />
                Return to Store
              </Link>
            </Button>
            <Button variant="default" asChild className="bg-[#FF6B35] hover:bg-[#FF6B35]/90">
              <Link href="/auth/login?redirect=/admin">
                Sign In as Admin
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authorized Administrator Shell
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar Navigation */}
      <AdminSidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopbar onOpenMobileMenu={() => setIsMobileOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

