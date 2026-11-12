-- Migration: 20261110_add_product_dimensions.sql
-- Description: Add nullable width and height dimension columns to the products table.
-- Safety: Completely additive and non-destructive. Preserves all existing rows, tables, and constraints.
-- Existing products with NULL width and height remain fully functional and backward-compatible.

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS width numeric NULL,
ADD COLUMN IF NOT EXISTS height numeric NULL;

-- Column documentation
COMMENT ON COLUMN public.products.width IS 'Physical product width in centimeters (cm). Nullable for backward compatibility.';
COMMENT ON COLUMN public.products.height IS 'Physical product height in centimeters (cm). Nullable for backward compatibility.';

