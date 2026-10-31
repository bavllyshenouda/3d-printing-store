-- Migration: Hotfix for checkout RPC error
--   "Could not find the function public.create_checkout_order(...) in the schema cache"
-- File: supabase/migrations/20261031_fix_create_checkout_order_schema_cache.sql
--
-- WHY THIS ERROR HAPPENS
-- PostgREST (the API layer Supabase exposes) resolves an RPC call by matching the
-- function NAME + the NAMED-ARGUMENT signature sent by the client, and it only exposes
-- functions that the calling role is allowed to EXECUTE. This error is raised at the
-- routing layer, BEFORE the function body runs, in any of these cases:
--   (a) the function does not exist in the live database (migration was never applied);
--   (b) the live function's parameter names/types differ from what /api/checkout sends
--       (e.g. an earlier draft of the function is what actually got created);
--   (c) an older OVERLOAD with a different signature still exists, so the call is ambiguous;
--   (d) EXECUTE was never granted to the `authenticated` role, so PostgREST hides the function
--       (checkout runs under the customer's JWT => the `authenticated` role);
--   (e) the PostgREST schema cache is stale (function created after the last cache reload).
--
-- The repo definition (20261029_phase4_orders_and_checkout.sql), the API call in
-- src/app/api/checkout/route.ts, and the generated types in src/types/database.ts already
-- agree EXACTLY (same 14 parameters, same names, same types). This migration makes the
-- live DATABASE match them and covers every cause above. It is safe and idempotent to re-run.
--
-- The function body is preserved verbatim from phase4 (single atomic transaction, FOR UPDATE
-- inventory locks, authoritative pricing, cart clearing) with ONE minimal, happy-path-safe
-- addition: a re-validation of the cart AFTER the product locks are taken (step 5b) to prevent
-- a phantom/duplicate order if two checkout requests race (see requirement: prevent duplicate
-- orders / incorrect stock deductions). Normal single checkouts are unaffected.

-- ---------------------------------------------------------------------------
-- 1. Drop EVERY existing overload of the function to remove stale/ambiguous signatures.
--    (Function identity in Postgres is name + parameter TYPES, so an older draft with even
--     slightly different types would coexist as an overload and break PostgREST resolution.)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'create_checkout_order'
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS %s', fn.signature);
  END LOOP;
END
$$;

-- ---------------------------------------------------------------------------
-- 2. Recreate the canonical function with the EXACT signature /api/checkout sends.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_checkout_order(
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
  p_shipping_fee numeric DEFAULT 0,
  p_discount_amount numeric DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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

  -- 5. Lock and validate each cart item's product to guarantee concurrency safety and prevent overselling
  -- Deterministic order by product_id prevents deadlocks
  FOR v_item IN
    SELECT ci.id AS cart_item_id, ci.product_id, ci.color, ci.quantity
    FROM public.cart_items ci
    WHERE ci.user_id = v_user_id
    ORDER BY ci.product_id, ci.id
  LOOP
    -- Lock product row
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

    -- Accumulate authoritative subtotal
    v_subtotal := v_subtotal + (v_product.price * v_item.quantity);
  END LOOP;

  -- 5b. Re-validate the cart AFTER acquiring the product locks (double-checked locking).
  -- If a concurrent checkout already completed and cleared this user's cart, the count is now 0
  -- and we abort the whole transaction, preventing a phantom/duplicate order with no line items.
  -- In a normal single checkout the cart is still intact here, so this never fires.
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

  -- 7. Generate order number
  v_order_number := nextval('order_number_seq');

  -- 8. Insert order record
  INSERT INTO public.orders (
    order_number,
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
    v_order_number,
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
  ) RETURNING id INTO v_order_id;

  -- 9. Insert order items, deduct inventory stock, and gather image snapshot
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

    -- Retrieve primary image for snapshot
    SELECT image_url INTO v_primary_image
    FROM public.product_images
    WHERE product_id = v_item.product_id
    ORDER BY is_primary DESC, sort_order ASC
    LIMIT 1;

    -- Insert order item snapshot
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
      v_product.id,
      v_product.name,
      v_primary_image,
      v_item.color,
      v_item.quantity,
      v_product.price,
      ROUND(v_product.price * v_item.quantity, 2)
    );

    -- Decrement product stock atomically
    UPDATE public.products
    SET stock = stock - v_item.quantity,
        updated_at = now()
    WHERE id = v_product.id;
  END LOOP;

  -- 10. Clear customer's cart
  DELETE FROM public.cart_items
  WHERE user_id = v_user_id;

  -- 11. Initial shipping event
  INSERT INTO public.shipping_events (
    order_id,
    status,
    description
  ) VALUES (
    v_order_id,
    'order_placed',
    'Order placed successfully and is awaiting customer confirmation.'
  );

  -- Return created order summary
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
$$;

COMMENT ON FUNCTION public.create_checkout_order(
  text, text, text, text, text, text, text, text, text, text, text, text, numeric, numeric
) IS 'Atomic customer checkout: validates cart, locks inventory (FOR UPDATE), creates the order and line items, deducts stock, and clears the cart in a single transaction.';

-- ---------------------------------------------------------------------------
-- 3. Expose the function to the role used by checkout (customer JWT => `authenticated`).
--    Without this grant PostgREST will not surface the function and the client receives
--    "Could not find the function ... in the schema cache".
-- ---------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.create_checkout_order(
  text, text, text, text, text, text, text, text, text, text, text, text, numeric, numeric
) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. Force PostgREST to reload its schema cache so the change is visible immediately
--    (no need to wait for the periodic reload or restart the API).
-- ---------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
