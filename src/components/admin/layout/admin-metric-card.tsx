"use client";

import React from "react";
import Link from "next/link";
import { LucideIcon, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminMetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: {
    text: string;
    variant?: "success" | "warning" | "info" | "neutral";
  };
  href?: string;
  className?: string;
}

export function AdminMetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  href,
  className,
}: AdminMetricCardProps) {
  const content = (
    <div
      className={cn(
        "group relative p-5 rounded-2xl bg-card border border-border transition-all duration-200 hover:shadow-md hover:border-border/80 flex flex-col justify-between",
        href && "cursor-pointer",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider font-mono">
            {title}
          </span>
          <span className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-foreground mt-1.5">
            {value}
          </span>
        </div>

        <div className="size-10 rounded-xl bg-[#FF6B35]/10 text-[#FF6B35] flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
          <Icon className="size-5" />
        </div>
      </div>

      {(subtitle || badge) && (
        <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-border/60 text-xs">
          {subtitle && (
            <span className="text-muted-foreground truncate">{subtitle}</span>
          )}

          {badge && (
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0",
                badge.variant === "success" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
                badge.variant === "warning" && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
                badge.variant === "info" && "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
                (!badge.variant || badge.variant === "neutral") && "bg-muted text-muted-foreground"
              )}
            >
              {badge.text}
            </span>
          )}

          {href && (
            <ArrowUpRight className="size-3.5 text-muted-foreground group-hover:text-[#FF6B35] transition-colors ms-auto shrink-0" />
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

