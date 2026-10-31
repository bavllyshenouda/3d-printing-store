-- Migration: Add admin custom-print request rejection with a customer-visible reason (Task 3)
-- File: supabase/migrations/20261031_add_custom_print_rejection.sql
--
-- EVIDENCE (supabase/tables.csv L44-56, constraints.csv L68)
--   * custom_print_requests.status CHECK already allows 'rejected' -> we REUSE it (no new status,
--     no constraint change).
--   * custom_print_requests has NO rejection-reason column -> we ADD a nullable one (non-destructive).
--   * custom_print_quotes.status CHECK allows 'expired' -> used to invalidate open quotes on reject.
--
-- DESIGN DECISIONS (approved)
--   * Store the reason in a dedicated nullable column rejection_reason (+ rejected_at timestamp).
--     The original description is NEVER modified.
--   * Status + reason are written in ONE atomic UPDATE inside a SECURITY DEFINER RPC gated by
--     public.is_admin() (server/DB-side authorization; hiding the button is not relied upon).
--   * On rejection, any still-open quotes ('draft'/'sent') are marked 'expired' (PRESERVED, not
--     deleted) so a rejected request cannot be accepted. admin_create_or_send_quote (deployed in
--     20261031_deploy_custom_print_quote_functions.sql) also blocks NEW quotes on 'rejected'.
--   * Reopening: no reopen workflow exists today, so 'rejected' is terminal for quoting. If a
--     reopen path is added later it should set status back and clear rejection_reason/rejected_at.
--
-- Apply in the Supabase SQL Editor AFTER 20261031_deploy_custom_print_quote_functions.sql.

-- 1. Add rejection fields (nullable => existing rows and inserts are unaffected)
ALTER TABLE public.custom_print_requests
  ADD COLUMN IF NOT EXISTS rejection_reason text;

ALTER TABLE public.custom_print_requests
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz;

-- 2. Admin rejects a request with a reason (atomic, admin-gated)
CREATE OR REPLACE FUNCTION public.admin_reject_custom_print_request(
  p_request_id uuid,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id uuid;
  v_request record;
  v_reason text;
  v_expired_quotes integer := 0;
BEGIN
  -- Authorization (server/DB side)
  v_admin_id := auth.uid();
  IF v_admin_id IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator privileges required' USING ERRCODE = 'P0015';
  END IF;

  -- Validate reason (reject empty / whitespace-only)
  v_reason := btrim(COALESCE(p_reason, ''));
  IF v_reason = '' THEN
    RAISE EXCEPTION 'Rejection reason is required' USING ERRCODE = 'P0025';
  END IF;

  -- Lock the request row
  SELECT * INTO v_request
  FROM public.custom_print_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Custom print request not found' USING ERRCODE = 'P0008';
  END IF;

  -- Prevent invalid transitions (a finished/cancelled request cannot be rejected)
  IF v_request.status IN ('completed', 'cancelled') THEN
    RAISE EXCEPTION 'Cannot reject a request in status "%"', v_request.status USING ERRCODE = 'P0026';
  END IF;

  -- Atomically set status + reason (+ timestamp). description is never touched.
  UPDATE public.custom_print_requests
  SET status = 'rejected',
      rejection_reason = v_reason,
      rejected_at = now(),
      updated_at = now()
  WHERE id = p_request_id;

  -- Invalidate any still-open quotes so the rejected request cannot be accepted.
  -- Quotes are PRESERVED (status change only), never deleted.
  UPDATE public.custom_print_quotes
  SET status = 'expired',
      responded_at = now(),
      updated_at = now()
  WHERE request_id = p_request_id
    AND status IN ('draft', 'sent');
  GET DIAGNOSTICS v_expired_quotes = ROW_COUNT;

  RETURN jsonb_build_object(
    'request_id', p_request_id,
    'status', 'rejected',
    'rejection_reason', v_reason,
    'expired_quotes', v_expired_quotes
  );
END;
$$;

-- 3. Grant + PostgREST schema cache refresh
GRANT EXECUTE ON FUNCTION public.admin_reject_custom_print_request(uuid, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

-- VERIFY (read-only) after applying:
--   SELECT column_name FROM information_schema.columns
--   WHERE table_schema='public' AND table_name='custom_print_requests'
--     AND column_name IN ('rejection_reason','rejected_at');
--   SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
--   WHERE n.nspname='public' AND p.proname='admin_reject_custom_print_request';
