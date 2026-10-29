"use client";

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastOptions {
  id?: string;
  title: string;
  description?: string;
  type?: ToastType;
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: string;
}

interface ToastContextValue {
  toasts: ToastItem[];
  addToast: (options: ToastOptions) => string;
  removeToast: (id: string) => void;
  toast: {
    success: (title: string, description?: string) => string;
    error: (title: string, description?: string) => string;
    warning: (title: string, description?: string) => string;
    info: (title: string, description?: string) => string;
  };
}

const ToastContext = createContext<ToastContextValue | null>(null);

let globalAddToast: ((options: ToastOptions) => string) | null = null;

export const toast = {
  success: (title: string, description?: string) =>
    globalAddToast ? globalAddToast({ title, description, type: "success" }) : "",
  error: (title: string, description?: string) =>
    globalAddToast ? globalAddToast({ title, description, type: "error" }) : "",
  warning: (title: string, description?: string) =>
    globalAddToast ? globalAddToast({ title, description, type: "warning" }) : "",
  info: (title: string, description?: string) =>
    globalAddToast ? globalAddToast({ title, description, type: "info" }) : "",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ id, title, description, type = "info", duration = 4500 }: ToastOptions) => {
      const toastId = id || Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id: toastId, title, description, type, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(toastId);
        }, duration);
      }

      return toastId;
    },
    [removeToast]
  );

  useEffect(() => {
    globalAddToast = addToast;
    return () => {
      globalAddToast = null;
    };
  }, [addToast]);

  const value = useMemo(
    () => ({
      toasts,
      addToast,
      removeToast,
      toast: {
        success: (title: string, description?: string) =>
          addToast({ title, description, type: "success" }),
        error: (title: string, description?: string) =>
          addToast({ title, description, type: "error" }),
        warning: (title: string, description?: string) =>
          addToast({ title, description, type: "warning" }),
        info: (title: string, description?: string) =>
          addToast({ title, description, type: "info" }),
      },
    }),
    [toasts, addToast, removeToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-50 flex max-w-md w-full flex-col gap-2.5 pointer-events-none px-4 sm:px-0"
        aria-live="polite"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            role={item.type === "error" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-3",
              item.type === "success" &&
                "bg-[#111318]/95 border-emerald-500/30 text-white shadow-emerald-500/10",
              item.type === "error" &&
                "bg-[#111318]/95 border-red-500/30 text-white shadow-red-500/10",
              item.type === "warning" &&
                "bg-[#111318]/95 border-amber-500/30 text-white shadow-amber-500/10",
              item.type === "info" &&
                "bg-[#111318]/95 border-[#FF6B35]/30 text-white shadow-[#FF6B35]/10"
            )}
          >
            <div className="shrink-0 mt-0.5">
              {item.type === "success" && <CheckCircle2 className="size-5 text-emerald-400" />}
              {item.type === "error" && <AlertCircle className="size-5 text-red-400" />}
              {item.type === "warning" && <AlertTriangle className="size-5 text-amber-400" />}
              {item.type === "info" && <Info className="size-5 text-[#FF6B35]" />}
            </div>

            <div className="flex-1 space-y-1">
              <p className="text-sm font-semibold leading-tight">{item.title}</p>
              {item.description && (
                <p className="text-xs text-gray-400 leading-normal">{item.description}</p>
              )}
            </div>

            <button
              onClick={() => removeToast(item.id)}
              className="shrink-0 rounded-lg p-1 text-gray-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35]"
              aria-label="Dismiss notification"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
