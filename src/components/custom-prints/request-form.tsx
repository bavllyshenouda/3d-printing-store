"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  FileCode,
  Box,
  Layers,
  Palette,
  Hash,
  Link as LinkIcon,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FileUploader } from "./file-uploader";
import { toast } from "@/components/ui/toast";
import { useTranslation } from "@/lib/i18n/context";

const MATERIALS = [
  { value: "PETG-CF", label: "PETG-Carbon Fiber (High Stiffness & Heat)" },
  { value: "Tough PLA", label: "Tough PLA+ (Rapid Prototyping & Enclosures)" },
  { value: "ABS / ASA", label: "ABS / ASA (UV & Weather Resistant)" },
  { value: "Nylon PA12", label: "Nylon PA12 (Wear & Impact Resistance)" },
  { value: "TPU 95A", label: "Flexible TPU 95A (Gaskets & Dampeners)" },
  { value: "8K Resin", label: "8K High-Precision Resin (Micro Details)" },
];

const COLORS = [
  { value: "Black", label: "Matte Black" },
  { value: "White", label: "Pure White" },
  { value: "Studio Orange", label: "Studio Orange (#FF6B35)" },
  { value: "Industrial Grey", label: "Industrial Grey" },
  { value: "Transparent", label: "Translucent / Clear" },
  { value: "Other", label: "Other / Specify in notes" },
];

export function RequestForm() {
  const router = useRouter();
  const { t } = useTranslation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [preferredMaterial, setPreferredMaterial] = useState("PETG-CF");
  const [preferredColor, setPreferredColor] = useState("Black");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStepStatus, setUploadStepStatus] = useState<string | null>(null);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!description.trim() || description.trim().length < 10) {
      errs.description = "Description must be at least 10 characters long.";
    }

    if (!quantity || quantity < 1) {
      errs.quantity = "Quantity must be at least 1.";
    }

    if (referenceUrl.trim()) {
      try {
        new URL(referenceUrl.trim());
      } catch {
        errs.referenceUrl = "Please provide a valid URL (starting with https://).";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});
    setUploadStepStatus("Creating manufacturing request...");

    try {
      // 1. Create request record
      const payload = {
        title: title.trim() || null,
        description: description.trim(),
        quantity: Number(quantity),
        preferred_material: preferredMaterial || null,
        preferred_color: preferredColor || null,
        reference_url: referenceUrl.trim() || null,
        customer_notes: customerNotes.trim() || null,
      };

      const res = await fetch("/api/custom-prints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.data?.request?.id) {
        throw new Error(data.error || "Failed to submit custom print request");
      }

      const requestId = data.data.request.id;

      // 2. Upload attached files sequentially or concurrently
      if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          setUploadStepStatus(
            `Uploading file ${i + 1} of ${files.length} (${file.name})...`
          );

          const formData = new FormData();
          formData.append("file", file);

          const uploadRes = await fetch(
            `/api/custom-prints/${requestId}/files`,
            {
              method: "POST",
              body: formData,
            }
          );

          const uploadData = await uploadRes.json();
          if (!uploadRes.ok || !uploadData.success) {
            console.warn(`File upload warning for ${file.name}:`, uploadData.error);
          }
        }
      }

      toast.success(t("customPrintApp.submitSuccessTitle"));

      // 3. Navigate to request details
      router.push(`/custom-prints/${requestId}`);
    } catch (err: unknown) {
      setErrors((prev) => ({
        ...prev,
        form:
          err instanceof Error ? err.message : "Error creating custom print request",
      }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
      setUploadStepStatus(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 text-left" noValidate>
      {errors.form && (
        <div
          role="alert"
          className="flex items-start gap-3 p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-xs sm:text-sm"
        >
          <AlertCircle className="size-5 shrink-0 mt-0.5" />
          <span>{errors.form}</span>
        </div>
      )}

      {/* Part Specifications Card */}
      <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 space-y-6 shadow-xs">
        <div>
          <h2 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="size-5 text-[#FF6B35]" />
            <span>Project Details</span>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Provide the design requirements and intended use for accurate slicing.
          </p>
        </div>

        {/* Title */}
        <Input
          label={t("customPrintApp.titleLabel")}
          placeholder={t("customPrintApp.titlePlaceholder")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isSubmitting}
        />

        {/* Description */}
        <div className="space-y-1.5">
          <label
            htmlFor="request-desc-textarea"
            className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {t("customPrintApp.descLabel")}{" "}
            <span className="text-[#FF6B35]">*</span>
          </label>
          <textarea
            id="request-desc-textarea"
            rows={4}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (errors.description) {
                setErrors((prev) => ({ ...prev, description: "" }));
              }
            }}
            placeholder={t("customPrintApp.descPlaceholder")}
            disabled={isSubmitting}
            className="w-full rounded-2xl border border-border/80 bg-card p-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 focus:outline-none transition-all resize-none shadow-xs"
          />
          {errors.description && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="size-3.5" />
              <span>{errors.description}</span>
            </p>
          )}
        </div>

        {/* Quantity, Material, Color */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label={t("customPrintApp.quantityLabel")}
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => {
              setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1));
              if (errors.quantity) setErrors((prev) => ({ ...prev, quantity: "" }));
            }}
            error={errors.quantity}
            required
            disabled={isSubmitting}
            iconLeft={<Hash className="size-4" />}
          />

          <Select
            label={t("customPrintApp.materialLabel")}
            value={preferredMaterial}
            onChange={(e) => setPreferredMaterial(e.target.value)}
            options={MATERIALS}
            disabled={isSubmitting}
          />

          <Select
            label={t("customPrintApp.colorLabel")}
            value={preferredColor}
            onChange={(e) => setPreferredColor(e.target.value)}
            options={COLORS}
            disabled={isSubmitting}
          />
        </div>

        {/* Reference URL */}
        <Input
          label={t("customPrintApp.referenceUrlLabel")}
          placeholder={t("customPrintApp.referenceUrlPlaceholder")}
          value={referenceUrl}
          onChange={(e) => {
            setReferenceUrl(e.target.value);
            if (errors.referenceUrl) {
              setErrors((prev) => ({ ...prev, referenceUrl: "" }));
            }
          }}
          error={errors.referenceUrl}
          disabled={isSubmitting}
          iconLeft={<LinkIcon className="size-4" />}
        />

        {/* Customer Notes */}
        <div className="space-y-1.5">
          <label
            htmlFor="request-notes-textarea"
            className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {t("customPrintApp.notesLabel")}
          </label>
          <textarea
            id="request-notes-textarea"
            rows={2}
            value={customerNotes}
            onChange={(e) => setCustomerNotes(e.target.value)}
            placeholder={t("customPrintApp.notesPlaceholder")}
            disabled={isSubmitting}
            className="w-full rounded-2xl border border-border/80 bg-card p-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 focus:outline-none transition-all resize-none shadow-xs"
          />
        </div>
      </div>

      {/* Files & Models Section */}
      <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 space-y-5 shadow-xs">
        <div>
          <h2 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Box className="size-5 text-[#FF6B35]" />
            <span>{t("customPrintApp.filesSectionTitle")}</span>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {t("customPrintApp.filesSectionDesc")}
          </p>
        </div>

        <FileUploader
          files={files}
          onFilesChange={(newFiles) => setFiles(newFiles)}
          maxFiles={6}
          disabled={isSubmitting}
        />
      </div>

      {/* Upload Progress feedback */}
      {isSubmitting && uploadStepStatus && (
        <div className="p-4 rounded-2xl border border-[#FF6B35]/30 bg-[#FF6B35]/10 flex items-center gap-3 text-xs sm:text-sm text-[#FF6B35] font-semibold animate-in fade-in">
          <Loader2 className="size-4 animate-spin shrink-0" />
          <span>{uploadStepStatus}</span>
        </div>
      )}

      {/* Submit Action */}
      <div className="flex items-center justify-end pt-4 border-t border-border/60">
        <Button
          type="submit"
          variant="default"
          size="lg"
          disabled={isSubmitting}
          iconLeft={
            isSubmitting ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <CheckCircle2 className="size-5" />
            )
          }
          className="w-full sm:w-auto font-bold h-12 px-8 shadow-sm"
        >
          {isSubmitting
            ? t("customPrintApp.submitting")
            : t("customPrintApp.submitButton")}
        </Button>
      </div>
    </form>
  );
}

