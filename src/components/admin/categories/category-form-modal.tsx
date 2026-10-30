"use client";

import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { useTranslation } from "@/lib/i18n/context";

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category?: any; // If present, edit mode
}

export function CategoryFormModal({
  isOpen,
  onClose,
  onSuccess,
  category,
}: CategoryFormModalProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (category) {
      setName(category.name || "");
      setSlug(category.slug || "");
      setDescription(category.description || "");
      setSortOrder(
        category.sort_order !== undefined ? String(category.sort_order) : "0"
      );
      setIsActive(category.is_active !== false);
    } else {
      setName("");
      setSlug("");
      setDescription("");
      setSortOrder("0");
      setIsActive(true);
    }
  }, [category, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Validation error", "Category name is required");
      return;
    }

    const parsedSort = parseInt(sortOrder, 10);

    setIsSubmitting(true);
    try {
      const payload: any = {
        name: name.trim(),
        description: description.trim() || null,
        sort_order: isNaN(parsedSort) ? 0 : parsedSort,
        is_active: isActive,
      };

      if (slug.trim()) {
        payload.slug = slug.trim().toLowerCase();
      }

      let res;
      if (category) {
        res = await fetch(`/api/admin/categories/${category.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error("Save failed", json.error || "Could not save category");
        return;
      }

      toast.success(
        category ? "Category updated" : "Category created",
        `${name} was saved successfully.`
      );
      onSuccess();
      onClose();
    } catch (err) {
      toast.error("Operation failed", "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={
        category
          ? t("admin.categoriesModule.editCategory")
          : t("admin.categoriesModule.addCategory")
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            {t("admin.categoriesModule.categoryName")} *
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Mechanical & Motion Components"
            required
            className="text-xs"
          />
        </div>

        {/* Slug */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            {t("admin.categoriesModule.slug")}
          </label>
          <Input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="e.g. mechanical-motion-parts"
            className="text-xs font-mono"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            {t("admin.categoriesModule.description")}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Short description for SEO and catalog navigation..."
            className="w-full p-3 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-[#FF6B35] resize-y"
          />
        </div>

        {/* Sort Order & Active */}
        <div className="grid grid-cols-2 gap-4 items-center pt-2 border-t border-border/80">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              {t("admin.categoriesModule.sortOrder")}
            </label>
            <Input
              type="number"
              min="0"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="text-xs font-mono"
            />
          </div>

          <div className="pt-5">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded text-[#FF6B35] focus:ring-[#FF6B35]"
              />
              <span>{t("admin.categoriesModule.active")}</span>
            </label>
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
            {t("admin.categoriesModule.saveCategory")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
