"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Calendar,
  Lock,
  Save,
  Loader2,
  LogOut,
  ShoppingBag,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Layers,
  MapPin,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/context";
import { useTranslation } from "@/lib/i18n/context";
import { EGYPTIAN_PHONE_REGEX } from "@/lib/validations/auth";

export function ProfileView() {
  const router = useRouter();
  const { user, profile, isAdmin, isLoading, isAuthenticated, updateProfile, logout } = useAuth();
  const { t, locale } = useTranslation();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string; phone?: string; general?: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Sync profile data to local state
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      setPhone(profile.phone || "");
    } else if (user?.user_metadata) {
      setFirstName(user.user_metadata.first_name || "");
      setLastName(user.user_metadata.last_name || "");
      setPhone(user.user_metadata.phone || "");
    }
  }, [profile, user]);

  // Redirect to login if not authenticated and not loading
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/auth/login?redirect=/profile");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !user) {
    return (
      <div className="py-12 bg-background min-h-[70vh]">
        <Container size="lg">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Skeleton className="size-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-7 w-48 rounded-lg" />
                <Skeleton className="h-4 w-32 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </Container>
      </div>
    );
  }

  // Derive display initials
  const initials =
    firstName && lastName
      ? `${firstName[0]}${lastName[0]}`.toUpperCase()
      : user.email
      ? user.email.slice(0, 2).toUpperCase()
      : "PS";

  const memberDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "-";

  const validate = () => {
    const newErrors: { firstName?: string; lastName?: string; phone?: string } = {};

    if (!firstName.trim()) {
      newErrors.firstName = "First name cannot be empty";
    }

    if (!lastName.trim()) {
      newErrors.lastName = "Last name cannot be empty";
    }

    if (phone.trim() && !EGYPTIAN_PHONE_REGEX.test(phone.trim())) {
      newErrors.phone =
        "Invalid Egyptian phone number. Must be 11 digits starting with 010, 011, 012, or 015.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSaving) return;

    setIsSaving(true);
    setErrors({});

    const result = await updateProfile({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone.trim() || null,
    });

    if (!result.success) {
      setErrors({ general: result.error || "Failed to update profile" });
    }

    setIsSaving(false);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
  };

  return (
    <div className="py-10 sm:py-16 bg-background min-h-[80vh]">
      <Container size="lg" className="space-y-8">
        {/* 1. Header Card with Avatar & Role */}
        <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Initials Avatar */}
            <div className="flex size-18 sm:size-20 items-center justify-center rounded-2xl bg-[#FF6B35]/10 border-2 border-[#FF6B35] text-[#FF6B35] font-heading text-xl sm:text-2xl font-black shadow-xs shrink-0">
              {initials}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  {firstName && lastName ? `${firstName} ${lastName}` : user.email?.split("@")[0]}
                </h1>

                {isAdmin ? (
                  <Badge variant="electric" size="sm">
                    {t("profile.adminRole")}
                  </Badge>
                ) : (
                  <Badge variant="outline" size="sm">
                    {t("profile.customerRole")}
                  </Badge>
                )}
              </div>

              <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5">
                <Mail className="size-3.5 text-[#FF6B35]" />
                <span>{user.email}</span>
              </p>

              <p className="text-xs text-muted-foreground/80 flex items-center gap-1.5 pt-0.5">
                <Calendar className="size-3.5 text-muted-foreground/60" />
                <span>
                  {t("profile.memberSince")}: {memberDate}
                </span>
              </p>
            </div>
          </div>

          {/* Sign Out Button */}
          <Button
            variant="outline"
            size="default"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 hover:border-red-500/60 transition-colors w-full sm:w-auto"
            iconLeft={
              isLoggingOut ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <LogOut className="size-4" />
              )
            }
          >
            {isLoggingOut ? t("auth.loggingOut") : t("auth.logout")}
          </Button>
        </div>

        {/* 2. Main 2-Column Section: Profile Form & Quick Links */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Profile Form (8 Columns) */}
          <div className="lg:col-span-8 rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-foreground">
                {t("profile.personalInfo")}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {t("profile.subtitle")}
              </p>
            </div>

            {errors.general && (
              <div
                role="alert"
                className="flex items-start gap-2.5 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-xs sm:text-sm"
              >
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{errors.general}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-5" noValidate>
              {/* First & Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={t("auth.firstNameLabel")}
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: undefined }));
                  }}
                  error={errors.firstName}
                  required
                  disabled={isSaving}
                  iconLeft={<User className="size-4" />}
                />

                <Input
                  label={t("auth.lastNameLabel")}
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: undefined }));
                  }}
                  error={errors.lastName}
                  required
                  disabled={isSaving}
                  iconLeft={<User className="size-4" />}
                />
              </div>

              {/* Phone Input */}
              <Input
                label={t("auth.phoneLabel")}
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                }}
                error={errors.phone}
                helperText={t("auth.phoneHelper")}
                disabled={isSaving}
                iconLeft={<Phone className="size-4" />}
              />

              {/* Email (Read-Only) */}
              <div className="space-y-1.5 pt-1 border-t border-border/50">
                <Input
                  label={t("auth.emailLabel")}
                  type="email"
                  value={user.email || ""}
                  disabled
                  readOnly
                  iconLeft={<Mail className="size-4" />}
                  iconRight={<Lock className="size-4 text-muted-foreground/60" />}
                />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {t("profile.emailNotice")}
                </p>
              </div>

              {/* Save Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="default"
                  size="default"
                  disabled={isSaving}
                  className="w-full sm:w-auto h-11 px-8 font-bold shadow-sm"
                  iconLeft={
                    isSaving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )
                  }
                >
                  {isSaving ? t("profile.saving") : t("profile.saveChanges")}
                </Button>
              </div>
            </form>
          </div>

          {/* Quick Hub Sidebar (4 Columns) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
              <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Studio Hub
              </h3>

              <div className="flex flex-col gap-2">
                <Link
                  href="/orders"
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-border/60 bg-muted/20 hover:bg-muted/50 hover:border-[#FF6B35]/40 transition-all text-sm font-medium text-foreground group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-white dark:bg-[#15181E] text-[#FF6B35] shadow-xs">
                      <ShoppingBag className="size-4" />
                    </div>
                    <span>{t("profile.ordersLink")}</span>
                  </div>
                </Link>

                <Link
                  href="/custom-prints"
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-border/60 bg-muted/20 hover:bg-muted/50 hover:border-[#FF6B35]/40 transition-all text-sm font-medium text-foreground group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-white dark:bg-[#15181E] text-[#FF6B35] shadow-xs">
                      <UploadCloud className="size-4" />
                    </div>
                    <span>{t("profile.customPrintsLink")}</span>
                  </div>
                </Link>

                <Link
                  href="/profile/addresses"
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-border/60 bg-muted/20 hover:bg-muted/50 hover:border-[#FF6B35]/40 transition-all text-sm font-medium text-foreground group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-white dark:bg-[#15181E] text-[#FF6B35] shadow-xs">
                      <MapPin className="size-4" />
                    </div>
                    <span>{t("profile.addressesLink")}</span>
                  </div>
                </Link>

                <Link
                  href="/shop"
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-border/60 bg-muted/20 hover:bg-muted/50 hover:border-[#FF6B35]/40 transition-all text-sm font-medium text-foreground group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-white dark:bg-[#15181E] text-[#FF6B35] shadow-xs">
                      <Layers className="size-4" />
                    </div>
                    <span>{t("common.exploreCatalog")}</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

