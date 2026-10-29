import { z } from "zod";

export const addToCartSchema = z.object({
  product_id: z
    .string()
    .trim()
    .min(1, "Product ID is required.")
    .uuid("Invalid product ID format. Must be a valid UUID."),
  color: z
    .string()
    .trim()
    .min(1, "Color selection cannot be empty.")
    .max(50, "Color name cannot exceed 50 characters."),
  quantity: z
    .number()
    .int("Quantity must be an integer.")
    .min(1, "Quantity must be at least 1.")
    .max(100, "Maximum 100 units allowed per item.")
    .optional()
    .default(1),
  // Client submitted price is explicitly discarded if supplied
  price: z.unknown().optional(),
});

export const updateCartItemSchema = z.object({
  quantity: z
    .number()
    .int("Quantity must be an integer.")
    .min(1, "Quantity must be at least 1.")
    .max(100, "Maximum 100 units allowed per item."),
  // Client submitted price is explicitly discarded if supplied
  price: z.unknown().optional(),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
