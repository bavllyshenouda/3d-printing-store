-- ==============================================================================
-- Phase 2 Migration: Optional Query Performance Indexes
-- ==============================================================================
-- The existing tables (categories, products, product_images, admins) and their
-- RLS policies already enforce complete security and relationship integrity.
-- These optional indexes accelerate public storefront searches, filtering, and joins.

-- 1. Index products by category_id for fast category filtering
CREATE INDEX IF NOT EXISTS idx_products_category_id 
  ON public.products(category_id);

-- 2. Composite index on active status and creation date for sorted storefront listings
CREATE INDEX IF NOT EXISTS idx_products_active_created 
  ON public.products(is_active, created_at DESC);

-- 3. Index on price for price range filtering and sorting
CREATE INDEX IF NOT EXISTS idx_products_price 
  ON public.products(price);

-- 4. Index on product_images for rapid image joining
CREATE INDEX IF NOT EXISTS idx_product_images_product_id 
  ON public.product_images(product_id, is_primary DESC, sort_order ASC);

-- 5. Index on categories active and sort_order
CREATE INDEX IF NOT EXISTS idx_categories_active_sort 
  ON public.categories(is_active, sort_order ASC);

