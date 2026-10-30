"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, MapPin, Truck, AlertCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { AddressCard } from "@/components/addresses/address-card";
import { AddressFormModal } from "@/components/addresses/address-form-modal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/lib/i18n/context";
import { getShippingFee, getGovernorate } from "@/lib/constants/governorates";
import type { CustomerAddress } from "@/types/database";

export interface CheckoutAddressStepProps {
  selectedAddress: CustomerAddress | null;
  onSelectAddress: (address: CustomerAddress) => void;
  deliveryNotes: string;
  onChangeDeliveryNotes: (notes: string) => void;
  onContinue: () => void;
}

export function CheckoutAddressStep({
  selectedAddress,
  onSelectAddress,
  deliveryNotes,
  onChangeDeliveryNotes,
  onContinue,
}: CheckoutAddressStepProps) {
  const { t, locale, isRTL } = useTranslation();

  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);

  const fetchAddresses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/addresses");
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load addresses");
      }
      const list: CustomerAddress[] = data.data.addresses || [];
      setAddresses(list);

      // Auto-select default if none selected
      if (!selectedAddress && list.length > 0) {
        const defaultAddr = list.find((a) => a.is_default) || list[0];
        onSelectAddress(defaultAddr);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error fetching addresses");
    } finally {
      setIsLoading(false);
    }
  }, [selectedAddress, onSelectAddress]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const NextIcon = isRTL ? ArrowLeft : ArrowRight;

  const currentFee = selectedAddress ? getShippingFee(selectedAddress.governorate) : null;
  const currentGov = selectedAddress ? getGovernorate(selectedAddress.governorate) : null;
  const govName = currentGov
    ? locale === "ar"
      ? currentGov.ar
      : currentGov.en
    : selectedAddress?.governorate;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <MapPin className="size-5 text-[#FF6B35]" />
            <span>{t("checkout.stepShipping")}</span>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {t("checkout.selectSavedAddress")}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setEditingAddress(null);
            setIsModalOpen(true);
          }}
          iconLeft={<Plus className="size-4" />}
          className="border-[#FF6B35]/40 text-[#FF6B35] hover:bg-[#FF6B35]/10 shrink-0 font-semibold"
        >
          {t("checkout.addNewAddress")}
        </Button>
      </div>

      {/* Address Selection List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-center text-red-600 dark:text-red-400">
          <AlertCircle className="size-5 mx-auto mb-2" />
          <p className="font-semibold text-sm">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAddresses}
            className="mt-3"
          >
            {t("common.retry")}
          </Button>
        </div>
      ) : addresses.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/80 p-8 sm:p-10 text-center max-w-lg mx-auto space-y-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-[#FF6B35]/10 text-[#FF6B35] mx-auto">
            <MapPin className="size-6" />
          </div>
          <div>
            <h3 className="font-heading text-base font-bold text-foreground">
              {t("checkout.noSavedAddresses")}
            </h3>
          </div>
          <Button
            type="button"
            variant="default"
            size="default"
            onClick={() => {
              setEditingAddress(null);
              setIsModalOpen(true);
            }}
            iconLeft={<Plus className="size-4" />}
          >
            {t("checkout.addNewAddress")}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <AddressCard
              key={addr.id}
              address={addr}
              selectable
              isSelected={selectedAddress?.id === addr.id}
              onSelect={onSelectAddress}
              onEdit={(addressToEdit) => {
                setEditingAddress(addressToEdit);
                setIsModalOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Dynamic Delivery Fee Preview */}
      {selectedAddress && currentFee !== null && (
        <div className="flex items-center justify-between p-4 rounded-2xl border border-border/80 bg-muted/20 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5 text-muted-foreground">
            <Truck className="size-4 text-[#FF6B35]" />
            <span>
              {t("checkout.deliverTo")}{" "}
              <strong className="text-foreground">{govName}</strong>
            </span>
          </div>
          <div className="font-semibold text-foreground">
            {t("checkout.shippingFee")}:{" "}
            <span className="text-[#FF6B35] font-bold">
              {currentFee} {t("common.egp")}
            </span>
          </div>
        </div>
      )}

      {/* Delivery Instructions (Optional) */}
      <div className="space-y-1.5">
        <label
          htmlFor="delivery-notes-input"
          className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          {t("checkout.addressNotes")}
        </label>
        <textarea
          id="delivery-notes-input"
          rows={3}
          value={deliveryNotes}
          onChange={(e) => onChangeDeliveryNotes(e.target.value)}
          placeholder={t("checkout.addressNotesPlaceholder")}
          className="w-full rounded-2xl border border-border/80 bg-card p-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 focus:outline-none transition-all resize-none shadow-xs"
        />
      </div>

      {/* Continue Action */}
      <div className="flex items-center justify-end pt-4 border-t border-border/60">
        <Button
          type="button"
          variant="default"
          size="lg"
          disabled={!selectedAddress}
          onClick={onContinue}
          iconRight={<NextIcon className="size-4" />}
          className="w-full sm:w-auto font-bold shadow-sm"
        >
          {t("checkout.continue")}
        </Button>
      </div>

      {/* Modal for adding/editing address inline */}
      <AddressFormModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAddress(null);
        }}
        initialData={editingAddress}
        onSuccess={(saved) => {
          onSelectAddress(saved);
          fetchAddresses();
        }}
      />
    </div>
  );
}

