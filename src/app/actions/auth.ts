"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
} from "@/lib/validations/auth";

export interface ActionResult<T = unknown> {
  success: boolean;
  message?: string;
  error?: string;
  details?: Record<string, string[] | undefined>;
  data?: T;
}

/**
 * Server Action for Customer Registration
 */
export async function registerAction(
  formData: FormData
): Promise<ActionResult> {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name"),
    phone: formData.get("phone") || undefined,
  };

  const parseResult = registerSchema.safeParse(rawData);
  if (!parseResult.success) {
    return {
      success: false,
      error: "Validation failed",
      details: parseResult.error.flatten().fieldErrors,
    };
  }

  const { email, password, first_name, last_name, phone } = parseResult.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name,
        last_name,
        phone: phone || null,
      },
    },
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  const isEmailConfirmationRequired =
    !data.session &&
    Boolean(
      data.user && (!data.user.confirmed_at || data.user.identities?.length === 0)
    );

  if (data.session && data.user && phone) {
    await supabase.from("profiles").update({ phone }).eq("id", data.user.id);
  }

  return {
    success: true,
    message: isEmailConfirmationRequired
      ? "Registration successful. Please check your email to confirm your account."
      : "Registration successful. User authenticated.",
    data: {
      user_id: data.user?.id,
      email: data.user?.email,
      email_confirmation_required: isEmailConfirmationRequired,
    },
  };
}

/**
 * Server Action for Customer Login
 */
export async function loginAction(formData: FormData): Promise<ActionResult> {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parseResult = loginSchema.safeParse(rawData);
  if (!parseResult.success) {
    return {
      success: false,
      error: "Validation failed",
      details: parseResult.error.flatten().fieldErrors,
    };
  }

  const { email, password } = parseResult.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  revalidatePath("/", "layout");

  return {
    success: true,
    message: "Logged in successfully",
    data: {
      user_id: data.user.id,
      email: data.user.email,
    },
  };
}

/**
 * Server Action for Customer Logout
 */
export async function logoutAction(): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  revalidatePath("/", "layout");

  return {
    success: true,
    message: "Logged out successfully",
  };
}

/**
 * Server Action for Updating Customer Profile
 */
export async function updateProfileAction(
  formData: FormData
): Promise<ActionResult> {
  const rawData: Record<string, unknown> = {};

  if (formData.has("first_name")) rawData.first_name = formData.get("first_name");
  if (formData.has("last_name")) rawData.last_name = formData.get("last_name");
  if (formData.has("phone")) rawData.phone = formData.get("phone");

  const parseResult = updateProfileSchema.safeParse(rawData);
  if (!parseResult.success) {
    return {
      success: false,
      error: "Validation failed",
      details: parseResult.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      error: "Unauthorized: User session not found",
    };
  }

  const { first_name, last_name, phone } = parseResult.data;
  const updateData: {
    first_name?: string;
    last_name?: string;
    phone?: string | null;
    updated_at: string;
  } = {
    updated_at: new Date().toISOString(),
  };

  if (first_name !== undefined) updateData.first_name = first_name;
  if (last_name !== undefined) updateData.last_name = last_name;
  if (phone !== undefined) updateData.phone = phone;

  const { data: updatedProfile, error: updateError } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", user.id)
    .select()
    .single();

  if (updateError) {
    return {
      success: false,
      error: updateError.message,
    };
  }

  revalidatePath("/profile");

  return {
    success: true,
    message: "Profile updated successfully",
    data: updatedProfile,
  };
}

