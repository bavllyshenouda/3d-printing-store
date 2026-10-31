-- Migration: Stop inserting into GENERATED pricing columns (Task 1 + Task 5)
-- File: supabase/migrations/20261031_fix_generated_pricing_columns.sql
--
-- ============================================================================
-- ROOT CAUSE (confirmed from the live export supabase/tables.csv + the errors)
-- ============================================================================
--   * custom_print_quotes.total_price  (tables.csv L35): numeric, is_identity = NO
--   * order_items.line_total           (tables.csv L82): numeric, is_identity = NO
--
--   Both raise:  "cannot insert a non-DEFAULT value into column <x>".
--   Postgres throws that error ONLY for (a) GENERATED ALWAYS AS IDENTITY columns or
--   (b) GENERATED ALWAYS AS (expression) STORED columns. Because tables.csv proves
--   is_identity = NO for both, they are GENERATED ... STORED (computed) columns.
--   (tables.csv does not export is_generated/generation_expression, which is why the
--    computed definition is not visible there -- the error + is_identity=NO is the proof.)
--
--   Every INSERT that lists these columns therefore fails:
--     - public.create_checkout_order()      -> order_items.line_total   (Task 5)
--     - public.accept_custom_print_quote()  -> order_items.line_total   (Task 5)
--     - public.admin_create_or_send_quote() -> custom_print_quotes.total_price (Task 1)
--
-- ============================================================================
-- FIX (minimal, non-destructive; NO constraint disabled, NO column type changed)
-- ============================================================================
--   Redefine the three functions so they STOP writing the generated columns and let
--   PostgreSQL compute them. Values are read back where needed:
--     - create_checkout_order / accept_custom_print_quote compute the order totals from
--       v_subtotal (sum of price * qty) independently, so the orders.subtotal/total are
--       unchanged; only the redundant line_total INSERT is removed.
--     - admin_create_or_send_quote already does `RETURNING * INTO v_quote`, so the
--       generated total_price is captured automatically and returned to the API/client.
--   create_checkout_order ALSO keeps the GENERATED ALWAYS identity fix for order_number
--   (it supersedes 20261031_fix_checkout_order_number_identity.sql).
--
--   Signatures are UNCHANGED => CREATE OR REPLACE swaps them in place (no new overload,
--   no ambiguity). Existing GRANTs are preserved; we re-assert them to be safe.
--
-- ============================================================================
-- DEPLOYMENT ORDER (apply this file LAST so its definitions win)
-- ============================================================================
--   1) 20261031_deploy_custom_print_quote_functions.sql   (base quote fns incl. reject_*)
--   2) 20261031_add_custom_print_rejection.sql            (rejection column + RPC)
--   3) 20261031_fix_generated_pricing_columns.sql         (THIS FILE)
--   NOTE: 20261031_fix_checkout_order_number_identity.sql is superseded by this file
--         for create_checkout_order (harmless if it was already applied).
--
-- VERIFY the computed definitions first (read-only) if you want to confirm the expressions:
--   SELECT table_name, column_name, is_generated, generation_expression
--   FROM information_schema.columns
--   WHERE table_schema='public'
--     AND ((table_name='order_items' AND column_name='line_total')
--       OR (table_name='custom_print_quotes' AND column_name='total_price'));

-- ===========================================================================
-- 1. create_checkout_order  (Task 5: order_items.line_total is generated)
--    Preserves: auth, phone/payment validation, FOR UPDATE inventory locks,
--    double-checked cart re-validation, authoritative pricing, stock decrement,
--    cart clear, shipping event, order_number GENERATED ALWAYS identity handling.
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.create_checkout_order(
  p_customer_first_name text,
  p_customer_last_name text,
  p_customer_phone text,
  p_customer_email text,
  p_governorate text,
  p_region text,
  p_street_address text,
  p_building text DEFAULT NULL::text,
  p_floor text DEFAULT NULL::text,
  p_apartment text DEFAULT NULL::text,
  p_address_notes text DEFAULT NULL::text,
  p_payment_method text DEFAULT 'cod'::text,
  p_shipping_fee numeric DEFAULT 0,
  p_discount_amount numeric DEFAULT 0
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid;
  v_order_id uuid;
  v_order_number bigint;
  v_subtotal numeric := 0;
  v_total numeric := 0;
  v_item record;
  v_product record;
  v_item_count int := 0;
  v_primary_image text;
  v_result jsonb;
BEGIN
  -- 1. Authenticate user from session
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to checkout' USING ERRCODE = 'P0001';
  END IF;

  -- 2. Validate phone format (Egyptian 11-digit mobile: 010, 011, 012, 015)
  IF NOT (p_customer_phone ~ '^(010|011|012|015)[0-9]{8}$') THEN
    RAISE EXCEPTION 'Invalid Egyptian phone number. Must be 11 digits starting with 010, 011, 012, or 015' USING ERRCODE = 'P0002';
  END IF;

  -- 3. Validate payment method
  IF p_payment_method NOT IN ('cod', 'instapay', 'vodafone_cash', 'online') THEN
    RAISE EXCEPTION 'Invalid payment method: %', p_payment_method USING ERRCODE = 'P0003';
  END IF;

  -- 4. Verify cart is not empty
  SELECT COUNT(*) INTO v_item_count
  FROM public.cart_items
  WHERE user_id = v_user_id;

  IF v_item_count = 0 THEN
    RAISE EXCEPTION 'Cart is empty' USING ERRCODE = 'P0004';
  END IF;

  -- 5. Lock and validate each cart item's product (concurrency-safe, prevents overselling)
  FOR v_item IN
    SELECT ci.id AS cart_item_id, ci.product_id, ci.color, ci.quantity
    FROM public.cart_items ci
    WHERE ci.user_id = v_user_id
    ORDER BY ci.product_id, ci.id
  LOOP
    SELECT id, name, price, stock, is_active
    INTO v_product
    FROM public.products
    WHERE id = v_item.product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % in your cart no longer exists', v_item.product_id USING ERRCODE = 'P0005';
    END IF;

    IF NOT v_product.is_active THEN
      RAISE EXCEPTION 'Product "%" is currently unpublished and cannot be purchased', v_product.name USING ERRCODE = 'P0006';
    END IF;

    IF v_product.stock < v_item.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for product "%". Requested: %, Available: %',
        v_product.name, v_item.quantity, v_product.stock USING ERRCODE = 'P0007';
    END IF;

    v_subtotal := v_subtotal + (v_product.price * v_item.quantity);
  END LOOP;

  -- 5b. Re-validate the cart AFTER acquiring the product locks (double-checked locking).
  SELECT COUNT(*) INTO v_item_count
  FROM public.cart_items
  WHERE user_id = v_user_id;

  IF v_item_count = 0 THEN
    RAISE EXCEPTION 'Cart is empty' USING ERRCODE = 'P0004';
  END IF;

  -- 6. Calculate authoritative order total
  v_subtotal := ROUND(v_subtotal, 2);
  p_shipping_fee := ROUND(COALESCE(p_shipping_fee, 0), 2);
  p_discount_amount := ROUND(COALESCE(p_discount_amount, 0), 2);
  v_total := ROUND((v_subtotal + p_shipping_fee) - p_discount_amount, 2);

  IF v_total < 0 THEN
    v_total := 0;
  END IF;

  -- 7. Insert order record.
  --    order_number is GENERATED ALWAYS identity: DO NOT insert it; read it back via RETURNING.
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
    address_notes
  ) VALUES (
    v_user_id,
    'pending_customer_confirmation',
    p_payment_method,
    'pending',
    'EGP',
    v_subtotal,
    p_shipping_fee,
    p_discount_amount,
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
    p_address_notes
  ) RETURNING id, order_number INTO v_order_id, v_order_number;

  -- 8. Insert order items, deduct inventory stock, and gather image snapshot.
  --    line_total is a GENERATED column: DO NOT insert it; Postgres computes qty * unit_price.
  FOR v_item IN
    SELECT ci.id AS cart_item_id, ci.product_id, ci.color, ci.quantity
    FROM public.cart_items ci
    WHERE ci.user_id = v_user_id
    ORDER BY ci.product_id, ci.id
  LOOP
    SELECT id, name, price, stock
    INTO v_product
    FROM public.products
    WHERE id = v_item.product_id;

    SELECT image_url INTO v_primary_image
    FROM public.product_images
    WHERE product_id = v_item.product_id
    ORDER BY is_primary DESC, sort_order ASC
    LIMIT 1;

    INSERT INTO public.order_items (
      order_id,
      product_id,
      product_name,
      product_image_url,
      color,
      quantity,
      unit_price
    ) VALUES (
      v_order_id,
      v_product.id,
      v_product.name,
      v_primary_image,
      v_item.color,
      v_item.quantity,
      v_product.price
    );

    UPDATE public.products
    SET stock = stock - v_item.quantity,
        updated_at = now()
    WHERE id = v_product.id;
  END LOOP;

  -- 9. Clear customer's cart
  DELETE FROM public.cart_items
  WHERE user_id = v_user_id;

  -- 10. Initial shipping event
  INSERT INTO public.shipping_events (
    order_id,
    status,
    description
  ) VALUES (
    v_order_id,
    'order_placed',
    'Order placed successfully and is awaiting customer confirmation.'
  );

  SELECT jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'status', 'pending_customer_confirmation',
    'payment_method', p_payment_method,
    'payment_status', 'pending',
    'subtotal', v_subtotal,
    'shipping_fee', p_shipping_fee,
    'discount_amount', p_discount_amount,
    'total', v_total
  ) INTO v_result;

  RETURN v_result;
END;
$function$;

-- ===========================================================================
-- 2. admin_create_or_send_quote  (Task 1: custom_print_quotes.total_price is generated)
--    Signature unchanged (9 params). Only the explicit total_price INSERT is removed;
--    the generated value is captured by `RETURNING * INTO v_quote`.
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
  p_status text DEFAULT 'sent'
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
  v_valid_until timestamptz;
  v_quote record;
BEGIN
  v_admin_id := auth.uid();
  IF v_admin_id IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator privileges required' USING ERRCODE = 'P0015';
  END IF;

  SELECT * INTO v_request
  FROM public.custom_print_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Custom print request not found' USING ERRCODE = 'P0008';
  END IF;

  -- Cannot quote a closed / rejected request
  IF v_request.status IN ('completed', 'cancelled', 'rejected') THEN
    RAISE EXCEPTION 'Cannot quote a request in status "%"', v_request.status USING ERRCODE = 'P0013';
  END IF;

  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be greater than zero' USING ERRCODE = 'P0021';
  END IF;

  IF p_unit_price < 0 THEN
    RAISE EXCEPTION 'Unit price cannot be negative' USING ERRCODE = 'P0022';
  END IF;

  SELECT COALESCE(MAX(version), 0) INTO v_max_version
  FROM public.custom_print_quotes
  WHERE request_id = p_request_id;

  v_new_version := v_max_version + 1;
  v_valid_until := now() + (COALESCE(p_valid_days, 7) || ' days')::interval;

  -- total_price is a GENERATED column (quantity * unit_price): DO NOT insert it.
  INSERT INTO public.custom_print_quotes (
    request_id,
    version,
    description,
    material,
    color,
    quantity,
    unit_price,
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
    p_estimated_days,
    p_status,
    v_valid_until,
    CASE WHEN p_status = 'sent' THEN now() ELSE NULL END,
    v_admin_id
  ) RETURNING * INTO v_quote;

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
-- 3. accept_custom_print_quote  (Task 5: order_items.line_total is generated)
--    order_number GENERATED ALWAYS identity + line_total generated both respected.
--    orders.subtotal/total are regular columns and are still written from v_subtotal.
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

  -- Idempotency: if already accepted, return the existing order
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

  IF v_quote.status <> 'sent' THEN
    RAISE EXCEPTION 'Quote cannot be accepted in status "%"', v_quote.status USING ERRCODE = 'P0023';
  END IF;

  IF v_quote.valid_until IS NOT NULL AND v_quote.valid_until < now() THEN
    UPDATE public.custom_print_quotes
    SET status = 'expired',
        updated_at = now()
    WHERE id = p_quote_id;

    RAISE EXCEPTION 'This quote expired on %', v_quote.valid_until USING ERRCODE = 'P0024';
  END IF;

  IF NOT (p_customer_phone ~ '^(010|011|012|015)[0-9]{8}$') THEN
    RAISE EXCEPTION 'Invalid Egyptian phone number. Must be 11 digits starting with 010, 011, 012, or 015' USING ERRCODE = 'P0002';
  END IF;

  IF p_payment_method NOT IN ('cod', 'instapay', 'vodafone_cash', 'online') THEN
    RAISE EXCEPTION 'Invalid payment method: %', p_payment_method USING ERRCODE = 'P0003';
  END IF;

  v_subtotal := ROUND(v_quote.unit_price * v_quote.quantity, 2);
  p_shipping_fee := ROUND(COALESCE(p_shipping_fee, 50), 2);
  v_total := ROUND(v_subtotal + p_shipping_fee, 2);

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
    'confirmed',
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

  -- 2. Line item snapshot. line_total is GENERATED: DO NOT insert it.
  INSERT INTO public.order_items (
    order_id,
    product_id,
    product_name,
    product_image_url,
    color,
    quantity,
    unit_price
  ) VALUES (
    v_order_id,
    NULL,
    'Custom 3D Print: ' || COALESCE(v_request.title, 'Request #' || v_request.request_number),
    v_primary_image,
    COALESCE(v_quote.color, v_request.preferred_color, 'Standard'),
    v_quote.quantity,
    v_quote.unit_price
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
-- Grants (re-asserted; preserved automatically on CREATE OR REPLACE) + cache reload
-- ===========================================================================
GRANT EXECUTE ON FUNCTION public.create_checkout_order(text, text, text, text, text, text, text, text, text, text, text, text, numeric, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_or_send_quote(uuid, text, text, text, integer, numeric, integer, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_custom_print_quote(uuid, text, text, text, text, text, text, text, text, text, text, text, text, numeric) TO authenticated;

NOTIFY pgrst, 'reload schema';
