import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthBaseUrl } from "@/lib/auth/redirect";
import { z } from "zod";

const resendSchema = z.object({
  email: z.string().trim().min(1).email(),
});

/**
 * POST /api/auth/resend-verification
 * Re-sends the Supabase signup confirmation email. The confirmation link points
 * back to /auth/callback (via emailRedirectTo) which verifies the token_hash and
 * establishes the session.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resendSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "A valid email address is required." },
        { status: 400 }
      );
    }

    const baseUrl = await getAuthBaseUrl(request);
    const emailRedirectTo = `${baseUrl}/auth/callback?next=${encodeURIComponent(
      "/profile"
    )}`;

    const supabase = await createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: parsed.data.email,
      options: { emailRedirectTo },
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "If that email is registered and unconfirmed, a new verification link has been sent.",
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
