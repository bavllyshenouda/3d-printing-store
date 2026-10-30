"use client";

import React, { forwardRef, useId } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      label,
      helperText,
      error,
      iconLeft,
      iconRight,
      id,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {label}
            {required && <span className="text-[#FF6B35] ml-1">*</span>}
          </label>
        )}

        <div
          className={cn(
            "group relative flex items-center rounded-xl border bg-white dark:bg-[#1A1D24] transition-all duration-200 shadow-sm",
            error
              ? "border-red-500/50 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/20"
              : "border-border/80 hover:border-border focus-within:border-[#FF6B35] focus-within:ring-2 focus-within:ring-[#FF6B35]/20",
            disabled && "opacity-50 cursor-not-allowed bg-muted/40"
          )}
        >
          {iconLeft && (
            <div className="ps-3.5 pe-1 text-muted-foreground shrink-0 pointer-events-none">
              {iconLeft}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            type={type}
            disabled={disabled}
            required={required}
            className={cn(
              "w-full bg-transparent px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none disabled:cursor-not-allowed",
              iconLeft && "ps-1.5",
              iconRight && "pe-1.5",
              className
            )}
            {...props}
          />

          {iconRight && (
            <div className="pe-3.5 ps-1 text-muted-foreground shrink-0">
              {iconRight}
            </div>
          )}
        </div>

        {error ? (
          <p className="flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400">
            <AlertCircle className="size-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="text-xs text-muted-foreground">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";

