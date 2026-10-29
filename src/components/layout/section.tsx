import React from "react";
import { cn } from "@/lib/utils";

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  spacing?: "default" | "compact" | "spacious" | "none";
  background?: "default" | "muted" | "charcoal" | "grid";
}

export function Section({
  spacing = "default",
  background = "default",
  className,
  children,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn(
        "relative w-full",
        spacing === "compact" && "py-8 sm:py-12",
        spacing === "default" && "py-12 sm:py-20",
        spacing === "spacious" && "py-20 sm:py-32",
        spacing === "none" && "py-0",
        background === "muted" && "bg-muted/40",
        background === "charcoal" && "bg-[#111318] text-white",
        background === "grid" && "bg-studio-grid",
        className
      )}
      {...props}
    >
      {children}
    </section>
  );
}

