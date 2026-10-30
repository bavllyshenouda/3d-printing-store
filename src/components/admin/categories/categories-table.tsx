"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Edit,
  Trash2,
  FolderTree,
  Tag,
  Eye,
  EyeOff,
  Check,
} from "lucide-react";
import { AdminTableShell } from "../layout/admin-table";
import { CategoryFormModal } from "./category-form-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

export function CategoriesTable() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);

  // Delete confirmation
  const [categoryToDelete, setCategoryToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      if (!res.ok) throw new Error("Failed to load categories");
      const json = await res.json();
      if (json.success) {
        setCategories(json.data.categories || []);
      }
    } catch (err) {
      toast.error("Error", "Could not load categories list");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const filteredCategories = categories.filter((c) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.name?.toLowerCase().includes(term) ||
      c.slug?.toLowerCase().includes(term) ||
      c.description?.toLowerCase().includes(term)
    );
  });

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/categories/${categoryToDelete.id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        toast.error("Delete failed", json.error || "Could not delete category");
        return;
      }

      toast.success(
        "Category Deleted",
        `${categoryToDelete.name} was removed.`
      );
      setCategoryToDelete(null);
      fetchCategories();
    } catch {
      toast.error("Network Error", "Could not complete delete operation");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminTableShell
        title={t("admin.categoriesModule.title")}
        subtitle="Manage product categories, hierarchy, and navigation taxonomy"
        searchPlaceholder="Search category name or slug..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        onRefresh={fetchCategories}
        isLoading={isLoading}
        isEmpty={filteredCategories.length === 0}
        emptyTitle="No categories found"
        emptyDescription="Create your first catalog category to organize 3D printing products."
        actionSlot={
          <Button
            size="sm"
            onClick={() => {
              setEditingCategory(null);
              setIsModalOpen(true);
            }}
            className="bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white text-xs h-9 shadow-sm"
          >
            <Plus className="size-3.5 me-1.5" />
            {t("admin.categoriesModule.addCategory")}
          </Button>
        }
      >
        <table className="w-full text-xs text-start">
          <thead className="bg-muted/40 text-muted-foreground font-mono text-[11px] uppercase tracking-wider border-b border-border/60">
            <tr>
              <th className="py-3 px-4 text-start font-semibold">
                Category
              </th>
              <th className="py-3 px-4 text-start font-semibold">
                Slug
              </th>
              <th className="py-3 px-4 text-start font-semibold">
                Description
              </th>
              <th className="py-3 px-4 text-center font-semibold">
                Order
              </th>
              <th className="py-3 px-4 text-start font-semibold">
                Status
              </th>
              <th className="py-3 px-4 text-end font-semibold">
                {t("admin.tables.actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filteredCategories.map((cat) => (
              <tr
                key={cat.id}
                className="hover:bg-muted/30 transition-colors"
              >
                <td className="py-3.5 px-4 font-bold text-foreground">
                  <div className="flex items-center gap-2">
                    <FolderTree className="size-4 text-[#FF6B35] shrink-0" />
                    <span>{cat.name}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 font-mono text-muted-foreground">
                  {cat.slug}
                </td>
                <td className="py-3.5 px-4 text-muted-foreground max-w-xs truncate">
                  {cat.description || "—"}
                </td>
                <td className="py-3.5 px-4 text-center font-mono font-bold text-foreground">
                  {cat.sort_order}
                </td>
                <td className="py-3.5 px-4">
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold",
                      cat.is_active
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {cat.is_active ? "Active" : "Hidden"}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-end">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingCategory(cat);
                        setIsModalOpen(true);
                      }}
                      className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Edit className="size-3.5 me-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCategoryToDelete(cat)}
                      className="h-8 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTableShell>

      {/* Category Create/Edit Modal */}
      <CategoryFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchCategories}
        category={editingCategory}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(categoryToDelete)}
        onClose={() => setCategoryToDelete(null)}
        title="Delete Category"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            {t("admin.categoriesModule.deleteConfirm")}
          </p>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/80">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCategoryToDelete(null)}
              disabled={isDeleting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white text-xs"
            >
              {isDeleting ? "Deleting..." : "Confirm Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
