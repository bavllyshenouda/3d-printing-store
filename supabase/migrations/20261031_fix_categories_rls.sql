-- Migration: Fix Admin category management (categories never load / cannot be created)
--   Symptom: Admin Dashboard -> Categories shows "No categories found", and the product form's
--            "Category" dropdown shows nothing. Creating a category fails silently or with
--            "new row violates row-level security policy for table categories".
-- File: supabase/migrations/20261031_fix_categories_rls.sql
--
-- ROOT CAUSE
-- The admin UI reads/writes public.categories through the USER-SCOPED Supabase client
-- (src/lib/auth/admin.ts -> requireAdmin() returns createClient()), so every query is enforced by
-- ROW LEVEL SECURITY. requireAdmin() only checks the app-level admins table; it does NOT bypass
-- RLS. The live database (base schema created manually) has no RLS policy that lets an
-- administrator INSERT / UPDATE / DELETE categories, so:
--   * creating a category is blocked by RLS  -> no categories ever exist
--   * the admin SELECT therefore returns an empty set -> "No categories" everywhere
-- No migration in this repo ever defined categories policies (only an index in phase2), which is
-- why the gap exists.
--
-- FIX (additive, idempotent, non-destructive; reuses the existing public.is_admin() helper that
-- phase4/5/6 RPCs and the product-images storage policies already rely on). Permissive policies
-- only ever ADD access for admins; the public storefront read of ACTIVE categories is preserved
-- exactly as before. No table is created, renamed, dropped, or altered structurally.
--
-- Run this once in the Supabase SQL Editor. It is safe to re-run.

-- ---------------------------------------------------------------------------
-- 0. Self-heal the is_admin() helper ONLY if it is missing.
--    Definition matches requireAdmin() exactly: a row in public.admins for the caller.
--    SECURITY DEFINER lets the check read public.admins regardless of that table's own RLS.
--    If is_admin() already exists (normal case), this block is a no-op and never overrides it.
-- ---------------------------------------------------------------------------
DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'is_admin'
  ) THEN
    EXECUTE $ddl$
      CREATE FUNCTION public.is_admin()
      RETURNS boolean
      LANGUAGE sql
      STABLE
      SECURITY DEFINER
      SET search_path = public, pg_temp
      AS $fn$
        SELECT EXISTS (
          SELECT 1 FROM public.admins a WHERE a.user_id = auth.uid()
        );
      $fn$;
    $ddl$;
  END IF;
END
$do$;

-- ---------------------------------------------------------------------------
-- 1. Make sure RLS is on (no-op if already enabled).
-- ---------------------------------------------------------------------------
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 2. Drop-then-create the policy set so re-running never fails on duplicate names.
--    Names are namespaced to avoid colliding with any pre-existing base-schema policies.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "categories_public_read_active" ON public.categories;
DROP POLICY IF EXISTS "categories_admin_read_all"     ON public.categories;
DROP POLICY IF EXISTS "categories_admin_insert"       ON public.categories;
DROP POLICY IF EXISTS "categories_admin_update"       ON public.categories;
DROP POLICY IF EXISTS "categories_admin_delete"       ON public.categories;

-- READ (public): anyone (storefront) can see ACTIVE categories -- unchanged behavior.
CREATE POLICY "categories_public_read_active"
  ON public.categories
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- READ (admin): administrators can see EVERY category, including inactive/hidden ones,
-- which is what the Admin Dashboard list and the product form dropdown require.
CREATE POLICY "categories_admin_read_all"
  ON public.categories
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- INSERT (admin only): lets the Admin Dashboard create new categories.
CREATE POLICY "categories_admin_insert"
  ON public.categories
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- UPDATE (admin only): lets the Admin Dashboard edit categories (name, slug, order, active...).
CREATE POLICY "categories_admin_update"
  ON public.categories
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- DELETE (admin only): lets the Admin Dashboard hard-delete a category
-- (products.category_id is set to NULL by the existing ON DELETE SET NULL FK).
CREATE POLICY "categories_admin_delete"
  ON public.categories
  FOR DELETE
  TO authenticated
  USING (public.is_admin());
