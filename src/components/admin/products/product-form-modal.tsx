"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Upload, Loader2, Plus, Star, Trash2 } from "lucide-react";
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

// Mirrors the server-side upload validation in /api/admin/upload.
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

interface ImageEntry {
  key: string; // stable React key
  id?: string; // product_images.id for already-saved images
  url: string; // public URL (existing) or object URL (new preview)
  file?: File; // present only for newly selected, not-yet-uploaded files
  altText: string | null;
  isPrimary: boolean;
}

// Shape of an already-saved product image (product_images row) as returned by the
// admin products API. Used to type the edit-mode initialisation below.
interface ExistingProductImage {
  id: string | number;
  image_url: string;
  alt_text?: string | null;
  is_primary?: boolean | null;
  sort_order?: number | null;
}

// Revoke object URLs created for newly selected files (prevents memory leaks).
function revokeNewImageUrls(entries: ImageEntry[]) {
  entries.forEach((entry) => {
    if (entry.file) {
      try {
        URL.revokeObjectURL(entry.url);
      } catch {
        // ignore
      }
    }
  });
}

// Guarantee exactly one image is flagged primary (defaults to the first).
function enforceSinglePrimary(
  list: ImageEntry[],
  primaryKey?: string
): ImageEntry[] {
  if (!list.length) return list;
  const target =
    primaryKey ?? list.find((entry) => entry.isPrimary)?.key ?? list[0].key;
  return list.map((entry) => ({ ...entry, isPrimary: entry.key === target }));
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product?: any; // If present, edit mode
  categories: CategoryOption[];
  // Notifies the parent when a category is created inline so it appears immediately.
  onCategoryCreated?: (category: any) => void;
}

export function ProductFormModal({
  isOpen,
  onClose,
  onSuccess,
  product,
  categories,
  onCategoryCreated,
}: ProductFormModalProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  const [images, setImages] = useState<ImageEntry[]>([]);

  // Snapshot of the persisted image list (ordered ids + primary id) captured at init,
  // so we can skip ALL image writes when the admin only edits unrelated fields.
  const originalImagesRef = useRef<{ ids: string[]; primaryId: string | null }>({
    ids: [],
    primaryId: null,
  });
  // Live mirror of `images` for object-URL cleanup inside effects.
  const imagesRef = useRef<ImageEntry[]>([]);
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);
  // Revoke any pending object URLs on unmount.
  useEffect(() => {
    return () => revokeNewImageUrls(imagesRef.current);
  }, []);

  // Inline "quick create" category state (add a category without leaving the product form)
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // Keep the latest categories in a ref so the form-initialisation effect below does NOT
  // depend on the categories prop. Without this, appending a newly created category would
  // re-run the init effect and wipe the admin's in-progress form / category selection.
  const categoriesRef = useRef<CategoryOption[]>(categories);
  useEffect(() => {
    categoriesRef.current = categories;
  }, [categories]);

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

      // Revoke object URLs from previously loaded new images before re-initialising.
      revokeNewImageUrls(imagesRef.current);

      const existing: ExistingProductImage[] = Array.isArray(product.images)
        ? [...(product.images as ExistingProductImage[])].sort(
            (a, b) =>
              Number(Boolean(b.is_primary)) - Number(Boolean(a.is_primary)) ||
              (a.sort_order ?? 0) - (b.sort_order ?? 0)
          )
        : [];
      const hasPrimary = existing.some((img) => img.is_primary);
      const entries: ImageEntry[] = existing.map((img, index) => ({
        key: String(img.id),
        id: String(img.id),
        url: img.image_url,
        altText: img.alt_text ?? null,
        isPrimary: hasPrimary ? Boolean(img.is_primary) : index === 0,
      }));
      setImages(entries);
      originalImagesRef.current = {
        ids: entries.map((entry) => entry.id!).filter(Boolean),
        primaryId: entries.find((entry) => entry.isPrimary)?.id ?? null,
      };
    } else {
      setName("");
      setSlug("");
      setCategoryId(categoriesRef.current[0]?.id || "");
      setPrice("0");
      setStock("10");
      setMaterial("PLA");
      setColors("Black, White, Orange");
      setDescription("");
      setIsActive(true);
      setIsFeatured(false);
      revokeNewImageUrls(imagesRef.current);
      setImages([]);
      originalImagesRef.current = { ids: [], primaryId: null };
    }
  }, [product, isOpen]);

  // Validate + hold selected files locally; they are uploaded on save (with the product
  // id) so removing a preview before saving never leaves an orphaned file in Storage.
  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ""; // allow re-selecting the same file
    if (!files.length) return;

    const accepted: File[] = [];
    for (const file of files) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        toast.error(
          "Unsupported file type",
          `${file.name}: allowed types are JPEG, PNG, WebP, AVIF, GIF.`
        );
        continue;
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        toast.error(
          "File too large",
          `${file.name} exceeds the 5MB limit (${(file.size / (1024 * 1024)).toFixed(2)}MB).`
        );
        continue;
      }
      accepted.push(file);
    }
    if (!accepted.length) return;

    setImages((prev) => {
      const additions: ImageEntry[] = accepted.map((file, index) => ({
        key: `new-${Date.now()}-${index}-${file.name}`,
        url: URL.createObjectURL(file),
        file,
        altText: null,
        isPrimary: false,
      }));
      return enforceSinglePrimary([...prev, ...additions]);
    });
  };

  const setPrimaryImage = (key: string) => {
    setImages((prev) => enforceSinglePrimary(prev, key));
  };

  const removeImage = (key: string) => {
    setImages((prev) => {
      const target = prev.find((entry) => entry.key === key);
      if (target?.file) {
        try {
          URL.revokeObjectURL(target.url);
        } catch {
          // ignore
        }
      }
      const next = prev.filter((entry) => entry.key !== key);
      return next.length ? enforceSinglePrimary(next) : next;
    });
  };

  // Persist the image list for a saved product: delete removed existing images, upload
  // newly selected files (now that we have the product id) and attach them, then
  // normalise sort_order and the single primary flag. Skips ALL writes when the image
  // list is unchanged so editing unrelated fields never touches existing images.
  const persistImages = async (
    productId: string | undefined,
    fallbackAlt: string
  ): Promise<{ failures: number } | null> => {
    if (!productId) return null;

    const currentIds = images
      .filter((entry) => entry.id)
      .map((entry) => entry.id!);
    const currentPrimaryId =
      images.find((entry) => entry.isPrimary)?.id ?? null;
    const hasNewFiles = images.some((entry) => entry.file);
    const unchanged =
      !hasNewFiles &&
      currentIds.length === originalImagesRef.current.ids.length &&
      currentIds.every(
        (id, index) => id === originalImagesRef.current.ids[index]
      ) &&
      currentPrimaryId === originalImagesRef.current.primaryId;

    if (unchanged) return null;

    let failures = 0;

    // 1. Delete existing images the admin removed.
    const toDelete = originalImagesRef.current.ids.filter(
      (id) => !currentIds.includes(id)
    );
    for (const imageId of toDelete) {
      try {
        await fetch(`/api/admin/products/${productId}/images/${imageId}`, {
          method: "DELETE",
        });
      } catch {
        // Best-effort; non-fatal.
      }
    }

    // 2. Upload new files, then build the final ordered list (sort_order = index).
    const finalList: {
      id?: string;
      image_url: string;
      isPrimary: boolean;
      sort_order: number;
    }[] = [];

    for (let index = 0; index < images.length; index++) {
      const entry = images[index];
      if (entry.file) {
        try {
          const formData = new FormData();
          formData.append("file", entry.file);
          formData.append("product_id", productId);
          const upRes = await fetch("/api/admin/upload", {
            method: "POST",
            body: formData,
          });
          const upJson = await upRes.json();
          const url = upJson?.data?.public_url || upJson?.data?.url;
          if (!upRes.ok || !upJson?.success || !url) {
            failures++;
            continue;
          }
          finalList.push({
            image_url: url,
            isPrimary: entry.isPrimary,
            sort_order: index,
          });
        } catch {
          failures++;
        }
      } else {
        finalList.push({
          id: entry.id,
          image_url: entry.url,
          isPrimary: entry.isPrimary,
          sort_order: index,
        });
      }
    }

    // 3. Guarantee exactly one primary survives (promote first if the primary upload failed).
    if (finalList.length && !finalList.some((item) => item.isPrimary)) {
      finalList[0].isPrimary = true;
    }

    // 4. Write non-primary images first, primary last (POST/PATCH unmark others on primary).
    const ordered = [
      ...finalList.filter((item) => !item.isPrimary),
      ...finalList.filter((item) => item.isPrimary),
    ];

    for (const item of ordered) {
      try {
        if (item.id) {
          await fetch(`/api/admin/products/${productId}/images/${item.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sort_order: item.sort_order,
              is_primary: item.isPrimary,
            }),
          });
        } else {
          await fetch(`/api/admin/products/${productId}/images`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image_url: item.image_url,
              alt_text: fallbackAlt || null,
              is_primary: item.isPrimary,
              sort_order: item.sort_order,
            }),
          });
        }
      } catch {
        // Non-fatal association error.
      }
    }

    return { failures };
  };

  // Quick-create a category without leaving the product form. Reuses the existing
  // POST /api/admin/categories endpoint; on success the new category is pushed into the
  // parent list (so it appears in the dropdown immediately) and auto-selected.
  const handleCreateCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      toast.error("Validation error", "Category name is required");
      return;
    }

    setIsCreatingCategory(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed,
          is_active: true,
          sort_order: 0,
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        toast.error(
          "Could not create category",
          json?.error || `Request failed with status ${res.status}`
        );
        return;
      }

      const created = json.data?.category;
      if (created?.id) {
        onCategoryCreated?.(created);
        setCategoryId(created.id);
      }
      setNewCategoryName("");
      setIsAddingCategory(false);
      toast.success(
        "Category created",
        `${created?.name || trimmed} is now selectable.`
      );
    } catch {
      toast.error("Network error", "Could not create category");
    } finally {
      setIsCreatingCategory(false);
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

      // Both POST and PATCH return { data: { product } }. Read the id from there so a
      // newly created product's images attach correctly (old code read json.data.id).
      const productId: string | undefined =
        product?.id || json.data?.product?.id || json.data?.id;

      const imageResult = await persistImages(productId, name.trim());
      if (imageResult && imageResult.failures > 0) {
        toast.error(
          "Some images failed",
          `${imageResult.failures} image(s) could not be uploaded. The product was saved.`
        );
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

            {/* Inline quick-create so admins never have to leave the product form */}
            {isAddingCategory ? (
              <div className="flex items-center gap-2 pt-1">
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreateCategory();
                    }
                  }}
                  placeholder="New category name"
                  className="text-xs h-9"
                  autoFocus
                  disabled={isCreatingCategory}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCreateCategory}
                  loading={isCreatingCategory}
                  className="bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white text-xs h-9 shrink-0"
                >
                  Create
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsAddingCategory(false);
                    setNewCategoryName("");
                  }}
                  disabled={isCreatingCategory}
                  className="text-xs h-9 shrink-0"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingCategory(true)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#FF6B35] hover:underline"
              >
                <Plus className="size-3" />
                Add Category
              </button>
            )}
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

        {/* Images: multi-upload, previews, set-primary, remove */}
        <div className="space-y-2 pt-2 border-t border-border/80">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground block">
              {t("admin.productsModule.images")}
            </label>
            <span className="text-[10px] text-muted-foreground">
              {images.length} {images.length === 1 ? "image" : "images"}
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {images.map((entry) => (
              <div
                key={entry.key}
                className="relative aspect-square rounded-xl border border-border overflow-hidden bg-muted"
              >
                <img
                  src={entry.url}
                  alt={entry.altText || "Product image preview"}
                  className="w-full h-full object-cover"
                />
                {entry.isPrimary && (
                  <span className="absolute top-1 start-1 rounded-md bg-[#FF6B35] px-1.5 py-0.5 text-[9px] font-bold text-white shadow">
                    Primary
                  </span>
                )}
                <div className="absolute inset-x-1 bottom-1 flex items-center gap-1">
                  {!entry.isPrimary && (
                    <button
                      type="button"
                      onClick={() => setPrimaryImage(entry.key)}
                      title="Set as primary"
                      className="flex-1 inline-flex items-center justify-center gap-1 rounded-md bg-black/70 px-1 py-1 text-[9px] font-semibold text-white hover:bg-black/85"
                    >
                      <Star className="size-3" />
                      Primary
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(entry.key)}
                    title="Remove image"
                    className="inline-flex items-center justify-center rounded-md bg-red-600/90 p-1 text-white hover:bg-red-600"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              </div>
            ))}

            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border bg-muted/30 text-muted-foreground hover:bg-muted/60 transition-colors">
              <Upload className="size-5 text-[#FF6B35]" />
              <span className="px-1 text-center text-[10px] font-semibold">
                Add images
              </span>
              <input
                type="file"
                accept={ALLOWED_IMAGE_TYPES.join(",")}
                multiple
                onChange={handleFilesSelected}
                disabled={isSubmitting}
                className="hidden"
              />
            </label>
          </div>

          <p className="text-[10px] text-muted-foreground">
            JPEG, PNG, WebP, AVIF or GIF · up to 5MB each · select multiple. New
            images are uploaded when you save.
          </p>
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
