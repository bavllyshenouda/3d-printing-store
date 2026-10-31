"use client";

import React, { useState } from "react";
import {
  Banknote,
  Smartphone,
  Wallet,
  CreditCard,
  Copy,
  Check,
  Info,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

export interface PaymentMethodInstructionsProps {
  method: string;
  amount: number;
  currency?: string;
  className?: string;
}

export function PaymentMethodInstructions({
  method,
  amount,
  currency = "EGP",
  className,
}: PaymentMethodInstructionsProps) {
  const { t } = useTranslation();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2200);
  };

  if (method === "cod") {
    return (
      <div
        className={cn(
          "rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-6 space-y-4 text-start",
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 shrink-0 shadow-xs">
            <Banknote className="size-6" />
          </div>
          <div>
            <h3 className="font-heading text-base font-bold text-foreground">
              {t("payment.codInstructionsTitle")}
            </h3>
            <span className="text-xs text-muted-foreground">
              {t("payment.methodCod")}
            </span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {t("payment.codInstructionsDesc")}
        </p>

        <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-card border border-border/60 text-xs text-foreground/90">
          <Info className="size-4 text-emerald-500 shrink-0 mt-0.5" />
          <span>{t("payment.codNotice")}</span>
        </div>
      </div>
    );
  }

  if (method === "instapay") {
    const ipnHandle = "printstudio@instapay";

    return (
      <div
        className={cn(
          "rounded-3xl border border-[#FF6B35]/30 bg-[#FF6B35]/5 p-6 space-y-5 text-start",
          className
        )}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-[#FF6B35]/10 text-[#FF6B35] shrink-0 shadow-xs">
              <Smartphone className="size-6" />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-foreground">
                {t("payment.instapayInstructionsTitle")}
              </h3>
              <span className="text-xs text-muted-foreground">
                National Bank of Egypt · Instant Payment Network (IPN)
              </span>
            </div>
          </div>

          <Badge
            variant="outline"
            className="text-[10px] py-0.5 px-2.5 font-bold bg-[#FF6B35]/10 text-[#FF6B35] border-[#FF6B35]/30 self-start sm:self-auto"
          >
            Zero IPN Fees
          </Badge>
        </div>

        {/* Transfer Destination Box */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-card border border-[#FF6B35]/30 shadow-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Official Studio IPA
            </span>
            <span className="font-mono text-base font-extrabold text-[#FF6B35] select-all">
              {ipnHandle}
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(ipnHandle, "instapay")}
            className="h-9 px-3 text-xs font-semibold self-start sm:self-auto border-border hover:border-[#FF6B35]"
            iconLeft={
              copiedKey === "instapay" ? (
                <Check className="size-3.5 text-emerald-500" />
              ) : (
                <Copy className="size-3.5" />
              )
            }
          >
            {copiedKey === "instapay" ? t("payment.copySuccess") : t("payment.copyButton")}
          </Button>
        </div>

        {/* Numbered Steps */}
        <div className="space-y-2.5 pt-1 text-xs sm:text-sm text-foreground/90">
          <div className="flex items-start gap-2.5">
            <span className="flex size-5 items-center justify-center rounded-full bg-[#FF6B35]/10 text-[#FF6B35] text-[11px] font-bold shrink-0 mt-0.5">
              1
            </span>
            <span>{t("payment.instapayStep1")}</span>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="flex size-5 items-center justify-center rounded-full bg-[#FF6B35]/10 text-[#FF6B35] text-[11px] font-bold shrink-0 mt-0.5">
              2
            </span>
            <span>{t("payment.instapayStep2")}</span>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="flex size-5 items-center justify-center rounded-full bg-[#FF6B35]/10 text-[#FF6B35] text-[11px] font-bold shrink-0 mt-0.5">
              3
            </span>
            <span>
              {t("payment.instapayStep3")}:{" "}
              <strong className="text-[#FF6B35] font-mono">
                {amount} {currency}
              </strong>
            </span>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="flex size-5 items-center justify-center rounded-full bg-[#FF6B35]/10 text-[#FF6B35] text-[11px] font-bold shrink-0 mt-0.5">
              4
            </span>
            <span>{t("payment.instapayStep4")}</span>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="flex size-5 items-center justify-center rounded-full bg-[#FF6B35]/10 text-[#FF6B35] text-[11px] font-bold shrink-0 mt-0.5">
              5
            </span>
            <span>{t("payment.instapayStep5")}</span>
          </div>
        </div>
      </div>
    );
  }

  if (method === "vodafone_cash") {
    const walletNumber = "01019882341";

    return (
      <div
        className={cn(
          "rounded-3xl border border-red-500/30 bg-red-500/5 p-6 space-y-5 text-start",
          className
        )}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 shrink-0 shadow-xs">
              <Wallet className="size-6" />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-foreground">
                {t("payment.vodafoneInstructionsTitle")}
              </h3>
              <span className="text-xs text-muted-foreground">
                Ana Vodafone · USSD *9*7# · All Egyptian Mobile Wallets
              </span>
            </div>
          </div>

          <Badge
            variant="outline"
            className="text-[10px] py-0.5 px-2.5 font-bold bg-red-500/10 text-red-500 border-red-500/30 self-start sm:self-auto"
          >
            Smart Wallet
          </Badge>
        </div>

        {/* Transfer Destination Box */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-card border border-red-500/30 shadow-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Registered Studio Wallet
            </span>
            <span className="font-mono text-base font-extrabold text-red-500 select-all" dir="ltr">
              {walletNumber}
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(walletNumber, "vodafone")}
            className="h-9 px-3 text-xs font-semibold self-start sm:self-auto border-border hover:border-red-500"
            iconLeft={
              copiedKey === "vodafone" ? (
                <Check className="size-3.5 text-emerald-500" />
              ) : (
                <Copy className="size-3.5" />
              )
            }
          >
            {copiedKey === "vodafone" ? t("payment.copySuccess") : t("payment.copyButton")}
          </Button>
        </div>

        {/* Numbered Steps */}
        <div className="space-y-2.5 pt-1 text-xs sm:text-sm text-foreground/90">
          <div className="flex items-start gap-2.5">
            <span className="flex size-5 items-center justify-center rounded-full bg-red-500/10 text-red-500 text-[11px] font-bold shrink-0 mt-0.5">
              1
            </span>
            <span>{t("payment.vodafoneStep1")}</span>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="flex size-5 items-center justify-center rounded-full bg-red-500/10 text-red-500 text-[11px] font-bold shrink-0 mt-0.5">
              2
            </span>
            <span>{t("payment.vodafoneStep2")}</span>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="flex size-5 items-center justify-center rounded-full bg-red-500/10 text-red-500 text-[11px] font-bold shrink-0 mt-0.5">
              3
            </span>
            <span>
              {t("payment.vodafoneStep3")}:{" "}
              <strong className="text-red-500 font-mono">
                {amount} {currency}
              </strong>
            </span>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="flex size-5 items-center justify-center rounded-full bg-red-500/10 text-red-500 text-[11px] font-bold shrink-0 mt-0.5">
              4
            </span>
            <span>{t("payment.vodafoneStep4")}</span>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="flex size-5 items-center justify-center rounded-full bg-red-500/10 text-red-500 text-[11px] font-bold shrink-0 mt-0.5">
              5
            </span>
            <span>{t("payment.vodafoneStep5")}</span>
          </div>
        </div>
      </div>
    );
  }

  // Fallback for online
  return (
    <div
      className={cn(
        "rounded-3xl border border-blue-500/30 bg-blue-500/5 p-6 space-y-4 text-start",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500 shrink-0 shadow-xs">
          <CreditCard className="size-6" />
        </div>
        <div>
          <h3 className="font-heading text-base font-bold text-foreground">
            {t("payment.methodOnline")}
          </h3>
          <span className="text-xs text-muted-foreground">Visa · Mastercard</span>
        </div>
      </div>
      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
        Card transaction processed securely.
      </p>
    </div>
  );
}

