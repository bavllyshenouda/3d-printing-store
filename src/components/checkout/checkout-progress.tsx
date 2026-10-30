"use client";

import React from "react";
import { Check, MapPin, CreditCard, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";

export type CheckoutStep = 1 | 2 | 3;

export interface CheckoutProgressProps {
  currentStep: CheckoutStep;
  onStepClick?: (step: CheckoutStep) => void;
}

export function CheckoutProgress({
  currentStep,
  onStepClick,
}: CheckoutProgressProps) {
  const { t } = useTranslation();

  const steps = [
    {
      step: 1 as CheckoutStep,
      title: t("checkout.step1Short"),
      icon: MapPin,
    },
    {
      step: 2 as CheckoutStep,
      title: t("checkout.step2Short"),
      icon: CreditCard,
    },
    {
      step: 3 as CheckoutStep,
      title: t("checkout.step3Short"),
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto mb-8 sm:mb-12">
      <div className="relative flex items-center justify-between">
        {/* Connecting line behind steps */}
        <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-[2px] bg-border/60 -z-0" />

        {/* Progress highlight bar */}
        <div
          className="absolute top-1/2 left-6 -translate-y-1/2 h-[2px] bg-[#FF6B35] transition-all duration-300 -z-0"
          style={{
            width:
              currentStep === 1
                ? "0%"
                : currentStep === 2
                ? "50%"
                : "calc(100% - 3rem)",
          }}
        />

        {steps.map(({ step, title, icon: Icon }) => {
          const isCompleted = currentStep > step;
          const isCurrent = currentStep === step;
          const isClickable = onStepClick && step < currentStep;

          return (
            <div
              key={step}
              onClick={() => isClickable && onStepClick(step)}
              className={cn(
                "relative z-10 flex flex-col items-center gap-2 group select-none",
                isClickable && "cursor-pointer"
              )}
            >
              {/* Circle Badge */}
              <div
                className={cn(
                  "flex size-10 sm:size-11 items-center justify-center rounded-2xl border-2 transition-all duration-200 shadow-xs",
                  isCompleted
                    ? "border-[#FF6B35] bg-[#FF6B35] text-white"
                    : isCurrent
                    ? "border-[#FF6B35] bg-card text-[#FF6B35] ring-4 ring-[#FF6B35]/15"
                    : "border-border/80 bg-card text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="size-5 stroke-[2.5]" />
                ) : (
                  <Icon className="size-4 sm:size-5" />
                )}
              </div>

              {/* Step Label */}
              <span
                className={cn(
                  "text-xs font-semibold tracking-wide transition-colors whitespace-nowrap",
                  isCurrent
                    ? "text-[#FF6B35] font-bold"
                    : isCompleted
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

