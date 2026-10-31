"use client";

import React, { useState } from "react";
import {
  Banknote,
  Smartphone,
  Wallet,
  CreditCard,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n/context";

export type PaymentMethod = "cod" | "instapay" | "vodafone_cash" | "online";

export interface CheckoutPaymentStepProps {
  paymentMethod: PaymentMethod;
  onSelectPaymentMethod: (method: PaymentMethod) => void;
  onBack: () => void;
  onContinue: () => void;
}

export function CheckoutPaymentStep({
  paymentMethod,
  onSelectPaymentMethod,
  onBack,
  onContinue,
}: CheckoutPaymentStepProps) {
  const { t, isRTL } = useTranslation();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const NextIcon = isRTL ? ArrowLeft : ArrowRight;
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  const paymentOptions: {
    id: PaymentMethod;
    title: string;
    description: string;
    badge: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
  }[] = [
    {
      id: "cod",
      title: t("checkout.codTitle"),
      description: t("checkout.codDesc"),
      badge: "Cairo · Giza · Egypt",
      icon: Banknote,
      accentColor: "text-emerald-500",
    },
    {
      id: "instapay",
      title: t("checkout.instapayTitle"),
      description: t("checkout.instapayDesc"),
      badge: "Instant IPN",
      icon: Smartphone,
      accentColor: "text-[#FF6B35]",
    },
    {
      id: "vodafone_cash",
      title: t("checkout.vodafoneTitle"),
      description: t("checkout.vodafoneDesc"),
      badge: "Smart Wallets",
      icon: Wallet,
      accentColor: "text-red-500",
    },
    {
      id: "online",
      title: t("checkout.onlineTitle"),
      description: t("checkout.onlineDesc"),
      badge: "Visa · Mastercard",
      icon: CreditCard,
      accentColor: "text-blue-500",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <CreditCard className="size-5 text-[#FF6B35]" />
          <span>{t("checkout.paymentMethod")}</span>
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          {t("checkout.subtitle")}
        </p>
      </div>

      {/* Methods Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {paymentOptions.map((opt) => {
          const isSelected = paymentMethod === opt.id;
          const Icon = opt.icon;

          return (
            <div
              key={opt.id}
              onClick={() => onSelectPaymentMethod(opt.id)}
              className={cn(
                "relative rounded-2xl border p-5 cursor-pointer transition-all text-start flex flex-col justify-between group",
                isSelected
                  ? "border-[#FF6B35] bg-[#FF6B35]/5 ring-2 ring-[#FF6B35]/20 shadow-xs"
                  : "border-border/80 bg-card hover:bg-muted/10 hover:border-border"
              )}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        "flex size-10 items-center justify-center rounded-xl transition-colors shadow-xs",
                        isSelected
                          ? "bg-[#FF6B35] text-white"
                          : "bg-muted text-muted-foreground group-hover:text-foreground"
                      )}
                    >
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-heading text-sm sm:text-base font-bold text-foreground">
                        {opt.title}
                      </h3>
                      <Badge
                        variant="outline"
                        className="text-[10px] py-0 px-1.5 font-medium border-border/60"
                      >
                        {opt.badge}
                      </Badge>
                    </div>
                  </div>

                  <div
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full border transition-all shrink-0",
                      isSelected
                        ? "border-[#FF6B35] bg-[#FF6B35] text-white"
                        : "border-muted-foreground/30 bg-muted/20"
                    )}
                  >
                    {isSelected && <CheckCircle2 className="size-4" />}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {opt.description}
                </p>
              </div>

              {/* Special Info Callout for Selected InstaPay or Vodafone Cash */}
              {isSelected && opt.id === "instapay" && (
                <div className="mt-4 pt-3 border-t border-border/60">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-[#FF6B35]/30 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        IPN Address
                      </span>
                      <span className="font-mono font-bold text-[#FF6B35] select-all">
                        printstudio@instapay
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard("printstudio@instapay", "instapay");
                      }}
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Copy address"
                    >
                      {copiedKey === "instapay" ? (
                        <Check className="size-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {isSelected && opt.id === "vodafone_cash" && (
                <div className="mt-4 pt-3 border-t border-border/60">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-red-500/30 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Wallet Number
                      </span>
                      <span className="font-mono font-bold text-red-500 select-all">
                        01019882341
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard("01019882341", "vodafone");
                      }}
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Copy number"
                    >
                      {copiedKey === "vodafone" ? (
                        <Check className="size-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Security Notice */}
      <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-muted/20 border border-border/60 text-xs text-muted-foreground">
        <ShieldAlert className="size-4 text-[#FF6B35] shrink-0" />
        <span>{t("checkout.authoritativeNotice")}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border/60">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onBack}
          iconLeft={<BackIcon className="size-4" />}
        >
          {t("checkout.back")}
        </Button>

        <Button
          type="button"
          variant="default"
          size="lg"
          onClick={onContinue}
          iconRight={<NextIcon className="size-4" />}
          className="font-bold shadow-sm"
        >
          {t("checkout.continueToReview")}
        </Button>
      </div>
    </div>
  );
}

