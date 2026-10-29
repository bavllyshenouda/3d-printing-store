-- Migration: Phase 4 Orders, Checkout, Inventory Concurrency, and Order Cancellation
-- File: supabase/migrations/20261029_phase4_orders_and_checkout.sql

-- 1. Create sequence for human-readable, sequential, unique order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 100001;

-- Set default for order_number in orders table if not already set
ALTER TABLE public.orders 
  ALTER COLUMN order_number SET DEFAULT nextval('order_number_seq');

-- 2. Performance indexes for checkout and order management
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_user_id ON public.customer_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_shipping_events_order_id ON public.shipping_events(order_id);

-- 3. Atomic Checkout RPC Function
-- Executes inside a single transaction with FOR UPDATE locks to prevent race conditions and overselling.
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

-- 4. Atomic Order Cancellation RPC Function
-- Cancels order and restores stock atomically
CREATE OR REPLACE FUNCTION public.cancel_order_and_restore_stock(
  p_order_id uuid,
  p_reason text DEFAULT 'Customer requested cancellation'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_is_admin boolean;
  v_order record;
  v_item record;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = 'P0001';
  END IF;

  v_is_admin := public.is_admin();

  -- Lock order row
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found' USING ERRCODE = 'P0008';
  END IF;

  -- Ownership check: Customer can only cancel their own order
  IF NOT v_is_admin AND v_order.user_id <> v_user_id THEN
    RAISE EXCEPTION 'Access denied. You do not own this order' USING ERRCODE = 'P0009';
  END IF;

  -- Check if order can be cancelled
  IF v_order.status IN ('cancelled', 'rejected', 'shipped', 'delivered') THEN
    RAISE EXCEPTION 'Order cannot be cancelled in status: %', v_order.status USING ERRCODE = 'P0010';
  END IF;

  -- Restore stock for all products in order
  FOR v_item IN
    SELECT product_id, quantity
    FROM public.order_items
    WHERE order_id = p_order_id AND product_id IS NOT NULL
  LOOP
    UPDATE public.products
    SET stock = stock + v_item.quantity,
        updated_at = now()
    WHERE id = v_item.product_id;
  END LOOP;

  -- Update order status
  UPDATE public.orders
  SET status = 'cancelled',
      cancelled_at = now(),
      updated_at = now()
  WHERE id = p_order_id;

  -- Insert shipping/audit event
  INSERT INTO public.shipping_events (
    order_id,
    status,
    description
  ) VALUES (
    p_order_id,
    'cancelled',
    p_reason
  );

  RETURN jsonb_build_object(
    'order_id', p_order_id,
    'status', 'cancelled',
    'message', 'Order cancelled and inventory restored successfully'
  );
END;
$$;

