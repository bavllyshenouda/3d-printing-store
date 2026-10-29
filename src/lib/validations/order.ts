import { z } from "zod";

export const EGYPTIAN_PHONE_REGEX = /^(010|011|012|015)[0-9]{8}$/;

export const egyptianPhoneSchema = z
  .string()
  .trim()
  .regex(
    EGYPTIAN_PHONE_REGEX,
    "Invalid Egyptian mobile number. Must be 11 digits starting with 010, 011, 012, or 015"
  );

export const addressSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required"),
  last_name: z.string().trim().min(1, "Last name is required"),
  phone: egyptianPhoneSchema,
  email: z.string().trim().email("Invalid email address").optional().nullable(),
  country: z.string().trim().default("Egypt"),
  governorate: z.string().trim().min(1, "Governorate is required"),
  region: z.string().trim().min(1, "City / District / Region is required"),
  street_address: z.string().trim().min(1, "Street address is required"),
  building: z.string().trim().optional().nullable(),
  floor: z.string().trim().optional().nullable(),
  apartment: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
  is_default: z.boolean().default(false),
});

export const updateAddressSchema = addressSchema.partial();

export const checkoutSchema = z
  .object({
    address_id: z.string().uuid("Invalid address ID format").optional(),
    address: addressSchema.optional(),
    save_address: z.boolean().default(false),
    payment_method: z.enum(["cod", "instapay", "vodafone_cash", "online"], {
      message: "Payment method must be one of: cod, instapay, vodafone_cash, online",
    }),
    shipping_fee: z.number().nonnegative("Shipping fee cannot be negative").default(0),
    discount_amount: z.number().nonnegative("Discount amount cannot be negative").default(0),
    address_notes: z.string().trim().optional().nullable(),
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
  status_note: z.string().trim().optional().nullable(),
});

export const customerCancelOrderSchema = z.object({
  reason: z.string().trim().min(1, "Cancellation reason is required").default("Customer requested cancellation"),
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

