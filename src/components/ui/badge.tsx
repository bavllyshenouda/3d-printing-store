import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 font-medium rounded-full border transition-colors select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[#FF6B35]/12 text-[#FF6B35] border-[#FF6B35]/30 dark:bg-[#FF6B35]/20",
        electric:
          "bg-[#FF6B35] text-white border-transparent shadow-sm shadow-[#FF6B35]/20",
        charcoal:
          "bg-[#111318] text-white border-white/10 dark:bg-white/10 dark:text-white dark:border-white/10",
        secondary:
          "bg-muted text-muted-foreground border-border/80",
        outline:
          "bg-transparent text-foreground border-border",
        success:
          "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
        warning:
          "bg-amber-500/12 text-amber-600 dark:text-amber-400 border-amber-500/30",
        destructive:
          "bg-red-500/12 text-red-600 dark:text-red-400 border-red-500/30",
      },
      size: {
        sm: "px-2 py-0.5 text-[11px] leading-tight",
        default: "px-2.5 py-1 text-xs leading-normal",
        lg: "px-3 py-1.5 text-sm leading-normal",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
  pulse?: boolean;
}

export function Badge({
  className,
  variant,
  size,
  dot = false,
  pulse = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size, className }))} {...props}>
      {dot && (
        <span
          className={cn(
            "size-1.5 rounded-full shrink-0",
            variant === "success" && "bg-emerald-500",
            variant === "warning" && "bg-amber-500",
            variant === "destructive" && "bg-red-500",
            (variant === "default" || variant === "electric") && "bg-[#FF6B35]",
            (variant === "charcoal" || variant === "secondary" || variant === "outline") &&
              "bg-current",
            pulse && "animate-pulse"
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

export { badgeVariants };

