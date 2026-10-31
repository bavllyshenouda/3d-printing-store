-- Migration: Fix missing order_number_seq sequence (final checkout failure)
--   Error fixed: relation "order_number_seq" does not exist
-- File: supabase/migrations/20261031_fix_order_number_sequence.sql
--
-- ROOT CAUSE
-- public.create_checkout_order() assigns every new order number with:
--     v_order_number := nextval('order_number_seq');
-- and the function runs with  SET search_path = public, pg_temp, so that call resolves to
-- public.order_number_seq. The Phase 4 migration (20261029_phase4_orders_and_checkout.sql)
-- creates that sequence, but it was never applied to the live database (the base schema was
-- created manually). The function therefore exists and executes normally, then fails at
-- nextval() because the sequence is absent -- which is EXACTLY the reported error. The fact
-- that the error is raised from INSIDE the function body (not a schema-cache/404 error)
-- confirms the function itself is present, correctly signed, and callable.
--
-- FIX (safe, idempotent, non-destructive -- no existing rows are modified or deleted)
-- 1. Create public.order_number_seq if it is missing (identical definition to Phase 4).
-- 2. Fast-forward it ABOVE the current MAX(order_number) so an already-used order number is
--    never reissued (prevents duplicate order numbers / unique-violation on the next checkout).
-- 3. Re-assert the orders.order_number column DEFAULT and the sequence OWNERSHIP, wrapped in a
--    guarded block so this migration can NEVER hard-fail (e.g. if order_number happens to be an
--    identity column, or its default already points elsewhere).
--
-- The checkout function, its inventory locks, stock deduction, order-item snapshots, cart
-- clearing and shipping event are all left untouched. Run this once in the Supabase SQL Editor;
-- it is safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. Create the sequence if missing (matches the Phase 4 definition exactly)
-- ---------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START WITH 100001;

-- ---------------------------------------------------------------------------
-- 2. Sync the sequence safely above the highest existing order_number
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_max  bigint;
  v_next bigint;
BEGIN
  SELECT COALESCE(MAX(order_number), 0) INTO v_max FROM public.orders;
  v_next := GREATEST(v_max + 1, 100001);
  -- is_called = false  =>  the NEXT nextval('order_number_seq') returns exactly v_next,
  -- guaranteeing no collision with any order number already present in public.orders.
  PERFORM setval('public.order_number_seq', v_next, false);
END
$$;

-- ---------------------------------------------------------------------------
-- 3. Re-assert column default + sequence ownership (guarded; never hard-fails)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.orders
      ALTER COLUMN order_number SET DEFAULT nextval('public.order_number_seq');
    ALTER SEQUENCE public.order_number_seq OWNED BY public.orders.order_number;
  EXCEPTION WHEN OTHERS THEN
    -- e.g. order_number is an identity column, or default already set: leave as-is.
    RAISE NOTICE 'order_number default/ownership left unchanged: %', SQLERRM;
  END;
END
$$;
