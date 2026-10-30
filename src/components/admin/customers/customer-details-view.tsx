"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  ShoppingBag,
  MapPin,
  Calendar,
  CreditCard,
  Mail,
  Phone,
  ExternalLink,
} from "lucide-react";
import { AdminMetricCard } from "../layout/admin-metric-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

interface CustomerDetailsViewProps {
  customerId: string;
}

export function CustomerDetailsView({ customerId }: CustomerDetailsViewProps) {
  const { t } = useTranslation();
  const [customer, setCustomer] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCustomer = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`);
      if (!res.ok) throw new Error("Customer not found");
      const json = await res.json();
      if (json.success && json.data) {
        setCustomer(json.data.customer);
      }
    } catch {
      toast.error("Error", "Could not load customer details");
    } finally {
      setIsLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-muted rounded-xl w-48" />
        <div className="h-64 bg-muted rounded-2xl" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-12 text-center bg-card rounded-2xl border border-border">
        <h2 className="text-base font-bold text-foreground">
          Customer Not Found
        </h2>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link href="/admin/customers">
            <ArrowLeft className="size-4 me-1.5" />
            Back to Customers
          </Link>
        </Button>
      </div>
    );
  }

  const fullName =
    `${customer.first_name || ""} ${customer.last_name || ""}`.trim() ||
    "Registered Customer";

  const orders = customer.recent_orders || [];
  const totalSpent = orders.reduce(
    (sum: number, o: any) => sum + Number(o.total || 0),
    0
  );
  const avgOrderValue = orders.length > 0 ? totalSpent / orders.length : 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-9 px-2.5 text-xs"
        >
          <Link href="/admin/customers">
            <ArrowLeft className="size-4 me-1" />
            Customers
          </Link>
        </Button>

        <div>
          <h1 className="text-xl sm:text-2xl font-heading font-black tracking-tight text-foreground">
            {fullName}
          </h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            Customer ID: {customer.id} • Registered{" "}
            {new Date(customer.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminMetricCard
          title="Total Lifetime Spend"
          value={`${totalSpent.toFixed(2)} EGP`}
          subtitle="Orders placed to date"
          icon={CreditCard}
        />

        <AdminMetricCard
          title="Orders Count"
          value={orders.length}
          subtitle="Recorded transactions"
          icon={ShoppingBag}
        />

        <AdminMetricCard
          title="Average Order Value"
          value={`${avgOrderValue.toFixed(2)} EGP`}
          subtitle="Per finalized order"
          icon={User}
        />
      </div>

      {/* Profile & Addresses Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Info Card */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-heading font-bold text-foreground flex items-center gap-2">
            <User className="size-4 text-[#FF6B35]" />
            <span>{t("admin.customersModule.contact")}</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-[10px] font-mono text-muted-foreground uppercase block">
                Full Name
              </span>
              <span className="font-bold text-foreground text-sm">
                {fullName}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-mono text-muted-foreground uppercase block">
                Phone Number
              </span>
              {customer.phone ? (
                <a
                  href={`tel:${customer.phone}`}
                  className="font-mono text-foreground hover:text-[#FF6B35] underline"
                >
                  {customer.phone}
                </a>
              ) : (
                <span className="text-muted-foreground font-mono">
                  Not registered
                </span>
              )}
            </div>

            <div>
              <span className="text-[10px] font-mono text-muted-foreground uppercase block">
                Email Address
              </span>
              {customer.email ? (
                <a
                  href={`mailto:${customer.email}`}
                  className="font-mono text-foreground hover:text-[#FF6B35] underline truncate block"
                >
                  {customer.email}
                </a>
              ) : (
                <span className="text-muted-foreground font-mono">
                  Not registered
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Saved Addresses List (Right 2 cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-heading font-bold text-foreground flex items-center gap-2">
            <MapPin className="size-4 text-[#FF6B35]" />
            <span>{t("admin.customersModule.savedAddresses")}</span>
          </h2>

          {(!customer.addresses || customer.addresses.length === 0) ? (
            <p className="text-xs text-muted-foreground py-4">
              No saved delivery addresses on file for this customer.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {customer.addresses.map((addr: any) => (
                <div
                  key={addr.id}
                  className="p-3.5 rounded-xl border border-border bg-muted/20 text-xs space-y-1 relative"
                >
                  {addr.is_default && (
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FF6B35]/10 text-[#FF6B35] mb-1">
                      Default Delivery Address
                    </span>
                  )}
                  <p className="font-bold text-foreground">
                    {addr.first_name} {addr.last_name} ({addr.phone})
                  </p>
                  <p className="text-muted-foreground">
                    {addr.governorate}, {addr.region}
                  </p>
                  <p className="text-muted-foreground">
                    {addr.street_address}
                    {addr.building ? `, Bldg ${addr.building}` : ""}
                    {addr.apartment ? `, Apt ${addr.apartment}` : ""}
                  </p>
                  {addr.notes && (
                    <p className="text-[11px] text-muted-foreground/80 italic pt-1">
                      Note: {addr.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Customer Orders History */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border/80">
          <h2 className="text-sm font-heading font-bold text-foreground flex items-center gap-2">
            <ShoppingBag className="size-4 text-[#FF6B35]" />
            <span>{t("admin.customersModule.orderHistory")}</span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-muted/40 text-muted-foreground font-mono text-[11px] uppercase tracking-wider border-b border-border/60">
              <tr>
                <th className="py-3 px-4 text-start font-semibold">
                  Order #
                </th>
                <th className="py-3 px-4 text-start font-semibold">
                  Date
                </th>
                <th className="py-3 px-4 text-start font-semibold">
                  Method
                </th>
                <th className="py-3 px-4 text-start font-semibold">
                  Total
                </th>
                <th className="py-3 px-4 text-start font-semibold">
                  Payment Status
                </th>
                <th className="py-3 px-4 text-start font-semibold">
                  Order Status
                </th>
                <th className="py-3 px-4 text-end font-semibold">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 text-center text-muted-foreground"
                  >
                    {t("admin.customersModule.noOrdersYet")}
                  </td>
                </tr>
              ) : (
                orders.map((ord: any) => (
                  <tr
                    key={ord.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                      #{ord.order_number}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-muted-foreground">
                      {new Date(ord.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono uppercase text-muted-foreground">
                      {ord.payment_method}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                      {Number(ord.total).toFixed(2)} EGP
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase bg-muted text-foreground">
                        {ord.payment_status?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase bg-muted text-foreground">
                        {ord.status?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-end">
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-[#FF6B35] hover:bg-[#FF6B35]/10"
                      >
                        <Link href={`/admin/orders/${ord.id}`}>
                          View Order
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

