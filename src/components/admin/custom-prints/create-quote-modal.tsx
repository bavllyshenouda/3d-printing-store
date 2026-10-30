"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Calculator } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { useTranslation } from "@/lib/i18n/context";

interface CreateQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  request: any;
}

export function CreateQuoteModal({
  isOpen,
  onClose,
  onSuccess,
  request,
}: CreateQuoteModalProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [description, setDescription] = useState("");
  const [material, setMaterial] = useState("PETG");
  const [color, setColor] = useState("Black");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("250");
  const [estimatedDays, setEstimatedDays] = useState("3");
  const [validDays, setValidDays] = useState("7");
  const [status, setStatus] = useState<"sent" | "draft">("sent");

  useEffect(() => {
    if (request) {
      setDescription(
        `Precision industrial 3D printing for: ${request.title}. 0.16mm layer height, 4 walls, 25% gyroid infill.`
      );
      setMaterial(request.material || "PETG");
      setColor(request.color || "Black");
      setQuantity(String(request.quantity || 1));
      setUnitPrice("250");
      setEstimatedDays("3");
      setValidDays("7");
      setStatus("sent");
    }
  }, [request, isOpen]);

  const parsedQty = parseInt(quantity, 10) || 1;
  const parsedUnit = parseFloat(unitPrice) || 0;
  const calculatedTotal = (parsedQty * parsedUnit).toFixed(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request) return;

    if (description.trim().length < 5) {
      toast.error(
        "Validation error",
        "Quote description must be at least 5 characters long."
      );
      return;
    }

    if (parsedUnit < 0) {
      toast.error("Validation error", "Unit price cannot be negative.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        description: description.trim(),
        material: material.trim() || undefined,
        color: color.trim() || undefined,
        quantity: parsedQty,
        unit_price: parsedUnit,
        estimated_days: parseInt(estimatedDays, 10) || 3,
        valid_days: parseInt(validDays, 10) || 7,
        status,
      };

      const res = await fetch(`/api/admin/custom-prints/${request.id}/quotes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error("Quote failed", json.error || "Could not issue quote");
        return;
      }

      toast.success(
        t("admin.customPrintsModule.quoteSuccess"),
        `Official quote of ${calculatedTotal} EGP issued for ${request.title}.`
      );
      onSuccess();
      onClose();
    } catch {
      toast.error("Network Error", "Failed to connect to quote service");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={`${t("admin.customPrintsModule.createQuote")} — ${request?.title || ""}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Description & Technical Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            {t("admin.customPrintsModule.quoteDescription")} *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            required
            placeholder="Specify technical parameters, layer height, infill percentage, material tolerances..."
            className="w-full p-3 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-[#FF6B35] resize-y"
          />
        </div>

        {/* Material & Color */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Material Spec
            </label>
            <Input
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              placeholder="e.g. PETG, ABS, PA-CF, Resin 8K"
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Color Spec
            </label>
            <Input
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="e.g. Signal Orange, Jet Black"
              className="text-xs"
            />
          </div>
        </div>

        {/* Pricing, Quantity & Total */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-muted/40 border border-border">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              {t("admin.customPrintsModule.quantity")} *
            </label>
            <Input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              className="text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              {t("admin.customPrintsModule.unitPrice")} *
            </label>
            <Input
              type="number"
              min="0"
              step="0.5"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              required
              className="text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5 flex flex-col justify-end">
            <span className="text-[10px] font-mono text-muted-foreground uppercase">
              Calculated Total
            </span>
            <span className="text-lg font-heading font-black text-[#FF6B35] font-mono leading-none">
              {calculatedTotal} EGP
            </span>
          </div>
        </div>

        {/* Lead Time, Validity & Quote State */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              {t("admin.customPrintsModule.estimatedDays")}
            </label>
            <Input
              type="number"
              min="1"
              max="180"
              value={estimatedDays}
              onChange={(e) => setEstimatedDays(e.target.value)}
              className="text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              {t("admin.customPrintsModule.validityDays")}
            </label>
            <Input
              type="number"
              min="1"
              max="90"
              value={validDays}
              onChange={(e) => setValidDays(e.target.value)}
              className="text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Quote State
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "sent" | "draft")}
              className="w-full h-10 px-3 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-[#FF6B35]"
            >
              <option value="sent">Send Directly to Client</option>
              <option value="draft">Save as Internal Draft</option>
            </select>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/80">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting}
            className="bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white text-xs"
          >
            {isSubmitting && (
              <Loader2 className="size-3.5 animate-spin me-1.5" />
            )}
            {status === "sent" ? "Issue & Send Quote" : "Save Quote Draft"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
