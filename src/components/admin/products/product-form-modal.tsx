"use client";

import React, { useState, useEffect } from "react";
import { X, Upload, Loader2, Image as ImageIcon } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { useTranslation } from "@/lib/i18n/context";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product?: any; // If present, edit mode
  categories: CategoryOption[];
}

export function ProductFormModal({
  isOpen,
  onClose,
  onSuccess,
  product,
  categories,
}: ProductFormModalProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [material, setMaterial] = useState("PLA");
  const [colors, setColors] = useState("Black, White, Orange");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    if (product) {
      setName(product.name || "");
      setSlug(product.slug || "");
      setCategoryId(product.category_id || product.category?.id || "");
      setPrice(product.price ? String(product.price) : "0");
      setStock(product.stock !== undefined ? String(product.stock) : "0");
      setMaterial(product.material || "PLA");
      setColors(
        Array.isArray(product.available_colors)
          ? product.available_colors.join(", ")
          : ""
      );
      setDescription(product.description || "");
      setIsActive(product.is_active !== false);
      setIsFeatured(Boolean(product.is_featured));
      const primaryImage =
        product.images?.find((img: any) => img.is_primary)?.image_url ||
        product.images?.[0]?.image_url ||
        "";
      setImageUrl(primaryImage);
    } else {
      setName("");
      setSlug("");
      setCategoryId(categories[0]?.id || "");
      setPrice("0");
      setStock("10");
      setMaterial("PLA");
      setColors("Black, White, Orange");
      setDescription("");
      setIsActive(true);
      setIsFeatured(false);
      setImageUrl("");
    }
  }, [product, categories, isOpen]);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (product?.id) {
        formData.append("product_id", product.id);
      }

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error("Upload failed", json.error || "Could not upload image");
        return;
      }

      setImageUrl(json.data.url);
      toast.success("Image uploaded", "Image ready to attach to product");
    } catch (err) {
      toast.error("Upload error", "Failed to upload image file");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Validation error", "Product name is required");
      return;
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      toast.error("Validation error", "Please enter a valid price");
      return;
    }

    const parsedStock = parseInt(stock, 10);
    if (isNaN(parsedStock) || parsedStock < 0) {
      toast.error("Validation error", "Please enter a valid stock quantity");
      return;
    }

    const colorsArray = colors
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    setIsSubmitting(true);
    try {
      const payload: any = {
        name: name.trim(),
        price: parsedPrice,
        stock: parsedStock,
        material: material.trim() || null,
        available_colors: colorsArray,
        description: description.trim() || null,
        is_active: isActive,
        is_featured: isFeatured,
      };

      if (slug.trim()) payload.slug = slug.trim().toLowerCase();
      if (categoryId) payload.category_id = categoryId;

      let res;
      let targetProductId = product?.id;

      if (product) {
        // Update existing product
        res = await fetch(`/api/admin/products/${product.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new product
        res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error("Save failed", json.error || "Could not save product");
        return;
      }

      if (!targetProductId && json.data?.id) {
        targetProductId = json.data.id;
      }

      // If we uploaded a new image URL, attach it as primary product image
      if (imageUrl && targetProductId) {
        try {
          await fetch(`/api/admin/products/${targetProductId}/images`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image_url: imageUrl,
              alt_text: name,
              is_primary: true,
              sort_order: 0,
            }),
          });
        } catch {
          // Non-fatal image association
        }
      }

      toast.success(
        product ? "Product updated" : "Product created",
        `${name} saved successfully.`
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
        product
          ? t("admin.productsModule.editProduct")
          : t("admin.productsModule.addProduct")
      }
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Name */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-foreground">
              {t("admin.productsModule.productName")} *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Voron 2.4 StealthBurner Toolhead"
              required
              className="text-xs"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              {t("admin.productsModule.category")}
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-[#FF6B35]"
            >
              <option value="">No Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Slug (Optional, auto-generated)
            </label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="voron-24-stealthburner"
              className="text-xs font-mono"
            />
          </div>

          {/* Price */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              {t("admin.productsModule.price")} *
            </label>
            <Input
              type="number"
              step="0.5"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              className="text-xs font-mono"
            />
          </div>

          {/* Stock */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              {t("admin.productsModule.stock")} *
            </label>
            <Input
              type="number"
              step="1"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
              className="text-xs font-mono"
            />
          </div>

          {/* Material */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              {t("admin.productsModule.material")}
            </label>
            <Input
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              placeholder="PETG, ABS, Nylon-CF, Resin"
              className="text-xs"
            />
          </div>

          {/* Colors */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              {t("admin.productsModule.colors")}
            </label>
            <Input
              value={colors}
              onChange={(e) => setColors(e.target.value)}
              placeholder="Black, Stealth Grey, Orange"
              className="text-xs"
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            {t("admin.productsModule.description")}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Detailed industrial specifications, tolerances, infill, and usage instructions..."
            className="w-full p-3 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-[#FF6B35] resize-y"
          />
        </div>

        {/* Image Attachment & Preview */}
        <div className="space-y-2 pt-2 border-t border-border/80">
          <label className="text-xs font-semibold text-foreground block">
            {t("admin.productsModule.images")}
          </label>
          <div className="flex items-center gap-4">
            {imageUrl ? (
              <div className="relative size-16 rounded-xl border border-border overflow-hidden bg-muted shrink-0">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="size-16 rounded-xl border border-dashed border-border flex items-center justify-center text-muted-foreground bg-muted/30 shrink-0">
                <ImageIcon className="size-6" />
              </div>
            )}

            <div className="flex-1 space-y-1">
              <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-semibold cursor-pointer hover:bg-muted transition-colors">
                {isUploadingImage ? (
                  <Loader2 className="size-3.5 animate-spin text-[#FF6B35]" />
                ) : (
                  <Upload className="size-3.5 text-[#FF6B35]" />
                )}
                <span>
                  {isUploadingImage ? "Uploading..." : "Upload Cover Image"}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageFileChange}
                  disabled={isUploadingImage}
                  className="hidden"
                />
              </label>
              {imageUrl && (
                <p className="text-[10px] text-muted-foreground truncate font-mono">
                  {imageUrl}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-6 pt-3 border-t border-border/80 text-xs">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded text-[#FF6B35] focus:ring-[#FF6B35]"
            />
            <span className="font-semibold text-foreground">
              {t("admin.productsModule.active")}
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="rounded text-[#FF6B35] focus:ring-[#FF6B35]"
            />
            <span className="font-semibold text-foreground">
              {t("admin.productsModule.featured")}
            </span>
          </label>
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
            {t("admin.productsModule.saveProduct")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
