import React from "react";
import { Box } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-border/80 bg-muted/20 p-8 sm:p-12",
        compact && "p-6 sm:p-8",
        className
      )}
    >
      <div className="relative mb-4 flex items-center justify-center">
        {/* Subtle orange accent glow behind the icon */}
        <div className="absolute inset-0 rounded-2xl bg-[#FF6B35]/15 blur-xl -z-10" />
        <div className="flex size-14 items-center justify-center rounded-2xl border border-border/80 bg-white dark:bg-[#1A1D24] text-[#FF6B35] shadow-sm">
          {icon || <Box className="size-7" />}
        </div>
      </div>

      <h3 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-foreground">
        {title}
      </h3>

      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>

      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}

