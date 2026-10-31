-- Migration: Fix checkout 500 -- "cannot insert a non-DEFAULT value into column order_number"
-- File: supabase/migrations/20261031_fix_checkout_order_number_identity.sql
--
-- ROOT CAUSE (confirmed from the live export supabase/tables.csv + supabase/functions.csv)
--   * tables.csv L85: public.orders.order_number is  is_identity=YES, identity_generation=ALWAYS
--     => it is a GENERATED ALWAYS AS IDENTITY column. Postgres FORBIDS inserting an explicit
--        value into a GENERATED ALWAYS identity column (unless OVERRIDING SYSTEM VALUE).
--   * functions.csv L100-L149: the deployed public.create_checkout_order() still does
--        v_order_number := nextval('order_number_seq');
--        INSERT INTO public.orders (order_number, ...) VALUES (v_order_number, ...);
--     The earlier migration 20261031_fix_order_number_sequence.sql created that sequence, so
--     nextval() now SUCCEEDS -- which only advanced the failure from
--     'relation "order_number_seq" does not exist'  to  'cannot insert a non-DEFAULT value'.
--
-- FIX (minimal, non-destructive; NO column type / identity configuration change)
--   Redefine create_checkout_order() so it STOPS inserting order_number and lets the
--   GENERATED ALWAYS identity generate it, capturing the value via RETURNING for the JSON
--   response. This is the single consistent order-number mechanism compatible with the real
--   schema. Identity generation is atomic => order numbers stay unique under concurrency.
--   Everything else (validation, FOR UPDATE product locks, double-checked cart re-validation,
--   pricing, stock decrement, cart clear, shipping event) is preserved byte-for-byte.
--
-- NOTE: after this change the standalone sequence public.order_number_seq is unused (orphan).
--   It is harmless to leave. To remove it later (optional, requires your approval):
--     DROP SEQUENCE IF EXISTS public.order_number_seq;
--
-- Apply in the Supabase SQL Editor, then refresh PostgREST (NOTIFY at the bottom).

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

  -- 7. Insert order record.
  --    order_number is a GENERATED ALWAYS identity column: DO NOT insert it explicitly.
  --    Postgres generates it atomically (unique under concurrency) and we read it back via RETURNING.
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

  -- 8. Insert order items, deduct inventory stock, and gather image snapshot
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
$function$;

-- Refresh the PostgREST schema cache so the redefined function is discoverable immediately.
NOTIFY pgrst, 'reload schema';
