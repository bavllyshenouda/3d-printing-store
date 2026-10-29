import React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  errorCode?: string | number;
  onRetry?: () => void;
  retryLabel?: string;
  secondaryAction?: React.ReactNode;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message = "An unexpected error occurred while loading this section. Please try again or contact support if the issue persists.",
  errorCode,
  onRetry,
  retryLabel = "Try Again",
  secondaryAction,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center text-center rounded-2xl border border-red-500/20 bg-red-500/5 p-8 sm:p-12",
        className
      )}
    >
      <div className="relative mb-4 flex items-center justify-center">
        <div className="absolute inset-0 rounded-2xl bg-red-500/20 blur-xl -z-10" />
        <div className="flex size-14 items-center justify-center rounded-2xl border border-red-500/30 bg-white dark:bg-[#1A1D24] text-red-500 shadow-sm">
          <AlertCircle className="size-7" />
        </div>
      </div>

      {errorCode && (
        <span className="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-red-500/80">
          Error {errorCode}
        </span>
      )}

      <h3 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-foreground">
        {title}
      </h3>

      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground leading-relaxed">
        {message}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <Button
            variant="default"
            size="sm"
            onClick={onRetry}
            iconLeft={<RotateCcw className="size-4" />}
          >
            {retryLabel}
          </Button>
        )}
        {secondaryAction}
      </div>
    </div>
  );
}

