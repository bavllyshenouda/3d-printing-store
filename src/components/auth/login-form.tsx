"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ArrowRight,
  Info,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/context";
import { useTranslation } from "@/lib/i18n/context";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated } = useAuth();
  const { t, isRTL } = useTranslation();

  const redirectParam = searchParams.get("redirect");
  const safeRedirect =
    redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//")
      ? redirectParam
      : "/profile";

  // Redirect if already logged in
  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace(safeRedirect);
    }
  }, [isAuthenticated, router, safeRedirect]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotNotice, setShowForgotNotice] = useState(false);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    setErrors({});

    const result = await login(email.trim(), password);

    if (result.success) {
      router.push(safeRedirect);
      router.refresh();
    } else {
      setErrors({ general: result.error || "Invalid email or password" });
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* General Error Banner */}
      {errors.general && (
        <div
          role="alert"
          className="flex items-start gap-3 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-xs sm:text-sm animate-in fade-in"
        >
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <span>{errors.general}</span>
        </div>
      )}

      {/* Email Input */}
      <Input
        label={t("auth.emailLabel")}
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
        }}
        placeholder={t("auth.emailPlaceholder")}
        error={errors.email}
        disabled={isSubmitting}
        required
        iconLeft={<Mail className="size-4" />}
        autoComplete="email"
      />

      {/* Password Input */}
      <div className="space-y-1.5">
        <Input
          label={t("auth.passwordLabel")}
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
          }}
          placeholder={t("auth.passwordPlaceholder")}
          error={errors.password}
          disabled={isSubmitting}
          required
          iconLeft={<Lock className="size-4" />}
          iconRight={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          }
          autoComplete="current-password"
        />

        {/* Forgot Password Trigger */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowForgotNotice(!showForgotNotice)}
            className="text-[11px] text-muted-foreground hover:text-[#FF6B35] transition-colors"
          >
            Forgot Password?
          </button>
        </div>

        {/* Documentation notice for Forgot Password (no fake endpoint) */}
        {showForgotNotice && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl border border-border/80 bg-muted/40 text-xs text-muted-foreground animate-in fade-in">
            <Info className="size-4 text-[#FF6B35] shrink-0 mt-0.5" />
            <span>{t("auth.forgotPasswordNotice")}</span>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="default"
        size="default"
        disabled={isSubmitting}
        className="w-full h-11 text-sm font-bold shadow-sm"
        iconLeft={isSubmitting ? <Loader2 className="size-4 animate-spin" /> : undefined}
        iconRight={!isSubmitting ? <ArrowRight className="size-4 rtl:rotate-180" /> : undefined}
      >
        {isSubmitting ? t("auth.loggingIn") : t("auth.loginButton")}
      </Button>

      {/* Switch to Register */}
      <p className="text-center text-xs sm:text-sm text-muted-foreground pt-2">
        {t("auth.noAccount")}{" "}
        <Link
          href={redirectParam ? `/auth/register?redirect=${encodeURIComponent(redirectParam)}` : "/auth/register"}
          className="text-[#FF6B35] font-semibold hover:underline"
        >
          {t("auth.signUpLink")}
        </Link>
      </p>
    </form>
  );
}

