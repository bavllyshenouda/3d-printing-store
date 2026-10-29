import { z } from "zod";

/**
 * Egyptian phone number validation rule:
 * Exactly 11 digits, starting with 010, 011, 012, or 015.
 */
export const EGYPTIAN_PHONE_REGEX = /^01[0125][0-9]{8}$/;

export const egyptianPhoneSchema = z
  .string()
  .trim()
  .regex(
    EGYPTIAN_PHONE_REGEX,
    "Invalid Egyptian phone number. Must be exactly 11 digits starting with 010, 011, 012, or 015."
  );

export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .email("Please provide a valid email address.")
    .max(255, "Email address is too long."),
  password: z
    .string()
    .min(1, "Password is required.")
    .min(6, "Password must be at least 6 characters long.")
    .max(100, "Password cannot exceed 100 characters."),
  first_name: z
    .string()
    .trim()
    .min(1, "First name cannot be empty.")
    .max(100, "First name cannot exceed 100 characters."),
  last_name: z
    .string()
    .trim()
    .min(1, "Last name cannot be empty.")
    .max(100, "Last name cannot exceed 100 characters."),
  phone: z
    .union([egyptianPhoneSchema, z.literal(""), z.null()])
    .optional()
    .transform((val) => (val === "" || val === null ? undefined : val)),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .email("Please provide a valid email address."),
  password: z.string().min(1, "Password cannot be empty."),
});

export const updateProfileSchema = z
  .object({
    first_name: z
      .string()
      .trim()
      .min(1, "First name cannot be empty.")
      .max(100, "First name cannot exceed 100 characters.")
      .optional(),
    last_name: z
      .string()
      .trim()
      .min(1, "Last name cannot be empty.")
      .max(100, "Last name cannot exceed 100 characters.")
      .optional(),
    phone: z
      .union([egyptianPhoneSchema, z.literal(""), z.null()])
      .optional()
      .transform((val) => (val === "" ? null : val)),
  })
  .refine(
    (data) =>
      data.first_name !== undefined ||
      data.last_name !== undefined ||
      data.phone !== undefined,
    {
      message:
        "At least one field ('first_name', 'last_name', or 'phone') must be provided for update.",
    }
  );

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
