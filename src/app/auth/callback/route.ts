import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeInternalPath } from "@/lib/auth/safe-redirect";

const ALLOWED_OTP_TYPES = [
  "signup",
  "email",
  "recovery",
  "magiclink",
  "invite",
  "email_change",
] as const;

type AllowedOtpType = (typeof ALLOWED_OTP_TYPES)[number];

function isValidOtpType(type: string | null): type is AllowedOtpType {
  return typeof type === "string" && (ALLOWED_OTP_TYPES as readonly string[]).includes(type);
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const next = searchParams.get("next");

  // Prevent open redirect attacks by ensuring "next" is a relative internal path
  const safeNext = safeInternalPath(next, "/profile");

  let baseOrigin: string;
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");

  if (configuredSiteUrl) {
    baseOrigin = configuredSiteUrl;
  } else if (process.env.NODE_ENV === "development") {
    const forwardedHost = request.headers.get("x-forwarded-host");
    const host = request.headers.get("host");
    baseOrigin = forwardedHost
      ? `http://${forwardedHost}`
      : host
      ? `http://${host}`
      : origin;
  } else {
    console.error("NEXT_PUBLIC_SITE_URL is not set in production. Falling back to request origin.");
    baseOrigin = origin;
  }

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

  if (tokenHash) {
    if (!isValidOtpType(type)) {
      return redirectTo(
        `/auth/login?auth_error=${encodeURIComponent("Invalid verification type")}`
      );
    }

    // Email verification / recovery links using ?token_hash=&type=
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
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
