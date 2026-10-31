-- Migration: Fix product image storage so uploaded catalog images display publicly
-- File: supabase/migrations/20261031_fix_product_images_storage.sql
--
-- Purpose
-- -------
-- Product/category images are uploaded by admins to the `product-images` bucket and
-- rendered on the storefront via Supabase `getPublicUrl(...)`. For a public URL to
-- actually serve bytes, the bucket MUST be flagged public. This migration makes the
-- `product-images` bucket public (idempotently), aligns its upload constraints with
-- the API route (/api/admin/upload), and (re)creates least-privilege storage policies:
--   * anyone may READ product images (they are public catalog assets), and
--   * only admins may INSERT / UPDATE / DELETE them.
--
-- SAFETY: This migration ONLY touches the `product-images` bucket. The private
-- `payment-proofs` and `custom-print-files` buckets are intentionally left untouched
-- so private customer files are NEVER exposed publicly.
--
-- The whole file is idempotent and safe to re-run.

-- 1. Ensure the bucket exists and is PUBLIC ------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5 MB, matches MAX_FILE_SIZE_BYTES in /api/admin/upload
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Storage policies for product-images ---------------------------------------
-- Drop any prior copies of these named policies so re-runs never fail on duplicates.
DROP POLICY IF EXISTS "product_images_public_read"   ON storage.objects;
DROP POLICY IF EXISTS "product_images_admin_insert"  ON storage.objects;
DROP POLICY IF EXISTS "product_images_admin_update"  ON storage.objects;
DROP POLICY IF EXISTS "product_images_admin_delete"  ON storage.objects;

-- READ: public catalog images are readable by everyone (anon + authenticated).
CREATE POLICY "product_images_public_read"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'product-images');

-- INSERT: only admins may upload new product images.
CREATE POLICY "product_images_admin_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

-- UPDATE: only admins may replace/overwrite product images.
CREATE POLICY "product_images_admin_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images' AND public.is_admin())
WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

-- DELETE: only admins may remove product images.
CREATE POLICY "product_images_admin_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'product-images' AND public.is_admin());

-- 3. Confirm the private buckets remain private (defensive, no-op if already set) --
UPDATE storage.buckets SET public = false WHERE id IN ('payment-proofs', 'custom-print-files');
