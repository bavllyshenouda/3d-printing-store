"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/context";
import { useTranslation } from "@/lib/i18n/context";
import { resolveAuthMessage, isOAuthNotConfigured } from "@/lib/auth/error-messages";

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.57 5.57 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29a7.19 7.19 0 0 1 0-4.58V6.62H1.29a11.99 11.99 0 0 0 0 10.76l3.98-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.7 0 3.99 2.47 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

export interface GoogleAuthButtonProps {
  /** Where the user should land after a successful Google auth. */
  next?: string;
  /** Bubble the resolved error message up to the parent form's banner. */
  onError?: (message: string) => void;
  disabled?: boolean;
}

export function GoogleAuthButton({
  next,
  onError,
  disabled,
}: GoogleAuthButtonProps) {
  const { signInWithGoogle } = useAuth();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (isLoading || disabled) return;
    setIsLoading(true);

    const res = await signInWithGoogle(next);

    if (!res.success) {
      const message = isOAuthNotConfigured(res.code, res.error)
        ? t("auth.errGoogleNotConfigured")
        : resolveAuthMessage(res.error, t, "auth.errOAuthGeneric");

      if (onError) {
        onError(message);
      }
      setIsLoading(false);
    }
    // On success the browser navigates to Google, so we keep the loading state.
  };

  return (
    <div className="space-y-4">
      {/* Divider */}
      <div className="relative flex items-center justify-center gap-3">
        <span className="h-px flex-1 bg-border" aria-hidden="true" />
        <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
          {t("auth.orContinueWith")}
        </span>
        <span className="h-px flex-1 bg-border" aria-hidden="true" />
      </div>

      <Button
        type="button"
        variant="secondary"
        size="default"
        onClick={handleClick}
        disabled={disabled}
        loading={isLoading}
        iconLeft={<GoogleLogo />}
        className="w-full h-11 text-sm font-semibold"
      >
        {isLoading ? t("auth.redirecting") : t("auth.continueWithGoogle")}
      </Button>
    </div>
  );
}
