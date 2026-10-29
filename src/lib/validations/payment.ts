import { z } from "zod";

export const ALLOWED_PROOF_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export const ALLOWED_PROOF_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".pdf",
];

export const MAX_PROOF_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function validateProofFile(file: File): { valid: boolean; error?: string } {
  if (!file || !(file instanceof File)) {
    return { valid: false, error: "A payment proof file is required" };
  }

  if (file.size <= 0) {
    return { valid: false, error: "Payment proof file cannot be empty" };
  }

  if (file.size > MAX_PROOF_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds the 5 MB limit (file is ${(file.size / (1024 * 1024)).toFixed(2)} MB)`,
    };
  }

  if (!ALLOWED_PROOF_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported file type "${file.type}". Allowed types: JPEG, PNG, WebP, PDF`,
    };
  }

  const extension = "." + file.name.split(".").pop()?.toLowerCase();
  if (!ALLOWED_PROOF_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `Unsupported file extension "${extension}". Allowed extensions: .jpg, .jpeg, .png, .webp, .pdf`,
    };
  }

  return { valid: true };
}

export const submitProofSchema = z.object({
  transaction_reference: z
    .string()
    .trim()
    .max(100, "Transaction reference cannot exceed 100 characters")
    .optional()
    .nullable(),
  notes: z
    .string()
    .trim()
    .max(500, "Notes cannot exceed 500 characters")
    .optional()
    .nullable(),
});

export const adminReviewPaymentSchema = z
  .object({
    action: z.enum(["approve", "reject"], {
      message: "Review action must be either 'approve' or 'reject'",
    }),
    notes: z
      .string()
      .trim()
      .max(1000, "Notes cannot exceed 1000 characters")
      .optional()
      .nullable(),
    transaction_reference: z
      .string()
      .trim()
      .max(100, "Transaction reference cannot exceed 100 characters")
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      if (data.action === "reject") {
        return Boolean(data.notes && data.notes.length >= 3);
      }
      return true;
    },
    {
      message: "A rejection reason (at least 3 characters) is required when rejecting payment proof",
      path: ["notes"],
    }
  );

export type SubmitProofInput = z.infer<typeof submitProofSchema>;
export type AdminReviewPaymentInput = z.infer<typeof adminReviewPaymentSchema>;

