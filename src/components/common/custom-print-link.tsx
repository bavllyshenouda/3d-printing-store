"use client";

import React from "react";
import Link from "next/link";
import { CUSTOM_PRINTS_ENABLED } from "@/lib/config/features";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

export interface CustomPrintLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href?: string;
  children: React.ReactNode;
  className?: string;
  badgeClassName?: string;
  showBadge?: boolean;
}

export const CustomPrintLink = React.forwardRef<
  HTMLAnchorElement,
  CustomPrintLinkProps
>(function CustomPrintLink(
  {
    href = "/custom-prints",
    children,
    className,
    badgeClassName,
    showBadge = true,
    onClick,
    ...rest
  },
  ref
) {
  const { t } = useTranslation();

  if (CUSTOM_PRINTS_ENABLED) {
    return (
      <Link
        ref={ref}
        href={href}
        className={className}
        onClick={onClick}
        {...rest}
      >
        {children}
      </Link>
    );
  }

  return (
    <span
      ref={ref as unknown as React.Ref<HTMLSpanElement>}
      role="link"
      aria-disabled="true"
      tabIndex={-1}
      className={cn(
        "cursor-not-allowed opacity-75 select-none inline-flex items-center gap-1.5",
        className
      )}
      onClick={(e) => {
        e.preventDefault();
      }}
      {...(rest as unknown as React.HTMLAttributes<HTMLSpanElement>)}
    >
      {children}
      {showBadge && (
        <span
          className={cn(
            "text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30 shrink-0 whitespace-nowrap leading-none",
            badgeClassName
          )}
        >
          {t("common.comingSoon")}
        </span>
      )}
    </span>
  );
});

