"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useTranslation } from "@/lib/i18n/context";
import { EGYPTIAN_PHONE_REGEX } from "@/lib/validations/order";
import { EGYPTIAN_GOVERNORATES } from "@/lib/constants/governorates";
import { User, Phone, MapPin, Building, AlertCircle, Loader2, Save } from "lucide-react";
import type { CustomerAddress } from "@/types/database";

export interface AddressFormModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: CustomerAddress | null;
  onSuccess?: (address: CustomerAddress) => void;
}

export function AddressFormModal({
  open,
  onClose,
  initialData,
  onSuccess,
}: AddressFormModalProps) {
  const { t, locale } = useTranslation();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [governorate, setGovernorate] = useState("cairo");
  const [region, setRegion] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [building, setBuilding] = useState("");
  const [floor, setFloor] = useState("");
  const [apartment, setApartment] = useState("");
  const [notes, setNotes] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync initialData when modal opens
  useEffect(() => {
    if (initialData) {
      setFirstName(initialData.first_name || "");
      setLastName(initialData.last_name || "");
      setPhone(initialData.phone || "");
      setGovernorate(initialData.governorate || "cairo");
      setRegion(initialData.region || "");
      setStreetAddress(initialData.street_address || "");
      setBuilding(initialData.building || "");
      setFloor(initialData.floor || "");
      setApartment(initialData.apartment || "");
      setNotes(initialData.notes || "");
      setIsDefault(Boolean(initialData.is_default));
    } else {
      setFirstName("");
      setLastName("");
      setPhone("");
      setGovernorate("cairo");
      setRegion("");
      setStreetAddress("");
      setBuilding("");
      setFloor("");
      setApartment("");
      setNotes("");
      setIsDefault(false);
    }
    setErrors({});
  }, [initialData, open]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!firstName.trim()) {
      errs.firstName = t("addresses.firstName") + " is required";
    }
    if (!lastName.trim()) {
      errs.lastName = t("addresses.lastName") + " is required";
    }
    if (!phone.trim()) {
      errs.phone = t("addresses.phone") + " is required";
    } else if (!EGYPTIAN_PHONE_REGEX.test(phone.trim())) {
      errs.phone = t("addresses.phoneHelper");
    }
    if (!governorate.trim()) {
      errs.governorate = t("addresses.selectGovernorate");
    }
    if (!region.trim()) {
      errs.region = t("addresses.region") + " is required";
    }
    if (!streetAddress.trim()) {
      errs.streetAddress = t("addresses.streetAddress") + " is required";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const payload = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        country: "Egypt",
        governorate: governorate.trim(),
        region: region.trim(),
        street_address: streetAddress.trim(),
        building: building.trim() || null,
        floor: floor.trim() || null,
        apartment: apartment.trim() || null,
        notes: notes.trim() || null,
        is_default: isDefault,
      };

      const isEdit = Boolean(initialData?.id);
      const url = isEdit ? `/api/addresses/${initialData!.id}` : "/api/addresses";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save address");
      }

      const savedAddress = data.data.address as CustomerAddress;

      toast.success(isEdit ? t("addresses.updateSuccess") : t("addresses.saveSuccess"));

      if (onSuccess) {
        onSuccess(savedAddress);
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setErrors((prev) => ({ ...prev, form: msg }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const governorateOptions = EGYPTIAN_GOVERNORATES.map((g) => ({
    value: g.id,
    label: locale === "ar" ? g.ar : g.en,
  }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialData ? t("addresses.editAddress") : t("addresses.addNew")}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2" noValidate>
        {errors.form && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-xs"
          >
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>{errors.form}</span>
          </div>
        )}

        {/* First & Last Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label={t("addresses.firstName")}
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: "" }));
            }}
            error={errors.firstName}
            required
            disabled={isSubmitting}
            iconLeft={<User className="size-4" />}
          />

          <Input
            label={t("addresses.lastName")}
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
              if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: "" }));
            }}
            error={errors.lastName}
            required
            disabled={isSubmitting}
            iconLeft={<User className="size-4" />}
          />
        </div>

        {/* Phone */}
        <Input
          label={t("addresses.phone")}
          type="tel"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            if (errors.phone) setErrors((prev) => ({ ...prev, phone: "" }));
          }}
          error={errors.phone}
          helperText={t("addresses.phoneHelper")}
          required
          disabled={isSubmitting}
          iconLeft={<Phone className="size-4" />}
        />

        {/* Governorate & Region */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Select
            label={t("addresses.governorate")}
            value={governorate}
            onChange={(e) => {
              setGovernorate(e.target.value);
              if (errors.governorate) setErrors((prev) => ({ ...prev, governorate: "" }));
            }}
            options={governorateOptions}
            required
            disabled={isSubmitting}
          />

          <Input
            label={t("addresses.region")}
            placeholder={t("addresses.regionPlaceholder")}
            value={region}
            onChange={(e) => {
              setRegion(e.target.value);
              if (errors.region) setErrors((prev) => ({ ...prev, region: "" }));
            }}
            error={errors.region}
            required
            disabled={isSubmitting}
            iconLeft={<MapPin className="size-4" />}
          />
        </div>

        {/* Street Address */}
        <Input
          label={t("addresses.streetAddress")}
          placeholder={t("addresses.streetPlaceholder")}
          value={streetAddress}
          onChange={(e) => {
            setStreetAddress(e.target.value);
            if (errors.streetAddress) setErrors((prev) => ({ ...prev, streetAddress: "" }));
          }}
          error={errors.streetAddress}
          required
          disabled={isSubmitting}
          iconLeft={<Building className="size-4" />}
        />

        {/* Building, Floor, Apartment */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <Input
            label={t("addresses.building").split(" ")[0]}
            placeholder="14A"
            value={building}
            onChange={(e) => setBuilding(e.target.value)}
            disabled={isSubmitting}
          />
          <Input
            label={t("addresses.floor").split(" ")[0]}
            placeholder="3"
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
            disabled={isSubmitting}
          />
          <Input
            label={t("addresses.apartment").split(" ")[0]}
            placeholder="12"
            value={apartment}
            onChange={(e) => setApartment(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        {/* Landmark Notes */}
        <Input
          label={t("addresses.notes")}
          placeholder={t("addresses.notesPlaceholder")}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isSubmitting}
        />

        {/* Set as Default Checkbox */}
        <div className="flex items-center gap-2.5 pt-1">
          <input
            type="checkbox"
            id="is-default-checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            disabled={isSubmitting}
            className="size-4 rounded border-border text-[#FF6B35] focus:ring-[#FF6B35]/20 cursor-pointer"
          />
          <label
            htmlFor="is-default-checkbox"
            className="text-xs font-medium text-foreground cursor-pointer select-none"
          >
            {t("addresses.isDefaultCheckbox")}
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
          <Button
            type="button"
            variant="outline"
            size="default"
            disabled={isSubmitting}
            onClick={onClose}
          >
            {t("addresses.cancel")}
          </Button>
          <Button
            type="submit"
            variant="default"
            size="default"
            disabled={isSubmitting}
            iconLeft={
              isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )
            }
          >
            {isSubmitting ? t("addresses.saving") : t("addresses.save")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
