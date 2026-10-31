import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { registerSchema } from "@/lib/validations/auth";
import { getAuthBaseUrl } from "@/lib/auth/redirect";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parseResult = registerSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, password, first_name, last_name, phone } = parseResult.data;
    const supabase = await createClient();
    const baseUrl = await getAuthBaseUrl(request);

    // Sign up with Supabase Auth.
    // User metadata (first_name, last_name, phone) is passed to trigger handle_new_user()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Send the email-confirmation link back to our callback so the session
        // is established in this app after the user verifies their address.
        emailRedirectTo: `${baseUrl}/auth/callback?next=${encodeURIComponent(
          "/profile"
        )}`,
        data: {
          first_name,
          last_name,
          phone: phone || null,
        },
      },
    });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 400 }
      );
    }

    const user = data.user;
    const session = data.session;

    // Check if email confirmation is required:
    // If confirmation is required, session will be null and identities may be empty or user not confirmed.
    const isEmailConfirmationRequired =
      !session && Boolean(user && (!user.confirmed_at || user.identities?.length === 0));

    // If session was immediately established and a phone number was supplied,
    // ensure the profile record has the phone number populated
    if (session && user && phone) {
      await supabase
        .from("profiles")
        .update({ phone })
        .eq("id", user.id);
    }

    return NextResponse.json(
      {
        success: true,
        message: isEmailConfirmationRequired
          ? "Registration successful. Please check your email to confirm your account."
          : "Registration successful. User authenticated.",
        data: {
          user: user
            ? {
                id: user.id,
                email: user.email,
                first_name,
                last_name,
                phone: phone || null,
                email_confirmed_at: user.confirmed_at,
              }
            : null,
          session: session
            ? {
                access_token: session.access_token,
                refresh_token: session.refresh_token,
                expires_at: session.expires_at,
                token_type: session.token_type,
              }
            : null,
          email_confirmation_required: isEmailConfirmationRequired,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}

