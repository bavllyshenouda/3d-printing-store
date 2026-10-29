-- Migration: Phase 5 Payments, Payment Proofs Management, and Verification RPCs
-- File: supabase/migrations/20261029_phase5_payments_and_proofs.sql

-- 1. Performance indexes for payments table
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_method ON public.payments(payment_method);

-- 2. Configure payment-proofs storage bucket constraints (5MB limit, specific image/pdf mime types)
UPDATE storage.buckets
SET file_size_limit = 5242880, -- 5 MB
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
WHERE id = 'payment-proofs';

-- 3. RPC: Retrieve or create initial payment record for an order
CREATE OR REPLACE FUNCTION public.get_or_create_order_payment(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_is_admin boolean;
  v_order record;
  v_payment record;
  v_payment_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = 'P0001';
  END IF;

  v_is_admin := public.is_admin();

  -- Retrieve order
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found' USING ERRCODE = 'P0008';
  END IF;

  -- Verify ownership
  IF NOT v_is_admin AND v_order.user_id <> v_user_id THEN
    RAISE EXCEPTION 'Access denied. You do not own this order' USING ERRCODE = 'P0009';
  END IF;

  -- Check if payment already exists
  SELECT * INTO v_payment
  FROM public.payments
  WHERE order_id = p_order_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN to_jsonb(v_payment);
  END IF;

  -- Create initial payment record matching order total and method
  INSERT INTO public.payments (
    order_id,
    payment_method,
    status,
    amount,
    currency
  ) VALUES (
    p_order_id,
    v_order.payment_method,
    v_order.payment_status,
    v_order.total,
    v_order.currency
  ) RETURNING * INTO v_payment;

  RETURN to_jsonb(v_payment);
END;
$$;

-- 4. RPC: Customer submits payment proof
CREATE OR REPLACE FUNCTION public.submit_payment_proof(
  p_order_id uuid,
  p_proof_storage_path text,
  p_transaction_reference text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_order record;
  v_payment record;
  v_payment_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = 'P0001';
  END IF;

  -- Retrieve order with row lock
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found' USING ERRCODE = 'P0008';
  END IF;

  -- Ownership check
  IF v_order.user_id <> v_user_id THEN
    RAISE EXCEPTION 'Access denied. You do not own this order' USING ERRCODE = 'P0009';
  END IF;

  -- Check payment method: COD cannot submit proofs
  IF v_order.payment_method = 'cod' THEN
    RAISE EXCEPTION 'Cash on Delivery orders do not require proof of payment' USING ERRCODE = 'P0011';
  END IF;

  IF v_order.payment_method NOT IN ('instapay', 'vodafone_cash') THEN
    RAISE EXCEPTION 'Payment method "%" does not support payment proof upload', v_order.payment_method USING ERRCODE = 'P0012';
  END IF;

  -- Ensure order is confirmed (or auto-confirm if pending confirmation)
  IF v_order.status = 'pending_customer_confirmation' THEN
    UPDATE public.orders
    SET status = 'confirmed',
        customer_confirmation_at = COALESCE(customer_confirmation_at, now()),
        confirmed_at = COALESCE(confirmed_at, now()),
        updated_at = now()
    WHERE id = p_order_id;
  ELSIF v_order.status IN ('cancelled', 'rejected', 'delivered') THEN
    RAISE EXCEPTION 'Cannot submit payment proof for order in status "%"', v_order.status USING ERRCODE = 'P0013';
  END IF;

  -- Check payment status: cannot re-submit if already paid
  IF v_order.payment_status = 'paid' THEN
    RAISE EXCEPTION 'Order is already marked as paid' USING ERRCODE = 'P0014';
  END IF;

  -- Check or create payment record
  SELECT id INTO v_payment_id
  FROM public.payments
  WHERE order_id = p_order_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_payment_id IS NOT NULL THEN
    UPDATE public.payments
    SET proof_storage_path = p_proof_storage_path,
        transaction_reference = COALESCE(p_transaction_reference, transaction_reference),
        status = 'awaiting_verification',
        notes = COALESCE(p_notes, notes),
        updated_at = now()
    WHERE id = v_payment_id
    RETURNING * INTO v_payment;
  ELSE
    INSERT INTO public.payments (
      order_id,
      payment_method,
      status,
      amount,
      currency,
      proof_storage_path,
      transaction_reference,
      notes
    ) VALUES (
      p_order_id,
      v_order.payment_method,
      'awaiting_verification',
      v_order.total,
      v_order.currency,
      p_proof_storage_path,
      p_transaction_reference,
      p_notes
    ) RETURNING * INTO v_payment;
  END IF;

  -- Update order payment status to awaiting_verification
  UPDATE public.orders
  SET payment_status = 'awaiting_verification',
      updated_at = now()
  WHERE id = p_order_id;

  -- Insert audit / shipping event
  INSERT INTO public.shipping_events (
    order_id,
    status,
    description
  ) VALUES (
    p_order_id,
    'awaiting_verification',
    'Customer submitted proof of payment (' || v_order.payment_method || '). Awaiting admin verification.'
  );

  RETURN to_jsonb(v_payment);
END;
$$;

-- 5. RPC: Administrator reviews payment proof (Approve / Reject)
CREATE OR REPLACE FUNCTION public.admin_review_payment(
  p_payment_id uuid,
  p_action text, -- 'approve' or 'reject'
  p_notes text DEFAULT NULL,
  p_transaction_reference text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id uuid;
  v_payment record;
  v_order record;
  v_new_payment_status text;
  v_new_order_status text;
BEGIN
  v_admin_id := auth.uid();
  IF v_admin_id IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator privileges required' USING ERRCODE = 'P0015';
  END IF;

  IF p_action NOT IN ('approve', 'reject') THEN
    RAISE EXCEPTION 'Invalid review action "%". Must be "approve" or "reject"', p_action USING ERRCODE = 'P0016';
  END IF;

  -- Retrieve payment record with row lock
  SELECT * INTO v_payment
  FROM public.payments
  WHERE id = p_payment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment record not found' USING ERRCODE = 'P0017';
  END IF;

  -- Prevent repeated reviews on already paid or refunded payments
  IF v_payment.status = 'paid' THEN
    RAISE EXCEPTION 'Payment is already approved and verified as paid' USING ERRCODE = 'P0018';
  END IF;

  IF v_payment.status = 'refunded' THEN
    RAISE EXCEPTION 'Cannot review refunded payment' USING ERRCODE = 'P0019';
  END IF;

  -- Retrieve associated order with lock
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = v_payment.order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Associated order not found' USING ERRCODE = 'P0008';
  END IF;

  IF p_action = 'approve' THEN
    v_new_payment_status := 'paid';
    -- If order was pending confirmation or confirmed, advance to processing
    IF v_order.status IN ('pending_customer_confirmation', 'confirmed') THEN
      v_new_order_status := 'processing';
    ELSE
      v_new_order_status := v_order.status;
    END IF;

    -- Update payments
    UPDATE public.payments
    SET status = 'paid',
        verified_by = v_admin_id,
        verified_at = now(),
        transaction_reference = COALESCE(p_transaction_reference, transaction_reference),
        notes = COALESCE(p_notes, notes, 'Payment verified and approved by administrator'),
        updated_at = now()
    WHERE id = p_payment_id
    RETURNING * INTO v_payment;

    -- Update orders
    UPDATE public.orders
    SET payment_status = 'paid',
        status = v_new_order_status,
        updated_at = now()
    WHERE id = v_order.id;

    -- Log shipping / timeline event
    INSERT INTO public.shipping_events (
      order_id,
      status,
      description
    ) VALUES (
      v_order.id,
      'payment_verified',
      COALESCE(p_notes, 'Payment verified and approved by administrator. Order is now processing.')
    );

  ELSIF p_action = 'reject' THEN
    IF p_notes IS NULL OR TRIM(p_notes) = '' THEN
      RAISE EXCEPTION 'A rejection reason is required when rejecting payment proof' USING ERRCODE = 'P0020';
    END IF;

    v_new_payment_status := 'failed';

    -- Update payments
    UPDATE public.payments
    SET status = 'failed',
        verified_by = v_admin_id,
        verified_at = now(),
        notes = p_notes,
        updated_at = now()
    WHERE id = p_payment_id
    RETURNING * INTO v_payment;

    -- Update orders payment status
    UPDATE public.orders
    SET payment_status = 'failed',
        updated_at = now()
    WHERE id = v_order.id;

    -- Log shipping / timeline event
    INSERT INTO public.shipping_events (
      order_id,
      status,
      description
    ) VALUES (
      v_order.id,
      'payment_rejected',
      'Payment proof rejected by administrator: ' || p_notes
    );
  END IF;

  RETURN jsonb_build_object(
    'payment', to_jsonb(v_payment),
    'order_id', v_order.id,
    'payment_status', v_new_payment_status,
    'order_status', COALESCE(v_new_order_status, v_order.status),
    'message', CASE WHEN p_action = 'approve' THEN 'Payment approved successfully' ELSE 'Payment rejected' END
  );
END;
$$;

