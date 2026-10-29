"use client";

import React, { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center font-medium select-none transition-all duration-200 outline-none disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#FF6B35] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#111318] motion-reduce:transition-none motion-reduce:transform-none [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[#FF6B35] text-white shadow-sm hover:bg-[#E85A26] active:bg-[#D44C19] shadow-[0_2px_12px_-2px_rgba(255,107,53,0.35)] hover:shadow-[0_4px_20px_-2px_rgba(255,107,53,0.45)]",
        charcoal:
          "bg-[#111318] text-white hover:bg-[#1A1D24] active:bg-[#242832] border border-white/10 shadow-sm",
        secondary:
          "bg-white dark:bg-[#1A1D24] text-foreground border border-border/80 hover:bg-gray-50 dark:hover:bg-[#242832] shadow-sm",
        outline:
          "border border-border/80 bg-transparent text-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:border-foreground/30",
        ghost:
          "bg-transparent text-foreground hover:bg-black/5 dark:hover:bg-white/5",
        destructive:
          "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20 active:bg-red-500/30",
        link:
          "text-[#FF6B35] underline-offset-4 hover:underline p-0 h-auto bg-transparent",
      },
      size: {
        default: "h-10 px-4 text-sm rounded-xl gap-2 [&_svg]:size-4",
        sm: "h-8 px-3 text-xs rounded-lg gap-1.5 [&_svg]:size-3.5",
        lg: "h-12 px-6 text-base rounded-xl gap-2.5 font-semibold [&_svg]:size-5",
        icon: "size-10 rounded-xl p-0 [&_svg]:size-4",
        "icon-sm": "size-8 rounded-lg p-0 [&_svg]:size-3.5",
        "icon-lg": "size-12 rounded-xl p-0 [&_svg]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  asChild?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading = false,
      disabled,
      asChild = false,
      iconLeft,
      iconRight,
      children,
      ...props
    },
    ref
  ) => {
    const combinedClassName = cn(buttonVariants({ variant, size, className }));

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{
        className?: string;
        children?: React.ReactNode;
      }>;
      return React.cloneElement(child, {
        className: cn(combinedClassName, child.props.className),
        children: (
          <>
            {loading ? <Loader2 className="size-4 animate-spin" /> : iconLeft}
            {child.props.children}
            {!loading && iconRight}
          </>
        ),
      });
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={combinedClassName}
        {...props}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          iconLeft
        )}
        {children}
        {!loading && iconRight}
      </button>
    );
  }
);

Button.displayName = "Button";

export { buttonVariants };
