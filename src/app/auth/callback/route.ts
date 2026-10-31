import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const next = searchParams.get("next") ?? "/profile";

  // Prevent open redirect attacks by ensuring "next" is a relative internal path
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/profile";

  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";
  const baseOrigin =
    !isLocalEnv && forwardedHost ? `https://${forwardedHost}` : origin;

  const redirectTo = (path: string) =>
    NextResponse.redirect(`${baseOrigin}${path}`);

  // Supabase surfaced an auth error (e.g. expired/invalid link) -> show it on login
  if (errorParam || errorDescription) {
    const message = errorDescription || errorParam || "authentication_error";
    return redirectTo(
      `/auth/login?auth_error=${encodeURIComponent(message)}`
    );
  }

  if (code) {
    // PKCE flow: OAuth (Google) and magic/confirmation links using ?code=
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return redirectTo(safeNext);
    }

    return redirectTo(
      `/auth/login?auth_error=${encodeURIComponent(error.message)}`
    );
  }

  if (tokenHash && type) {
    // Email verification / recovery links using ?token_hash=&type=
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type: type as "email" | "signup" | "invite" | "magiclink" | "recovery" | "email_change",
      token_hash: tokenHash,
    });

    if (!error) {
      return redirectTo(safeNext);
    }

    return redirectTo(
      `/auth/login?auth_error=${encodeURIComponent(error.message)}`
    );
  }

  // Nothing to exchange -> go home
  return redirectTo("/");
}
