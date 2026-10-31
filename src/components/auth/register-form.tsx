"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth/context";
import { useTranslation } from "@/lib/i18n/context";
import { EGYPTIAN_PHONE_REGEX } from "@/lib/validations/auth";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { resolveAuthMessage } from "@/lib/auth/error-messages";

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, isAuthenticated, resendVerification } = useAuth();
  const { t } = useTranslation();

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

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    phone?: string;
    general?: string;
  }>({});

  const validate = () => {
    const newErrors: {
      firstName?: string;
      lastName?: string;
      email?: string;
      password?: string;
      phone?: string;
    } = {};

    if (!firstName.trim()) {
      newErrors.firstName = t("auth.errFirstNameRequired");
    }

    if (!lastName.trim()) {
      newErrors.lastName = t("auth.errLastNameRequired");
    }

    if (!email.trim()) {
      newErrors.email = t("auth.errEmailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = t("auth.errEmailInvalid");
    }

    if (!password) {
      newErrors.password = t("auth.errPasswordRequired");
    } else if (password.length < 6) {
      newErrors.password = t("auth.errPasswordShort");
    }

    if (!phone.trim()) {
      newErrors.phone = t("auth.errPhoneRequired");
    } else if (!EGYPTIAN_PHONE_REGEX.test(phone.trim())) {
      newErrors.phone = t("auth.errPhoneInvalid");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    setErrors({});

    const result = await register({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      password,
      phone: phone.trim() || undefined,
    });

    if (result.success) {
      if (result.emailConfirmationRequired) {
        setEmailSent(true);
      } else {
        router.push(safeRedirect);
        router.refresh();
      }
    } else {
      setErrors({ general: resolveAuthMessage(result.error, t, "auth.errRegisterFailed") });
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email || isResending) return;
    setIsResending(true);
    const res = await resendVerification(email.trim());
    if (!res.success) {
      toast.error(
        t("auth.resendFailedTitle"),
        resolveAuthMessage(res.error, t, "auth.resendFailedDesc")
      );
    }
    setIsResending(false);
  };

  // If email verification notice is required
  if (emailSent) {
    return (
      <div className="flex flex-col items-center text-center p-6 space-y-4 rounded-2xl border border-border/80 bg-muted/20">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
          <CheckCircle2 className="size-8" />
        </div>
        <h3 className="font-heading text-xl font-bold text-foreground">
          {t("auth.registerSuccessTitle")}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
          {t("auth.confirmEmailDesc")}
        </p>
        <Link href="/auth/login" className="pt-2">
          <Button variant="default" size="default">
            {t("auth.signInLink")}
          </Button>
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleResend}
          disabled={isResending || !email}
          className="text-xs text-muted-foreground hover:text-[#FF6B35]"
        >
          {isResending ? t("auth.resending") : t("auth.resendVerification")}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* General Error Alert */}
      {errors.general && (
        <div
          role="alert"
          className="flex items-start gap-3 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-xs sm:text-sm animate-in fade-in"
        >
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <span>{errors.general}</span>
        </div>
      )}

      {/* Name Inputs (2 Columns on sm+) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <Input
          label={t("auth.firstNameLabel")}
          type="text"
          value={firstName}
          onChange={(e) => {
            setFirstName(e.target.value);
            if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: undefined }));
          }}
          placeholder={t("auth.firstNamePlaceholder")}
          error={errors.firstName}
          disabled={isSubmitting}
          required
          iconLeft={<User className="size-4" />}
          autoComplete="given-name"
        />

        <Input
          label={t("auth.lastNameLabel")}
          type="text"
          value={lastName}
          onChange={(e) => {
            setLastName(e.target.value);
            if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: undefined }));
          }}
          placeholder={t("auth.lastNamePlaceholder")}
          error={errors.lastName}
          disabled={isSubmitting}
          required
          iconLeft={<User className="size-4" />}
          autoComplete="family-name"
        />
      </div>

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
        autoComplete="new-password"
      />

      {/* Phone Number Input (Required) */}
      <Input
        label={t("auth.phoneLabel")}
        type="tel"
        inputMode="numeric"
        maxLength={11}
        value={phone}
        onChange={(e) => {
          setPhone(e.target.value);
          if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
        }}
        placeholder={t("auth.phonePlaceholder")}
        helperText={t("auth.phoneHelper")}
        error={errors.phone}
        disabled={isSubmitting}
        required
        iconLeft={<Phone className="size-4" />}
        autoComplete="tel"
      />

      {/* Submit Button */}
      <Button
        type="submit"
        variant="default"
        size="default"
        disabled={isSubmitting}
        className="w-full h-11 text-sm font-bold shadow-sm mt-2"
        iconLeft={isSubmitting ? <Loader2 className="size-4 animate-spin" /> : undefined}
        iconRight={!isSubmitting ? <ArrowRight className="size-4 rtl:rotate-180" /> : undefined}
      >
        {isSubmitting ? t("auth.registering") : t("auth.registerButton")}
      </Button>

      {/* Google OAuth Sign-Up */}
      <GoogleAuthButton
        next={safeRedirect}
        disabled={isSubmitting}
        onError={(message) => setErrors({ general: message })}
      />

      {/* Switch to Login */}
      <p className="text-center text-xs sm:text-sm text-muted-foreground pt-2">
        {t("auth.haveAccount")}{" "}
        <Link
          href={redirectParam ? `/auth/login?redirect=${encodeURIComponent(redirectParam)}` : "/auth/login"}
          className="text-[#FF6B35] font-semibold hover:underline"
        >
          {t("auth.signInLink")}
        </Link>
      </p>
    </form>
  );
}

