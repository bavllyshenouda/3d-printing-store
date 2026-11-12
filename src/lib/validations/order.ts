import { z } from "zod";

export const EGYPTIAN_PHONE_REGEX = /^(010|011|012|015)[0-9]{8}$/;

export function normalizeArabicDigits(str: string): string {
  return str
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776));
}

export const egyptianPhoneSchema = z.preprocess(
  (val) => (typeof val === "string" ? normalizeArabicDigits(val.trim()) : val),
  z
    .string()
    .regex(
      EGYPTIAN_PHONE_REGEX,
      "Invalid Egyptian mobile number. Must be 11 digits starting with 010, 011, 012, or 015"
    )
);

export const baseAddressSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(100, "First name cannot exceed 100 characters"),
  last_name: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(100, "Last name cannot exceed 100 characters"),
  phone: egyptianPhoneSchema,
  email: z
    .string()
    .trim()
    .max(255, "Email cannot exceed 255 characters")
    .email("Invalid email address")
    .optional()
    .nullable(),
  country: z
    .string()
    .trim()
    .max(100, "Country cannot exceed 100 characters")
    .optional(),
  governorate: z
    .string()
    .trim()
    .min(1, "Governorate is required")
    .max(100, "Governorate cannot exceed 100 characters"),
  region: z
    .string()
    .trim()
    .min(1, "City / District / Region is required")
    .max(100, "Region cannot exceed 100 characters"),
  street_address: z
    .string()
    .trim()
    .min(1, "Street address is required")
    .max(255, "Street address cannot exceed 255 characters"),
  building: z.string().trim().max(50).optional().nullable(),
  floor: z.string().trim().max(50).optional().nullable(),
  apartment: z.string().trim().max(50).optional().nullable(),
  notes: z
    .string()
    .trim()
    .max(500, "Notes cannot exceed 500 characters")
    .optional()
    .nullable(),
  is_default: z.boolean().optional(),
});

export const addressSchema = baseAddressSchema.extend({
  country: z.string().trim().max(100).default("Egypt"),
  is_default: z.boolean().default(false),
});

export const updateAddressSchema = baseAddressSchema
  .partial()
  .refine(
    (data) => Object.values(data).some((val) => val !== undefined),
    { message: "At least one field must be provided for update." }
  );

export const checkoutSchema = z
  .object({
    address_id: z.string().uuid("Invalid address ID format").optional(),
    address: addressSchema.optional(),
    save_address: z.boolean().default(false),
    // TODO(db): Update database CHECK constraint and RPC validation to remove "online" payment method
    payment_method: z.enum(["cod", "instapay", "vodafone_cash"], {
      message: "Payment method must be one of: cod, instapay, vodafone_cash",
    }),
    address_notes: z
      .string()
      .trim()
      .max(500, "Address notes cannot exceed 500 characters")
      .optional()
      .nullable(),
  })
  .refine(
    (data) => Boolean(data.address_id || data.address),
    {
      message: "Either an existing address_id or inline address details must be provided",
      path: ["address_id"],
    }
  );

export const adminUpdateOrderStatusSchema = z.object({
  status: z
    .enum([
      "pending_customer_confirmation",
      "confirmed",
      "processing",
      "ready_to_ship",
      "shipped",
      "delivered",
      "cancelled",
      "rejected",
    ])
    .optional(),
  payment_status: z
    .enum(["pending", "awaiting_verification", "paid", "failed", "refunded"])
    .optional(),
  carrier: z.string().trim().optional().nullable(),
  tracking_number: z.string().trim().optional().nullable(),
  status_note: z
    .string()
    .trim()
    .max(500, "Status note cannot exceed 500 characters")
    .optional()
    .nullable(),
});

export const customerCancelOrderSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, "Cancellation reason is required")
    .max(500, "Cancellation reason cannot exceed 500 characters")
    .default("Customer requested cancellation"),
});

// Enforce valid status transition lifecycle
export const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending_customer_confirmation: ["confirmed", "cancelled", "rejected"],
  confirmed: ["processing", "cancelled"],
  processing: ["ready_to_ship", "cancelled"],
  ready_to_ship: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [], // terminal
  cancelled: [], // terminal
  rejected: [],  // terminal
};

export function isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
  if (currentStatus === newStatus) return true;
  const allowed = VALID_STATUS_TRANSITIONS[currentStatus];
  return allowed ? allowed.includes(newStatus) : false;
}

export type AddressInput = z.infer<typeof addressSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type AdminUpdateOrderStatusInput = z.infer<typeof adminUpdateOrderStatusSchema>;

