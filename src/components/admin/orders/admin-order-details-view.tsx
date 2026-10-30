"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShoppingBag,
  User,
  MapPin,
  CreditCard,
  Truck,
  MessageSquare,
  Clock,
  Edit,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Package,
} from "lucide-react";
import { OrderStatusModal } from "./order-status-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

interface AdminOrderDetailsViewProps {
  orderId: string;
}

export function AdminOrderDetailsView({ orderId }: AdminOrderDetailsViewProps) {
  const router = useRouter();
  const { t, isRTL } = useTranslation();
  const [order, setOrder] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  const fetchOrder = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      if (!res.ok) throw new Error("Order not found");
      const json = await res.json();
      if (json.success && json.data) {
        setOrder(json.data.order);
      }
    } catch (err) {
      toast.error("Error", "Could not load order details");
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleSendWhatsApp = async () => {
    if (!order) return;
    setIsSendingWhatsApp(true);
    try {
      const res = await fetch("/api/admin/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: order.id,
          message_type: "order_confirmation",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error("WhatsApp failed", json.error || "Failed to trigger WhatsApp message");
        return;
      }

      toast.success(
        t("admin.whatsappModule.sendSuccess"),
        `WhatsApp notification sent to ${order.customer_phone}`
      );
    } catch {
      toast.error("Network Error", "Could not connect to WhatsApp service");
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-muted rounded-xl w-48" />
        <div className="h-48 bg-muted rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-muted rounded-2xl" />
          <div className="h-64 bg-muted rounded-2xl" />
          <div className="h-64 bg-muted rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-12 text-center bg-card rounded-2xl border border-border">
        <h2 className="text-base font-bold text-foreground">Order Not Found</h2>
        <p className="text-xs text-muted-foreground mt-1">
          The requested order does not exist or has been removed.
        </p>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link href="/admin/orders">
            <ArrowLeft className="size-4 me-1.5" />
            Back to Orders
          </Link>
        </Button>
      </div>
    );
  }

  const BackIcon = isRTL ? ArrowLeft : ArrowLeft;

  return (
    <div className="space-y-6">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-9 px-2.5 text-xs"
          >
            <Link href="/admin/orders">
              <BackIcon className="size-4 me-1" />
              Orders
            </Link>
          </Button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-heading font-black tracking-tight text-foreground">
                Order #{order.order_number}
              </h1>
              <span
                className={cn(
                  "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase",
                  order.status === "delivered" &&
                    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
                  order.status === "shipped" &&
                    "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
                  (order.status === "processing" ||
                    order.status === "ready_to_ship" ||
                    order.status === "confirmed") &&
                    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
                  (order.status === "cancelled" ||
                    order.status === "rejected") &&
                    "bg-red-500/10 text-red-500 border border-red-500/20",
                  order.status === "pending_customer_confirmation" &&
                    "bg-muted text-muted-foreground"
                )}
              >
                {order.status.replace(/_/g, " ")}
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              Placed on {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSendWhatsApp}
            disabled={isSendingWhatsApp}
            className="text-xs h-9 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/30"
          >
            <MessageSquare className="size-3.5 me-1.5" />
            {isSendingWhatsApp ? "Sending..." : "Send WhatsApp"}
          </Button>

          <Button
            size="sm"
            onClick={() => setIsStatusModalOpen(true)}
            className="bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white text-xs h-9 shadow-sm"
          >
            <Edit className="size-3.5 me-1.5" />
            {t("admin.ordersModule.updateStatus")}
          </Button>
        </div>
      </div>

      {/* Main Grid: Details (Left 2 cols) & Logistics / Address (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Items Table + Pricing */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items Snapshot Card */}
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-border/80">
              <h2 className="text-sm font-heading font-bold text-foreground">
                {t("admin.ordersModule.itemsSnapshot")}
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead className="bg-muted/40 text-muted-foreground font-mono text-[11px] uppercase tracking-wider border-b border-border/60">
                  <tr>
                    <th className="py-3 px-4 text-start font-semibold">
                      Product
                    </th>
                    <th className="py-3 px-4 text-start font-semibold">
                      Color
                    </th>
                    <th className="py-3 px-4 text-center font-semibold">
                      Quantity
                    </th>
                    <th className="py-3 px-4 text-end font-semibold">
                      Unit Price
                    </th>
                    <th className="py-3 px-4 text-end font-semibold">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {order.items?.map((item: any) => (
                    <tr key={item.id} className="hover:bg-muted/20">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-lg border border-border bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                            {item.product_image_url ? (
                              <img
                                src={item.product_image_url}
                                alt={item.product_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="size-4 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-foreground block">
                              {item.product_name}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              ID: {item.product_id?.slice(0, 8)}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        {item.color || "Standard"}
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold text-foreground">
                        {item.quantity}
                      </td>

                      <td className="py-3.5 px-4 text-end font-mono text-muted-foreground">
                        {Number(item.unit_price).toFixed(2)} EGP
                      </td>

                      <td className="py-3.5 px-4 text-end font-mono font-bold text-foreground">
                        {Number(item.line_total).toFixed(2)} EGP
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Subtotal & Total Financial Summary */}
            <div className="p-4 sm:p-5 bg-muted/20 border-t border-border/80 flex flex-col items-end gap-1.5 text-xs font-mono">
              <div className="flex justify-between w-64 text-muted-foreground">
                <span>{t("admin.ordersModule.subtotal")}:</span>
                <span>{Number(order.subtotal || 0).toFixed(2)} EGP</span>
              </div>
              <div className="flex justify-between w-64 text-muted-foreground">
                <span>{t("admin.ordersModule.shippingFee")}:</span>
                <span>{Number(order.shipping_fee || 0).toFixed(2)} EGP</span>
              </div>
              {Number(order.discount_amount || 0) > 0 && (
                <div className="flex justify-between w-64 text-emerald-600">
                  <span>Discount:</span>
                  <span>-{Number(order.discount_amount).toFixed(2)} EGP</span>
                </div>
              )}
              <div className="flex justify-between w-64 font-bold text-sm text-foreground pt-2 border-t border-border/80">
                <span>{t("admin.ordersModule.total")}:</span>
                <span className="text-[#FF6B35]">
                  {Number(order.total).toFixed(2)} EGP
                </span>
              </div>
            </div>
          </div>

          {/* Fulfillment & Shipping Timeline */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-heading font-bold text-foreground flex items-center gap-2">
              <Truck className="size-4 text-[#FF6B35]" />
              <span>{t("admin.ordersModule.timeline")}</span>
            </h2>

            {order.carrier && (
              <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs flex items-center justify-between font-mono">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase">
                    Carrier / Logistics Partner
                  </span>
                  <span className="font-bold text-foreground">
                    {order.carrier}
                  </span>
                </div>
                {order.tracking_number && (
                  <div className="text-end">
                    <span className="text-muted-foreground block text-[10px] uppercase">
                      Tracking Code
                    </span>
                    <span className="font-bold text-[#FF6B35]">
                      {order.tracking_number}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3 pt-2">
              {(!order.shipping_events || order.shipping_events.length === 0) ? (
                <p className="text-xs text-muted-foreground">
                  No fulfillment events logged yet. Status transitions will appear here.
                </p>
              ) : (
                order.shipping_events.map((ev: any, idx: number) => (
                  <div
                    key={ev.id || idx}
                    className="flex items-start gap-3 text-xs relative"
                  >
                    <div className="size-2 rounded-full bg-[#FF6B35] mt-1 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground uppercase font-mono">
                          {ev.status?.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {new Date(ev.event_time || ev.created_at).toLocaleString()}
                        </span>
                      </div>
                      {ev.description && (
                        <p className="text-muted-foreground mt-0.5">
                          {ev.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Customer Info & Shipping Destination */}
        <div className="space-y-6">
          {/* Customer Details Card */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-heading font-bold text-foreground flex items-center gap-2">
              <User className="size-4 text-[#FF6B35]" />
              <span>{t("admin.ordersModule.customerDetails")}</span>
            </h2>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[10px] font-mono text-muted-foreground uppercase block">
                  Name
                </span>
                <span className="font-bold text-foreground">
                  {order.customer_first_name} {order.customer_last_name}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-mono text-muted-foreground uppercase block">
                  Phone
                </span>
                <a
                  href={`tel:${order.customer_phone}`}
                  className="font-mono text-foreground hover:text-[#FF6B35] underline"
                >
                  {order.customer_phone}
                </a>
              </div>

              {order.customer_email && (
                <div>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase block">
                    Email
                  </span>
                  <a
                    href={`mailto:${order.customer_email}`}
                    className="font-mono text-foreground hover:text-[#FF6B35] underline truncate block"
                  >
                    {order.customer_email}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Address Card */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-heading font-bold text-foreground flex items-center gap-2">
              <MapPin className="size-4 text-[#FF6B35]" />
              <span>{t("admin.ordersModule.shippingAddress")}</span>
            </h2>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[10px] font-mono text-muted-foreground uppercase block">
                  Governorate / City
                </span>
                <span className="font-bold text-foreground">
                  {order.shipping_governorate}, {order.shipping_region}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-mono text-muted-foreground uppercase block">
                  Street Address
                </span>
                <span className="text-foreground">
                  {order.shipping_street_address}
                </span>
              </div>

              {(order.shipping_building || order.shipping_apartment) && (
                <div>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase block">
                    Building / Apt
                  </span>
                  <span className="text-foreground">
                    Bldg {order.shipping_building || "—"}, Floor{" "}
                    {order.shipping_floor || "—"}, Apt{" "}
                    {order.shipping_apartment || "—"}
                  </span>
                </div>
              )}

              {order.shipping_notes && (
                <div className="p-2.5 rounded-xl bg-muted/50 border border-border text-[11px] text-muted-foreground">
                  <span className="font-bold block text-foreground">
                    Delivery Notes:
                  </span>
                  {order.shipping_notes}
                </div>
              )}
            </div>
          </div>

          {/* Payment Card */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-heading font-bold text-foreground flex items-center gap-2">
              <CreditCard className="size-4 text-[#FF6B35]" />
              <span>{t("admin.ordersModule.paymentDetails")}</span>
            </h2>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Method:</span>
                <span className="font-mono font-bold text-foreground uppercase">
                  {order.payment_method}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status:</span>
                <span
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase",
                    order.payment_status === "paid" &&
                      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                    order.payment_status === "awaiting_verification" &&
                      "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                    order.payment_status === "pending" &&
                      "bg-muted text-muted-foreground"
                  )}
                >
                  {order.payment_status.replace(/_/g, " ")}
                </span>
              </div>

              {order.payment_method !== "cod" && (
                <div className="pt-2">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full text-xs h-8"
                  >
                    <Link href={`/admin/payments?order_id=${order.id}`}>
                      View Associated Payment
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      <OrderStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onSuccess={fetchOrder}
        order={order}
      />
    </div>
  );
}

