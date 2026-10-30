"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Eye,
  ShoppingBag,
  CreditCard,
  Mail,
  Phone,
  Calendar,
} from "lucide-react";
import { AdminTableShell, PaginationMeta } from "../layout/admin-table";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useTranslation } from "@/lib/i18n/context";

export function CustomersTable() {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    total_items: 0,
    total_pages: 1,
  });

  const fetchCustomers = useCallback(
    async (pageToLoad = 1) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(pageToLoad));
        params.set("limit", String(pagination.limit));
        if (searchTerm.trim()) params.set("search", searchTerm.trim());

        const res = await fetch(`/api/admin/customers?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load customers");

        const json = await res.json();
        if (json.success && json.data) {
          setCustomers(json.data.customers || []);
          if (json.data.pagination) {
            setPagination(json.data.pagination);
          }
        }
      } catch (err) {
        toast.error("Error", "Could not load customer profiles");
      } finally {
        setIsLoading(false);
      }
    },
    [searchTerm, pagination.limit]
  );

  useEffect(() => {
    fetchCustomers(1);
  }, [fetchCustomers]);

  return (
    <div className="space-y-6">
      <AdminTableShell
        title={t("admin.customersModule.title")}
        subtitle="Customer contact profiles, lifetime order history, and account activity"
        searchPlaceholder={t("admin.customersModule.searchCustomer")}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        onSearchSubmit={() => fetchCustomers(1)}
        onRefresh={() => fetchCustomers(pagination.page)}
        isLoading={isLoading}
        isEmpty={customers.length === 0}
        emptyTitle="No customers found"
        emptyDescription="No registered profiles match your search."
        pagination={pagination}
        onPageChange={(p) => fetchCustomers(p)}
      >
        <table className="w-full text-xs text-start">
          <thead className="bg-muted/40 text-muted-foreground font-mono text-[11px] uppercase tracking-wider border-b border-border/60">
            <tr>
              <th className="py-3 px-4 text-start font-semibold">
                Customer Name
              </th>
              <th className="py-3 px-4 text-start font-semibold">
                Contact
              </th>
              <th className="py-3 px-4 text-center font-semibold">
                Orders
              </th>
              <th className="py-3 px-4 text-start font-semibold">
                Lifetime Spend
              </th>
              <th className="py-3 px-4 text-start font-semibold">
                Customer Since
              </th>
              <th className="py-3 px-4 text-end font-semibold">
                {t("admin.tables.actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {customers.map((c) => {
              const fullName =
                `${c.first_name || ""} ${c.last_name || ""}`.trim() ||
                "Registered Customer";

              const registeredDate = new Date(c.created_at).toLocaleDateString(
                undefined,
                {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }
              );

              return (
                <tr
                  key={c.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="py-3.5 px-4">
                    <Link
                      href={`/admin/customers/${c.id}`}
                      className="font-bold text-foreground hover:text-[#FF6B35] transition-colors"
                    >
                      {fullName}
                    </Link>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      UID: {c.id.slice(0, 8)}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="space-y-0.5 font-mono">
                      {c.phone && (
                        <div className="text-foreground">{c.phone}</div>
                      )}
                      {c.email && (
                        <div className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                          {c.email}
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-muted text-foreground">
                      {c.orders_count || 0}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                    {Number(c.total_spent || 0).toFixed(2)} EGP
                  </td>

                  <td className="py-3.5 px-4 text-muted-foreground font-mono">
                    {registeredDate}
                  </td>

                  <td className="py-3.5 px-4 text-end">
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs text-[#FF6B35] hover:bg-[#FF6B35]/10"
                    >
                      <Link href={`/admin/customers/${c.id}`}>
                        <Eye className="size-3.5 me-1" />
                        Profile
                      </Link>
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </AdminTableShell>
    </div>
  );
}

