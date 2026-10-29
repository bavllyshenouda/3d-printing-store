-- ==============================================================================
-- Phase 3 Migration: Optional Cart Query Performance Indexes
-- ==============================================================================
-- The existing cart_items table already possesses:
-- 1. Primary key on id
-- 2. Foreign keys on user_id (referencing profiles) and product_id (referencing products)
-- 3. Check constraint ensuring positive quantity
-- 4. Compound UNIQUE constraint on (user_id, product_id, color)
-- 5. Complete RLS policy ("Customers manage own cart") enforcing user_id = auth.uid()

-- Performance index: Speeds up customer cart lookups and ordering
CREATE INDEX IF NOT EXISTS idx_cart_items_user_created 
  ON public.cart_items(user_id, created_at DESC);

