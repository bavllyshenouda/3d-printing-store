"use client";

import React from "react";
import {
  MapPin,
  Phone,
  User,
  CheckCircle2,
  Edit2,
  Trash2,
  Star,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/context";
import { getGovernorate } from "@/lib/constants/governorates";
import type { CustomerAddress } from "@/types/database";

export interface AddressCardProps {
  address: CustomerAddress;
  isSelected?: boolean;
  onSelect?: (address: CustomerAddress) => void;
  onEdit?: (address: CustomerAddress) => void;
  onDelete?: (address: CustomerAddress) => void;
  onSetDefault?: (address: CustomerAddress) => void;
  selectable?: boolean;
  isSettingDefault?: boolean;
  className?: string;
}

export function AddressCard({
  address,
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
  onSetDefault,
  selectable = false,
  isSettingDefault = false,
  className,
}: AddressCardProps) {
  const { t, locale } = useTranslation();
  const govObj = getGovernorate(address.governorate);
  const govDisplay = govObj ? (locale === "ar" ? govObj.ar : govObj.en) : address.governorate;

  // Build apartment/building string
  const aptDetails = [
    address.building ? `${t("addresses.building").split(" ")[0]} ${address.building}` : null,
    address.floor ? `${t("addresses.floor").split(" ")[0]} ${address.floor}` : null,
    address.apartment ? `${t("addresses.apartment").split(" ")[0]} ${address.apartment}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      onClick={selectable && onSelect ? () => onSelect(address) : undefined}
      className={cn(
        "relative rounded-2xl border p-5 transition-all text-left group",
        selectable && "cursor-pointer hover:border-[#FF6B35]/70 hover:shadow-sm",
        isSelected
          ? "border-[#FF6B35] bg-[#FF6B35]/5 ring-2 ring-[#FF6B35]/20 shadow-xs"
          : "border-border/80 bg-card hover:bg-muted/10",
        className
      )}
    >
      {/* Header: Name, Default Badge & Selection Radio */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 font-bold text-foreground text-sm sm:text-base">
            <User className="size-4 text-[#FF6B35] shrink-0" />
            <span>
              {address.first_name} {address.last_name}
            </span>
          </div>

          {address.is_default && (
            <Badge
              variant="outline"
              className="text-[10px] py-0 px-2 font-semibold bg-[#FF6B35]/10 text-[#FF6B35] border-[#FF6B35]/30"
            >
              {t("addresses.defaultBadge")}
            </Badge>
          )}
        </div>

        {selectable && (
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
        )}
      </div>

      {/* Phone */}
      <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-2">
        <Phone className="size-3.5 text-muted-foreground/70 shrink-0" />
        <span dir="ltr" className="font-mono">{address.phone}</span>
      </div>

      {/* Full Address */}
      <div className="flex items-start gap-2 text-xs sm:text-sm text-foreground/90 leading-relaxed mb-3">
        <MapPin className="size-3.5 text-[#FF6B35] shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">
            {address.street_address}
            {aptDetails && <span className="text-muted-foreground"> ({aptDetails})</span>}
          </p>
          <p className="text-muted-foreground text-xs mt-0.5">
            {address.region}, {govDisplay}, {address.country || "Egypt"}
          </p>
        </div>
      </div>

      {/* Optional Delivery Landmark/Notes */}
      {address.notes && (
        <div className="flex items-start gap-2 text-[11px] text-muted-foreground/90 bg-muted/30 rounded-xl p-2.5 mb-3 border border-border/50">
          <FileText className="size-3 text-[#FF6B35] shrink-0 mt-0.5" />
          <p className="italic">{address.notes}</p>
        </div>
      )}

      {/* Footer Actions (Edit, Delete, Set Default) */}
      {(onEdit || onDelete || onSetDefault) && (
        <div className="flex items-center justify-between gap-2 pt-3 mt-1 border-t border-border/60">
          <div className="flex items-center gap-1.5">
            {onEdit && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(address);
                }}
                className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                iconLeft={<Edit2 className="size-3" />}
              >
                {t("addresses.editAddress")}
              </Button>
            )}

            {onDelete && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(address);
                }}
                className="h-8 px-2.5 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10"
                iconLeft={<Trash2 className="size-3" />}
              >
                {t("addresses.deleteAddress")}
              </Button>
            )}
          </div>

          {onSetDefault && !address.is_default && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSettingDefault}
              onClick={(e) => {
                e.stopPropagation();
                onSetDefault(address);
              }}
              className="h-8 px-2.5 text-xs font-medium"
              iconLeft={<Star className="size-3 text-amber-500" />}
            >
              {isSettingDefault ? t("addresses.settingDefault") : t("addresses.setAsDefault")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

