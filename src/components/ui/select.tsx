"use client";

import React, { forwardRef, useId } from "react";
import { ChevronDown, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options?: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      helperText,
      error,
      options,
      placeholder,
      id,
      disabled,
      required,
      children,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || generatedId;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
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
          <select
            id={selectId}
            ref={ref}
            disabled={disabled}
            required={required}
            className={cn(
              "w-full appearance-none bg-transparent px-3.5 py-2.5 pr-10 text-sm text-foreground outline-none disabled:cursor-not-allowed cursor-pointer",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled className="text-muted-foreground bg-background">
                {placeholder}
              </option>
            )}
            {options
              ? options.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.disabled}
                    className="bg-white dark:bg-[#1A1D24] text-foreground"
                  >
                    {opt.label}
                  </option>
                ))
              : children}
          </select>

          <div className="pointer-events-none absolute right-3.5 flex items-center text-muted-foreground">
            <ChevronDown className="size-4" />
          </div>
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

Select.displayName = "Select";

