"use client";

import React from "react";
import Link from "next/link";
import { LogIn, UserPlus } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/context";

export interface ProductAuthModalProps {
  open: boolean;
  onClose: () => void;
  productSlug: string;
}

export function ProductAuthModal({
  open,
  onClose,
  productSlug,
}: ProductAuthModalProps) {
  const { t } = useTranslation();
  const redirectUrl = encodeURIComponent(`/products/${productSlug}`);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("product.signInRequiredTitle")}
      maxWidth="md"
    >
      <div className="flex flex-col gap-6 py-2">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t("product.signInRequiredDesc")}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href={`/auth/login?redirect=${redirectUrl}`}
            className="flex-1"
          >
            <Button
              variant="default"
              size="default"
              className="w-full"
              iconLeft={<LogIn className="size-4" />}
            >
              {t("product.signIn")}
            </Button>
          </Link>

          <Link
            href={`/auth/register?redirect=${redirectUrl}`}
            className="flex-1"
          >
            <Button
              variant="outline"
              size="default"
              className="w-full"
              iconLeft={<UserPlus className="size-4" />}
            >
              {t("product.createAccount")}
            </Button>
          </Link>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-xs text-center text-muted-foreground hover:text-foreground transition-colors underline"
        >
          {t("product.continueShopping")}
        </button>
      </div>
    </Modal>
  );
}

