import { z } from "zod";

export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Category name is required.")
    .max(100, "Category name cannot exceed 100 characters."),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      SLUG_REGEX,
      "Slug must contain only lowercase alphanumeric characters and hyphens."
    )
    .optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  image_url: z.string().trim().url("Must be a valid URL").optional().nullable(),
  is_active: z.boolean().optional().default(true),
  sort_order: z.number().int().min(0).optional().default(0),
});

export const updateCategorySchema = categorySchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided for update." }
);

export const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Product name is required.")
    .max(255, "Product name cannot exceed 255 characters."),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      SLUG_REGEX,
      "Slug must contain only lowercase alphanumeric characters and hyphens."
    )
    .optional(),
  description: z.string().trim().optional().nullable(),
  category_id: z.string().uuid("Invalid category UUID").optional().nullable(),
  price: z
    .number()
    .min(0, "Price must be greater than or equal to 0.")
    .refine((val) => Number(val.toFixed(2)) === val, {
      message: "Price can have at most 2 decimal places.",
    }),
  stock: z
    .number()
    .int("Stock must be an integer.")
    .min(0, "Stock cannot be negative.")
    .optional()
    .default(0),
  material: z.string().trim().max(100).optional().nullable(),
  available_colors: z
    .array(z.string().trim().min(1, "Color name cannot be empty."))
    .optional()
    .default([]),
  is_active: z.boolean().optional().default(true),
  is_featured: z.boolean().optional().default(false),
});

export const updateProductSchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    slug: z.string().trim().toLowerCase().regex(SLUG_REGEX).optional(),
    description: z.string().trim().optional().nullable(),
    category_id: z.string().uuid().optional().nullable(),
    price: z
      .number()
      .min(0, "Price must be greater than or equal to 0.")
      .refine((val) => Number(val.toFixed(2)) === val, {
        message: "Price can have at most 2 decimal places.",
      })
      .optional(),
    stock: z
      .number()
      .int("Stock must be an integer.")
      .min(0, "Stock cannot be negative.")
      .optional(),
    material: z.string().trim().max(100).optional().nullable(),
    available_colors: z
      .array(z.string().trim().min(1))
      .optional(),
    is_active: z.boolean().optional(),
    is_featured: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update.",
  });

export const productImageSchema = z.object({
  image_url: z.string().trim().min(1, "Image URL is required."),
  alt_text: z.string().trim().max(255).optional().nullable(),
  is_primary: z.boolean().optional().default(false),
  sort_order: z.number().int().min(0).optional().default(0),
});

export const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(12),
  category: z.string().trim().optional(),
  min_price: z.coerce.number().min(0).optional(),
  max_price: z.coerce.number().min(0).optional(),
  material: z.string().trim().optional(),
  search: z.string().trim().optional(),
  sort: z
    .enum([
      "price_asc",
      "price_desc",
      "newest",
      "oldest",
      "name_asc",
      "name_desc",
    ])
    .optional()
    .default("newest"),
  is_active: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
});

export type CategoryInput = z.infer<typeof categorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductImageInput = z.infer<typeof productImageSchema>;
export type ProductQueryParams = z.infer<typeof productQuerySchema>;
