-- Migration: Deploy the missing custom-print quote RPCs (Task 2 + customer accept/reject flow)
-- File: supabase/migrations/20261031_deploy_custom_print_quote_functions.sql
--
-- ROOT CAUSE (confirmed from supabase/functions.csv)
--   The live database contains ONLY: create_checkout_order, handle_new_user, is_admin,
--   set_updated_at. The Phase 6 functions were NEVER deployed, so PostgREST reports:
--     "Could not find the function public.admin_create_or_send_quote(...) in the schema cache"
--   accept_custom_print_quote and reject_custom_print_quote are also absent, so the customer
--   accept/reject quote flow is broken too.
--
-- WHAT THIS DOES
--   1. Deploys public.admin_create_or_send_quote with the EXACT 9-parameter signature the API
--      route and src/types/database.ts already expect (no signature drift, single definition =>
--      no ambiguous overloads). Adds 'rejected' to the "cannot quote" guard so a rejected
--      request cannot receive a new quote (Task 3 consistency).
--   2. Deploys public.accept_custom_print_quote and public.reject_custom_print_quote.
--      accept_custom_print_quote is adapted to the real schema: orders.order_number is a
--      GENERATED ALWAYS identity, so it must NOT be inserted explicitly (same fix as Task 1);
--      the value is read back via RETURNING.
--   3. Grants EXECUTE to authenticated and refreshes the PostgREST schema cache.
--
--   All three are SECURITY DEFINER with in-body authorization:
--     * admin_create_or_send_quote requires public.is_admin()  -> customers cannot use it.
--     * accept/reject require auth.uid() and verify request ownership.
--
-- Apply in the Supabase SQL Editor, then confirm discovery (see verification at the bottom).

-- ===========================================================================
-- 1. Admin creates or sends a quote (9 params; matches API + database.ts)
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.admin_create_or_send_quote(
  p_request_id uuid,
  p_description text,
  p_material text,
  p_color text,
  p_quantity integer,
  p_unit_price numeric,
  p_estimated_days integer DEFAULT 3,
  p_valid_days integer DEFAULT 7,
  p_status text DEFAULT 'sent' -- 'draft' or 'sent'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id uuid;
  v_request record;
  v_max_version integer := 0;
  v_new_version integer := 1;
  v_total_price numeric;
  v_valid_until timestamptz;
  v_quote record;
BEGIN
  v_admin_id := auth.uid();
  IF v_admin_id IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator privileges required' USING ERRCODE = 'P0015';
  END IF;

  -- Validate request exists
  SELECT * INTO v_request
  FROM public.custom_print_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Custom print request not found' USING ERRCODE = 'P0008';
  END IF;

  -- Cannot quote a closed / rejected request (rejected added for Task 3 consistency)
  IF v_request.status IN ('completed', 'cancelled', 'rejected') THEN
    RAISE EXCEPTION 'Cannot quote a request in status "%"', v_request.status USING ERRCODE = 'P0013';
  END IF;

  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be greater than zero' USING ERRCODE = 'P0021';
  END IF;

  IF p_unit_price < 0 THEN
    RAISE EXCEPTION 'Unit price cannot be negative' USING ERRCODE = 'P0022';
  END IF;

  -- Determine next version
  SELECT COALESCE(MAX(version), 0) INTO v_max_version
  FROM public.custom_print_quotes
  WHERE request_id = p_request_id;

  v_new_version := v_max_version + 1;
  v_total_price := ROUND(p_unit_price * p_quantity, 2);
  v_valid_until := now() + (COALESCE(p_valid_days, 7) || ' days')::interval;

  -- Insert quote
  INSERT INTO public.custom_print_quotes (
    request_id,
    version,
    description,
    material,
    color,
    quantity,
    unit_price,
    total_price,
    estimated_days,
    status,
    valid_until,
    sent_at,
    created_by
  ) VALUES (
    p_request_id,
    v_new_version,
    p_description,
    p_material,
    p_color,
    p_quantity,
    ROUND(p_unit_price, 2),
    v_total_price,
    p_estimated_days,
    p_status,
    v_valid_until,
    CASE WHEN p_status = 'sent' THEN now() ELSE NULL END,
    v_admin_id
  ) RETURNING * INTO v_quote;

  -- If quote was sent, update request status to 'quote_sent'
  IF p_status = 'sent' THEN
    UPDATE public.custom_print_requests
    SET status = 'quote_sent',
        updated_at = now()
    WHERE id = p_request_id;
  ELSIF v_request.status = 'submitted' THEN
    UPDATE public.custom_print_requests
    SET status = 'under_review',
        updated_at = now()
    WHERE id = p_request_id;
  END IF;

  RETURN to_jsonb(v_quote);
END;
$$;

-- ===========================================================================
-- 2. Customer accepts a quote -> converts atomically into an order
--    (order_number is GENERATED ALWAYS identity: not inserted, read via RETURNING)
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.accept_custom_print_quote(
  p_quote_id uuid,
  p_customer_first_name text,
  p_customer_last_name text,
  p_customer_phone text,
  p_customer_email text,
  p_governorate text,
  p_region text,
  p_street_address text,
  p_building text DEFAULT NULL,
  p_floor text DEFAULT NULL,
  p_apartment text DEFAULT NULL,
  p_address_notes text DEFAULT NULL,
  p_payment_method text DEFAULT 'cod',
  p_shipping_fee numeric DEFAULT 50
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_quote record;
  v_request record;
  v_order_id uuid;
  v_order_number bigint;
  v_subtotal numeric;
  v_total numeric;
  v_existing_order record;
  v_primary_image text := NULL;
  v_result jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = 'P0001';
  END IF;

  -- Lock quote row
  SELECT * INTO v_quote
  FROM public.custom_print_quotes
  WHERE id = p_quote_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quote not found' USING ERRCODE = 'P0008';
  END IF;

  -- Lock request row
  SELECT * INTO v_request
  FROM public.custom_print_requests
  WHERE id = v_quote.request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Custom print request not found' USING ERRCODE = 'P0008';
  END IF;

  -- Verify ownership
  IF v_request.user_id <> v_user_id THEN
    RAISE EXCEPTION 'Access denied. You do not own this request' USING ERRCODE = 'P0009';
  END IF;

  -- Idempotency check: if quote was already accepted, find and return existing order
  IF v_quote.status = 'accepted' THEN
    SELECT * INTO v_existing_order
    FROM public.orders
    WHERE user_id = v_user_id
      AND id IN (
        SELECT order_id FROM public.order_items
        WHERE product_name LIKE '%' || v_request.request_number || '%'
      )
    ORDER BY created_at DESC
    LIMIT 1;

    IF FOUND THEN
      RETURN jsonb_build_object(
        'order_id', v_existing_order.id,
        'order_number', v_existing_order.order_number,
        'status', v_existing_order.status,
        'payment_status', v_existing_order.payment_status,
        'total', v_existing_order.total,
        'already_accepted', true
      );
    END IF;
  END IF;

  -- Validate quote status
  IF v_quote.status <> 'sent' THEN
    RAISE EXCEPTION 'Quote cannot be accepted in status "%"', v_quote.status USING ERRCODE = 'P0023';
  END IF;

  -- Validate expiration
  IF v_quote.valid_until IS NOT NULL AND v_quote.valid_until < now() THEN
    UPDATE public.custom_print_quotes
    SET status = 'expired',
        updated_at = now()
    WHERE id = p_quote_id;

    RAISE EXCEPTION 'This quote expired on %', v_quote.valid_until USING ERRCODE = 'P0024';
  END IF;

  -- Validate phone
  IF NOT (p_customer_phone ~ '^(010|011|012|015)[0-9]{8}$') THEN
    RAISE EXCEPTION 'Invalid Egyptian phone number. Must be 11 digits starting with 010, 011, 012, or 015' USING ERRCODE = 'P0002';
  END IF;

  -- Validate payment method
  IF p_payment_method NOT IN ('cod', 'instapay', 'vodafone_cash', 'online') THEN
    RAISE EXCEPTION 'Invalid payment method: %', p_payment_method USING ERRCODE = 'P0003';
  END IF;

  -- Calculate order amounts
  v_subtotal := ROUND(v_quote.unit_price * v_quote.quantity, 2);
  p_shipping_fee := ROUND(COALESCE(p_shipping_fee, 50), 2);
  v_total := ROUND(v_subtotal + p_shipping_fee, 2);

  -- Retrieve reference image from attached files if any
  SELECT storage_path INTO v_primary_image
  FROM public.custom_print_files
  WHERE request_id = v_request.id
    AND mime_type LIKE 'image/%'
  ORDER BY created_at ASC
  LIMIT 1;

  -- 1. Create order. order_number is GENERATED ALWAYS identity: DO NOT insert it.
  INSERT INTO public.orders (
    user_id,
    status,
    payment_method,
    payment_status,
    currency,
    subtotal,
    shipping_fee,
    discount_amount,
    total,
    customer_first_name,
    customer_last_name,
    customer_phone,
    customer_email,
    country,
    governorate,
    region,
    street_address,
    building,
    floor,
    apartment,
    address_notes,
    customer_confirmation_at,
    confirmed_at
  ) VALUES (
    v_user_id,
    'confirmed', -- Auto-confirmed because customer explicitly accepted the quote
    p_payment_method,
    'pending',
    'EGP',
    v_subtotal,
    p_shipping_fee,
    0,
    v_total,
    p_customer_first_name,
    p_customer_last_name,
    p_customer_phone,
    p_customer_email,
    'Egypt',
    p_governorate,
    p_region,
    p_street_address,
    p_building,
    p_floor,
    p_apartment,
    p_address_notes,
    now(),
    now()
  ) RETURNING id, order_number INTO v_order_id, v_order_number;

  -- 2. Create line item snapshot in order_items
  INSERT INTO public.order_items (
    order_id,
    product_id,
    product_name,
    product_image_url,
    color,
    quantity,
    unit_price,
    line_total
  ) VALUES (
    v_order_id,
    NULL,
    'Custom 3D Print: ' || COALESCE(v_request.title, 'Request #' || v_request.request_number),
    v_primary_image,
    COALESCE(v_quote.color, v_request.preferred_color, 'Standard'),
    v_quote.quantity,
    v_quote.unit_price,
    v_subtotal
  );

  -- 3. Initial shipping event
  INSERT INTO public.shipping_events (
    order_id,
    status,
    description
  ) VALUES (
    v_order_id,
    'confirmed',
    'Order created from accepted custom print quote #' || p_quote_id || '. Ready for production.'
  );

  -- 4. Update quote status to accepted
  UPDATE public.custom_print_quotes
  SET status = 'accepted',
      responded_at = now(),
      updated_at = now()
  WHERE id = p_quote_id;

  -- 5. Update request status to accepted
  UPDATE public.custom_print_requests
  SET status = 'accepted',
      updated_at = now()
  WHERE id = v_request.id;

  -- Return created order summary
  SELECT jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'status', 'confirmed',
    'payment_method', p_payment_method,
    'payment_status', 'pending',
    'subtotal', v_subtotal,
    'shipping_fee', p_shipping_fee,
    'total', v_total,
    'quote_id', p_quote_id,
    'request_id', v_request.id
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ===========================================================================
-- 3. Customer rejects a quote (does not touch orders/order_number)
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.reject_custom_print_quote(
  p_quote_id uuid,
  p_reason text DEFAULT 'Customer declined quote terms'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_quote record;
  v_request record;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_quote
  FROM public.custom_print_quotes
  WHERE id = p_quote_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quote not found' USING ERRCODE = 'P0008';
  END IF;

  SELECT * INTO v_request
  FROM public.custom_print_requests
  WHERE id = v_quote.request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Custom print request not found' USING ERRCODE = 'P0008';
  END IF;

  IF v_request.user_id <> v_user_id THEN
    RAISE EXCEPTION 'Access denied. You do not own this request' USING ERRCODE = 'P0009';
  END IF;

  IF v_quote.status <> 'sent' THEN
    RAISE EXCEPTION 'Quote cannot be rejected in status "%"', v_quote.status USING ERRCODE = 'P0023';
  END IF;

  UPDATE public.custom_print_quotes
  SET status = 'rejected',
      responded_at = now(),
      updated_at = now()
  WHERE id = p_quote_id;

  -- Revert request back to under_review so admin can provide a revised quote
  UPDATE public.custom_print_requests
  SET status = 'under_review',
      customer_notes = COALESCE(customer_notes || ' | Rejection note: ' || p_reason, p_reason),
      updated_at = now()
  WHERE id = v_request.id;

  RETURN jsonb_build_object(
    'quote_id', p_quote_id,
    'status', 'rejected',
    'message', 'Quote rejected successfully'
  );
END;
$$;

-- ===========================================================================
-- Grants + PostgREST schema cache refresh
-- ===========================================================================
GRANT EXECUTE ON FUNCTION public.admin_create_or_send_quote(uuid, text, text, text, integer, numeric, integer, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_custom_print_quote(uuid, text, text, text, text, text, text, text, text, text, text, text, text, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_custom_print_quote(uuid, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

-- VERIFY (read-only) after applying:
--   SELECT p.proname, pg_get_function_identity_arguments(p.oid)
--   FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--   WHERE n.nspname = 'public' AND p.proname IN
--     ('admin_create_or_send_quote','accept_custom_print_quote','reject_custom_print_quote');
