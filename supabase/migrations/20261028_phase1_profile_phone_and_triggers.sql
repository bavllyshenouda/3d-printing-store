-- ==============================================================================
-- Phase 1 Migration: Profile Enhancements, Egyptian Phone Constraint & OAuth Triggers
-- ==============================================================================

-- 1. Ensure phone number constraint adheres to Egyptian mobile phone format:
-- Exactly 11 digits, starting with 010, 011, 012, or 015.
-- NULL is permitted because phone may be completed after signup.
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS check_egyptian_phone;

ALTER TABLE public.profiles
  ADD CONSTRAINT check_egyptian_phone
  CHECK (phone IS NULL OR phone ~ '^01[0125][0-9]{8}$');

-- 2. Enhance handle_new_user() trigger function:
-- - Extracts phone number from user metadata (if provided during signup).
-- - Handles Google OAuth metadata (given_name / family_name or full_name splitting).
-- - Preserves SECURITY DEFINER with empty search_path for defense against search_path hijacking.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_first_name text;
  v_last_name text;
  v_phone text;
BEGIN
  -- Extract names: first check explicit metadata, then fallback to OAuth providers (e.g. Google)
  v_first_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data ->> 'first_name', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'given_name', ''),
    NULLIF(split_part(NEW.raw_user_meta_data ->> 'full_name', ' ', 1), ''),
    NULLIF(split_part(NEW.raw_user_meta_data ->> 'name', ' ', 1), '')
  );

  v_last_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data ->> 'last_name', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'family_name', ''),
    NULLIF(substr(NEW.raw_user_meta_data ->> 'full_name', length(split_part(NEW.raw_user_meta_data ->> 'full_name', ' ', 1)) + 2), ''),
    NULLIF(substr(NEW.raw_user_meta_data ->> 'name', length(split_part(NEW.raw_user_meta_data ->> 'name', ' ', 1)) + 2), '')
  );

  -- Extract phone if provided
  v_phone := NULLIF(NEW.raw_user_meta_data ->> 'phone', '');

  -- Insert profile, or update on conflict (e.g. when provider links)
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    phone,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_first_name,
    v_last_name,
    v_phone,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    updated_at = now();

  RETURN NEW;
END;
$$;

