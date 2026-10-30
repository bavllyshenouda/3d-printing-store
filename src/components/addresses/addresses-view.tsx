"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/container";
import { AddressCard } from "@/components/addresses/address-card";
import { AddressFormModal } from "@/components/addresses/address-form-modal";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth/context";
import { useTranslation } from "@/lib/i18n/context";
import {
  MapPin,
  Plus,
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Loader2,
  Trash2,
} from "lucide-react";
import type { CustomerAddress } from "@/types/database";

export function AddressesView() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, isRTL } = useTranslation();

  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);

  // Delete modal state
  const [deletingAddress, setDeletingAddress] = useState<CustomerAddress | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Set default state
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  // Protect route
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/auth/login?redirect=/profile/addresses");
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchAddresses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/addresses");
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load addresses");
      }
      setAddresses(data.data.addresses || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error fetching addresses");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAddresses();
    }
  }, [isAuthenticated, fetchAddresses]);

  const handleSetDefault = async (address: CustomerAddress) => {
    setSettingDefaultId(address.id);
    try {
      const res = await fetch(`/api/addresses/${address.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_default: true }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update default address");
      }

      toast.success(t("addresses.updateSuccess"));

      // Update state locally
      setAddresses((prev) =>
        prev.map((a) => ({
          ...a,
          is_default: a.id === address.id,
        }))
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to set default");
    } finally {
      setSettingDefaultId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deletingAddress) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/addresses/${deletingAddress.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete address");
      }

      toast.success(t("addresses.deleteSuccess"));

      setAddresses((prev) => prev.filter((a) => a.id !== deletingAddress.id));
      setDeletingAddress(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete address");
    } finally {
      setIsDeleting(false);
    }
  };

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="py-8 sm:py-12 bg-background min-h-[75vh]">
      <Container size="lg">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/profile"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group"
          >
            <BackIcon className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>{t("profile.title")}</span>
          </Link>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {t("addresses.title")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t("addresses.subtitle")}
            </p>
          </div>

          <Button
            type="button"
            variant="default"
            size="default"
            onClick={() => {
              setEditingAddress(null);
              setIsFormOpen(true);
            }}
            iconLeft={<Plus className="size-4" />}
            className="shadow-sm font-semibold"
          >
            {t("addresses.addNew")}
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-44 w-full rounded-2xl" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center text-red-600 dark:text-red-400">
            <p className="font-semibold text-sm">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAddresses}
              className="mt-4"
            >
              {t("common.retry")}
            </Button>
          </div>
        ) : addresses.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-12 text-center max-w-md mx-auto space-y-4">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60 text-[#FF6B35] mx-auto shadow-xs">
              <MapPin className="size-7" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold text-foreground">
                {t("addresses.emptyTitle")}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {t("addresses.emptyDesc")}
              </p>
            </div>
            <Button
              type="button"
              variant="default"
              size="default"
              onClick={() => {
                setEditingAddress(null);
                setIsFormOpen(true);
              }}
              iconLeft={<Plus className="size-4" />}
            >
              {t("addresses.addNew")}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {addresses.map((address) => (
              <AddressCard
                key={address.id}
                address={address}
                onEdit={(addr) => {
                  setEditingAddress(addr);
                  setIsFormOpen(true);
                }}
                onDelete={(addr) => setDeletingAddress(addr)}
                onSetDefault={handleSetDefault}
                isSettingDefault={settingDefaultId === address.id}
              />
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        <AddressFormModal
          open={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingAddress(null);
          }}
          initialData={editingAddress}
          onSuccess={() => {
            fetchAddresses();
          }}
        />

        {/* Delete Confirmation Modal */}
        <Modal
          open={Boolean(deletingAddress)}
          onClose={() => !isDeleting && setDeletingAddress(null)}
          title={t("addresses.deleteConfirmTitle")}
          maxWidth="sm"
        >
          <div className="space-y-4 pt-1">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <span>{t("addresses.deleteConfirmDesc")}</span>
            </div>

            {deletingAddress && (
              <div className="text-xs text-muted-foreground p-3 rounded-xl bg-muted/40 border border-border/50">
                <p className="font-semibold text-foreground">
                  {deletingAddress.first_name} {deletingAddress.last_name}
                </p>
                <p className="mt-0.5">{deletingAddress.street_address}, {deletingAddress.region}</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isDeleting}
                onClick={() => setDeletingAddress(null)}
              >
                {t("addresses.cancel")}
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={isDeleting}
                onClick={confirmDelete}
                iconLeft={
                  isDeleting ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )
                }
              >
                {isDeleting ? t("addresses.deleting") : t("addresses.deleteConfirmButton")}
              </Button>
            </div>
          </div>
        </Modal>
      </Container>
    </div>
  );
}
