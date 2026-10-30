"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Plus,
  Edit,
  Eye,
  EyeOff,
  Package,
  Layers,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { AdminTableShell, PaginationMeta } from "../layout/admin-table";
import { ProductFormModal } from "./product-form-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

export function ProductsTable() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 15,
    total_items: 0,
    total_pages: 1,
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  // Fetch categories for filter dropdown & modal
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/categories");
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setCategories(json.data.categories || []);
        }
      }
    } catch {
      // Ignored
    }
  }, []);

  const fetchProducts = useCallback(
    async (pageToLoad = 1) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(pageToLoad));
        params.set("limit", String(pagination.limit));
        if (searchTerm.trim()) params.set("search", searchTerm.trim());
        if (selectedCategory) params.set("category_id", selectedCategory);
        if (activeFilter === "active") params.set("is_active", "true");
        if (activeFilter === "inactive") params.set("is_active", "false");

        const res = await fetch(`/api/admin/products?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load products");

        const json = await res.json();
        if (json.success && json.data) {
          setProducts(json.data.products || []);
          if (json.data.pagination) {
            setPagination(json.data.pagination);
          }
        }
      } catch (err) {
        console.error("Products load error:", err);
        toast.error("Error", "Could not load product catalog");
      } finally {
        setIsLoading(false);
      }
    },
    [searchTerm, selectedCategory, activeFilter, pagination.limit]
  );

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts(1);
  }, [fetchProducts]);

  // Toggle publish / active state
  const handleTogglePublish = async (prod: any) => {
    try {
      const res = await fetch(`/api/admin/products/${prod.id}/publish`, {
        method: "POST",
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        toast.error("Toggle failed", json.error || "Failed to update status");
        return;
      }

      toast.success(
        json.data.is_active ? "Product Published" : "Product Hidden",
        `${prod.name} is now ${json.data.is_active ? "visible" : "hidden"} in store.`
      );

      // Optimistic local update
      setProducts((prev) =>
        prev.map((p) =>
          p.id === prod.id ? { ...p, is_active: json.data.is_active } : p
        )
      );
    } catch {
      toast.error("Network Error", "Could not update publish state");
    }
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prod: any) => {
    setEditingProduct(prod);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <AdminTableShell
        title={t("admin.productsModule.title")}
        subtitle="Manage product listings, inventory quantities, and marketplace visibility"
        searchPlaceholder="Search product by title, slug, or material..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        onSearchSubmit={() => fetchProducts(1)}
        onRefresh={() => fetchProducts(pagination.page)}
        isLoading={isLoading}
        isEmpty={products.length === 0}
        emptyTitle="No products found"
        emptyDescription="Try adjusting your search criteria or add your first 3D printed model."
        pagination={pagination}
        onPageChange={(p) => fetchProducts(p)}
        filterSlot={
          <>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-9 px-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-[#FF6B35]"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="h-9 px-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-[#FF6B35]"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Hidden Only</option>
            </select>
          </>
        }
        actionSlot={
          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white text-xs h-9 shadow-sm"
          >
            <Plus className="size-3.5 me-1.5" />
            {t("admin.productsModule.addProduct")}
          </Button>
        }
      >
        <table className="w-full text-xs text-start">
          <thead className="bg-muted/40 text-muted-foreground font-mono text-[11px] uppercase tracking-wider border-b border-border/60">
            <tr>
              <th className="py-3 px-4 text-start font-semibold">
                {t("admin.tables.product")}
              </th>
              <th className="py-3 px-4 text-start font-semibold">
                {t("admin.tables.category") || "Category"}
              </th>
              <th className="py-3 px-4 text-start font-semibold">
                {t("admin.tables.price")}
              </th>
              <th className="py-3 px-4 text-start font-semibold">
                {t("admin.tables.stock")}
              </th>
              <th className="py-3 px-4 text-start font-semibold">
                {t("admin.tables.status")}
              </th>
              <th className="py-3 px-4 text-end font-semibold">
                {t("admin.tables.actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {products.map((prod) => {
              const primaryImg =
                prod.images?.find((img: any) => img.is_primary)?.image_url ||
                prod.images?.[0]?.image_url;

              return (
                <tr
                  key={prod.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  {/* Thumbnail & Title */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="size-11 rounded-xl border border-border bg-muted overflow-hidden shrink-0 flex items-center justify-center relative">
                        {primaryImg ? (
                          <img
                            src={primaryImg}
                            alt={prod.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="size-5 text-muted-foreground" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="font-bold text-foreground truncate max-w-[220px]">
                          {prod.name}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono truncate">
                          {prod.slug}
                        </div>
                        {prod.material && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-muted text-[10px] text-muted-foreground font-mono">
                            {prod.material}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-foreground">
                      {prod.category?.name || "Uncategorized"}
                    </span>
                  </td>

                  {/* Price */}
                  <td className="py-3 px-4 font-mono font-bold text-foreground">
                    {Number(prod.price).toFixed(2)} EGP
                  </td>

                  {/* Stock */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "size-2 rounded-full",
                          prod.stock > 10 && "bg-emerald-500",
                          prod.stock > 0 && prod.stock <= 10 && "bg-amber-500",
                          prod.stock <= 0 && "bg-red-500"
                        )}
                      />
                      <span className="font-mono font-bold text-foreground">
                        {prod.stock}
                      </span>
                      {prod.stock <= 0 && (
                        <span className="text-[10px] text-red-500 font-semibold">
                          Out
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Publish Status Toggle */}
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => handleTogglePublish(prod)}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold transition-all",
                        prod.is_active
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      {prod.is_active ? (
                        <>
                          <Eye className="size-3" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="size-3" />
                          <span>Hidden</span>
                        </>
                      )}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-end">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(prod)}
                        className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Edit className="size-3.5 me-1" />
                        Edit
                      </Button>
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <a
                          href={`/products/${prod.id}`}
                          target="_blank"
                          rel="noreferrer"
                          title="View on store"
                        >
                          <ExternalLink className="size-3.5" />
                        </a>
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </AdminTableShell>

      {/* Product Create/Edit Modal */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchProducts(pagination.page)}
        product={editingProduct}
        categories={categories}
      />
    </div>
  );
}

