import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthBaseUrl, safeInternalPath } from "@/lib/auth/redirect";

/**
 * POST /api/auth/google
 * Initiates the Supabase "Sign in with Google" (OAuth) flow.
 *
 * Uses `skipBrowserRedirect: true` so the server returns the authorization URL
 * instead of issuing a 3xx redirect. The client then navigates to it with
 * `window.location.assign(url)`. This works reliably for both Sign-In and
 * Sign-Up: Supabase creates the user on first Google login, and the
 * `handle_new_user()` trigger maps Google metadata (given_name/family_name)
 * into the profiles table with ON CONFLICT DO UPDATE (no duplicate profiles).
 *
 * NOTE: This requires the Google provider to be enabled and configured in the
 * Supabase dashboard (Authentication -> Providers -> Google). If it is not
 * configured, Supabase returns an error which we surface to the client as
 * `not_configured` so the UI can show a clear message instead of failing
 * silently.
 */
export async function POST(request: Request) {
  try {
    let next: string | null = null;
    try {
      const body = await request.json();
      next = typeof body?.next === "string" ? body.next : null;
    } catch {
      // Body is optional
    }

    const baseUrl = await getAuthBaseUrl(request);
    const safeNext = safeInternalPath(next, "/profile");
    const redirectTo = `${baseUrl}/auth/callback?next=${encodeURIComponent(
      safeNext
    )}`;

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error || !data?.url) {
      const message = error?.message || "Unable to start Google sign-in";
      const notConfigured =
        /provider|oauth|not enabled|invalid|configuration/i.test(message);
      return NextResponse.json(
        {
          success: false,
          error: message,
          code: notConfigured ? "not_configured" : "oauth_error",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: { url: data.url },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal Server Error",
        code: "server_error",
      },
      { status: 500 }
    );
  }
}
