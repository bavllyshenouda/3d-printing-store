import { z } from "zod";
import { addressSchema } from "@/lib/validations/order";

export const ALLOWED_PRINT_FILE_EXTENSIONS = [
  ".stl",
  ".3mf",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
];

export const ALLOWED_PRINT_FILE_MIME_TYPES = [
  "model/stl",
  "application/sla",
  "application/vnd.ms-pki.stl",
  "model/3mf",
  "application/vnd.ms-package.3dmanufacturing-3dmodel+xml",
  "application/octet-stream", // Fallback often assigned by browsers for STL/3MF
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const MAX_PRINT_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export function validateCustomPrintFile(file: File): { valid: boolean; error?: string } {
  if (!file || !(file instanceof File)) {
    return { valid: false, error: "A design or reference file is required" };
  }

  if (file.size <= 0) {
    return { valid: false, error: "File cannot be empty" };
  }

  if (file.size > MAX_PRINT_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds the 50 MB limit (file is ${(file.size / (1024 * 1024)).toFixed(2)} MB)`,
    };
  }

  const extension = "." + file.name.split(".").pop()?.toLowerCase();
  if (!ALLOWED_PRINT_FILE_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `Unsupported file extension "${extension}". Allowed extensions: .stl, .3mf, .png, .jpg, .jpeg, .webp`,
    };
  }

  // If MIME is octet-stream, extension must be STL or 3MF
  if (file.type === "application/octet-stream" && !([".stl", ".3mf"].includes(extension))) {
    return {
      valid: false,
      error: `Invalid file format for application/octet-stream. Expected .stl or .3mf`,
    };
  }

  if (file.type && !ALLOWED_PRINT_FILE_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported MIME type "${file.type}". Allowed types: STL, 3MF, JPEG, PNG, WebP`,
    };
  }

  return { valid: true };
}

export const createCustomPrintRequestSchema = z.object({
  title: z.string().trim().max(150, "Title cannot exceed 150 characters").optional().nullable(),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters explaining your design request")
    .max(2000, "Description cannot exceed 2000 characters"),
  quantity: z
    .number()
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1")
    .default(1),
  preferred_material: z.string().trim().optional().nullable(),
  preferred_color: z.string().trim().optional().nullable(),
  reference_url: z.string().trim().url("Invalid reference URL").optional().nullable().or(z.literal("")),
  customer_notes: z.string().trim().max(1000).optional().nullable(),
});

export const adminCreateQuoteSchema = z.object({
  description: z.string().trim().min(5, "Quote description must be at least 5 characters"),
  material: z.string().trim().optional().nullable(),
  color: z.string().trim().optional().nullable(),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  unit_price: z.number().min(0, "Unit price cannot be negative"),
  estimated_days: z.number().int().min(1, "Estimated days must be at least 1").default(3),
  valid_days: z.number().int().min(1, "Validity period must be at least 1 day").default(7),
  status: z.enum(["draft", "sent"]).default("sent"),
});

export const adminRejectRequestSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, "Rejection reason must be at least 3 characters")
    .max(1000, "Rejection reason cannot exceed 1000 characters"),
});

export const acceptQuoteSchema = z
  .object({
    address_id: z.string().uuid("Invalid address ID format").optional(),
    address: addressSchema.optional(),
    payment_method: z.enum(["cod", "instapay", "vodafone_cash", "online"], {
      message: "Payment method must be one of: cod, instapay, vodafone_cash, online",
    }),
    shipping_fee: z.number().nonnegative().default(50),
    address_notes: z.string().trim().optional().nullable(),
  })
  .refine(
    (data) => Boolean(data.address_id || data.address),
    {
      message: "Either an existing address_id or inline address details must be provided",
      path: ["address_id"],
    }
  );

export const rejectQuoteSchema = z.object({
  reason: z.string().trim().min(3, "Rejection reason must be at least 3 characters").default("Customer declined quote terms"),
});

export type CreateCustomPrintRequestInput = z.infer<typeof createCustomPrintRequestSchema>;
export type AdminCreateQuoteInput = z.infer<typeof adminCreateQuoteSchema>;
export type AdminRejectRequestInput = z.infer<typeof adminRejectRequestSchema>;
export type AcceptQuoteInput = z.infer<typeof acceptQuoteSchema>;
export type RejectQuoteInput = z.infer<typeof rejectQuoteSchema>;

