"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { toast } from "@/components/ui/toast";
import { useTranslation } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";

export interface CartItemProduct {
  id: string;
  name: string;
  slug: string;
  material: string | null;
  available_stock: number;
  is_active: boolean;
  primary_image: string | null;
}

export interface CartItem {
  id: string;
  product_id: string;
  color: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  is_available: boolean;
  unavailable_reason: string | null;
  created_at: string;
  updated_at: string;
  product: CartItemProduct | null;
}

export interface CartSummary {
  subtotal: number;
  total_items: number;
  has_unavailable_items: boolean;
}

export interface CartContextValue {
  items: CartItem[];
  summary: CartSummary;
  isLoading: boolean;
  error: string | null;
  isDrawerOpen: boolean;
  updatingItemIds: Set<string>;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  refreshCart: () => Promise<void>;
  addItem: (
    productId: string,
    color: string,
    quantity?: number
  ) => Promise<{ success: boolean; error?: string }>;
  updateQuantity: (itemId: string, newQuantity: number) => Promise<boolean>;
  removeItem: (itemId: string) => Promise<boolean>;
}

const defaultSummary: CartSummary = {
  subtotal: 0,
  total_items: 0,
  has_unavailable_items: false,
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [summary, setSummary] = useState<CartSummary>(defaultSummary);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [updatingItemIds, setUpdatingItemIds] = useState<Set<string>>(new Set());
  const pendingRequestsRef = useRef<Set<string>>(new Set());

  const { t } = useTranslation();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  // Mirror of the current user id, used to discard stale in-flight cart responses after
  // a logout or account switch so the previous user's cart can never be restored.
  const currentUserIdRef = useRef<string | null>(userId);

  // When the authenticated user changes (login, logout, account switch) reset the cart
  // DURING render, so the previous user's items vanish before the browser paints -- no
  // stale flash in the header count, mini-cart or cart page. This is React's recommended
  // "adjust state when a value changes" pattern (guard + setState while rendering).
  const [trackedUserId, setTrackedUserId] = useState<string | null>(userId);
  if (userId !== trackedUserId) {
    setTrackedUserId(userId);
    setItems([]);
    setSummary(defaultSummary);
    setError(null);
    setIsLoading(true);
  }

  // Helper to recompute local summary optimistically
  const computeSummary = (cartItems: CartItem[]): CartSummary => {
    let subtotal = 0;
    let totalItems = 0;
    let hasUnavailable = false;

    for (const item of cartItems) {
      if (item.is_available) {
        subtotal += item.unit_price * item.quantity;
        totalItems += item.quantity;
      } else {
        hasUnavailable = true;
      }
    }

    return {
      subtotal: Number(subtotal.toFixed(2)),
      total_items: totalItems,
      has_unavailable_items: hasUnavailable,
    };
  };

  // Fetch cart data from authoritative backend.
  // A request token (the user id at call time) guards against stale responses: if the
  // authenticated user changed (logout / account switch) while this request was in
  // flight, its result is discarded so it cannot restore the previous user's cart.
  const fetchCart = useCallback(async () => {
    const requestUserId = currentUserIdRef.current;
    try {
      const res = await fetch("/api/cart");

      if (currentUserIdRef.current !== requestUserId) return;

      if (res.status === 401) {
        // Customer unauthenticated: clear cart
        setItems([]);
        setSummary(defaultSummary);
        setError(null);
        return;
      }

      const json = await res.json();

      if (currentUserIdRef.current !== requestUserId) return;

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to fetch cart");
      }

      setItems(json.data.items || []);
      setSummary(json.data.summary || defaultSummary);
      setError(null);
    } catch (err) {
      if (currentUserIdRef.current !== requestUserId) return;
      console.error("Cart retrieval failure:", err);
      setError(err instanceof Error ? err.message : "Error fetching cart");
    } finally {
      if (currentUserIdRef.current === requestUserId) {
        setIsLoading(false);
      }
    }
  }, []);

  // (Re)load the cart whenever the authenticated user changes. The render-phase reset
  // above already cleared the previous user's items; here we sync the request token and
  // fetch the new user's cart (guests get an empty cart via the 401 path).
  useEffect(() => {
    currentUserIdRef.current = userId;
    fetchCart();
  }, [userId, fetchCart]);

  // Listen for cart mutations dispatched elsewhere in the app.
  useEffect(() => {
    const handleCartUpdated = () => {
      fetchCart();
    };

    window.addEventListener("cart-updated", handleCartUpdated);
    return () => window.removeEventListener("cart-updated", handleCartUpdated);
  }, [fetchCart]);

  // Drawer controls
  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const toggleDrawer = useCallback(
    () => setIsDrawerOpen((prev) => !prev),
    []
  );

  // Add Item
  const addItem = async (
    productId: string,
    color: string,
    quantity = 1
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, color, quantity }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        return {
          success: false,
          error: json.error || "Failed to add item to cart",
        };
      }

      await fetchCart();
      window.dispatchEvent(new CustomEvent("cart-updated"));
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Network error",
      };
    }
  };

  // Update item quantity (Optimistic with rollback & rapid-click lock)
  const updateQuantity = async (
    itemId: string,
    newQuantity: number
  ): Promise<boolean> => {
    // Prevent duplicate rapid-click requests on the same item
    if (pendingRequestsRef.current.has(itemId)) {
      return false;
    }

    if (newQuantity < 1) {
      return removeItem(itemId);
    }

    const previousItems = [...items];
    const targetItem = items.find((i) => i.id === itemId);
    if (!targetItem) return false;

    // Check inventory ceiling if known
    if (
      targetItem.product?.available_stock &&
      newQuantity > targetItem.product.available_stock
    ) {
      toast.error(
        t("common.error"),
        t("cart.stockWarning", { stock: targetItem.product.available_stock })
      );
      return false;
    }

    // 1. Optimistic update
    const updatedItems = items.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          quantity: newQuantity,
          line_total: Number((item.unit_price * newQuantity).toFixed(2)),
        };
      }
      return item;
    });

    setItems(updatedItems);
    setSummary(computeSummary(updatedItems));

    // Lock item
    pendingRequestsRef.current.add(itemId);
    setUpdatingItemIds(new Set(pendingRequestsRef.current));

    try {
      const res = await fetch(`/api/cart/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        // Rollback
        setItems(previousItems);
        setSummary(computeSummary(previousItems));
        toast.error(
          t("common.error"),
          json.error || "Failed to update item quantity"
        );
        return false;
      }

      // Sync with authoritative server response
      if (json.data?.item) {
        setItems((current) =>
          current.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  quantity: json.data.item.quantity,
                  unit_price: json.data.authoritative_unit_price,
                  line_total: json.data.line_total,
                }
              : item
          )
        );
      }

      window.dispatchEvent(new CustomEvent("cart-updated"));
      return true;
    } catch (err) {
      // Rollback on network failure
      setItems(previousItems);
      setSummary(computeSummary(previousItems));
      toast.error(t("common.error"), t("common.somethingWentWrong"));
      return false;
    } finally {
      pendingRequestsRef.current.delete(itemId);
      setUpdatingItemIds(new Set(pendingRequestsRef.current));
    }
  };

  // Remove item (Optimistic)
  const removeItem = async (itemId: string): Promise<boolean> => {
    if (pendingRequestsRef.current.has(itemId)) {
      return false;
    }

    const previousItems = [...items];
    const targetItem = items.find((i) => i.id === itemId);

    // Optimistic removal
    const remaining = items.filter((i) => i.id !== itemId);
    setItems(remaining);
    setSummary(computeSummary(remaining));

    pendingRequestsRef.current.add(itemId);
    setUpdatingItemIds(new Set(pendingRequestsRef.current));

    try {
      const res = await fetch(`/api/cart/${itemId}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        // Rollback
        setItems(previousItems);
        setSummary(computeSummary(previousItems));
        toast.error(t("common.error"), json.error || "Failed to remove item");
        return false;
      }

      toast.info(
        t("cart.itemRemoved"),
        targetItem?.product?.name || "Product"
      );

      window.dispatchEvent(new CustomEvent("cart-updated"));
      return true;
    } catch (err) {
      // Rollback
      setItems(previousItems);
      setSummary(computeSummary(previousItems));
      toast.error(t("common.error"), t("common.somethingWentWrong"));
      return false;
    } finally {
      pendingRequestsRef.current.delete(itemId);
      setUpdatingItemIds(new Set(pendingRequestsRef.current));
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        summary,
        isLoading,
        error,
        isDrawerOpen,
        updatingItemIds,
        openDrawer,
        closeDrawer,
        toggleDrawer,
        refreshCart: fetchCart,
        addItem,
        updateQuantity,
        removeItem,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

