type Translate = (key: string, params?: Record<string, string | number>) => string;

/**
 * Map raw Supabase Auth error strings to clear, localized user messages.
 * Falls back to the raw message when nothing matches so users still see
 * something meaningful (and never a blank/undefined error).
 */
export function resolveAuthMessage(
  raw: string | undefined | null,
  t: Translate,
  fallbackKey = "auth.errGeneric"
): string {
  const msg = (raw || "").toLowerCase();

  if (!msg) return t(fallbackKey);

  if (msg.includes("invalid login credentials") || msg.includes("invalid credentials")) {
    return t("auth.errInvalidCredentials");
  }
  if (msg.includes("email not confirmed")) {
    return t("auth.errEmailNotConfirmed");
  }
  if (
    msg.includes("already registered") ||
    msg.includes("already been registered") ||
    msg.includes("user already")
  ) {
    return t("auth.errEmailTaken");
  }
  if (msg.includes("password should be at least") || msg.includes("password is too weak")) {
    return t("auth.errPasswordShort");
  }
  if (msg.includes("rate limit") || msg.includes("too many requests") || msg.includes("try again")) {
    return t("auth.errRateLimit");
  }
  if (msg.includes("unable to validate oauth") || msg.includes("oauth")) {
    return t("auth.errOAuthGeneric");
  }
  if (msg.includes("email") && msg.includes("invalid")) {
    return t("auth.errEmailInvalid");
  }
  if (msg.includes("failed to fetch") || msg.includes("networkerror") || msg.includes("network")) {
    return t("auth.errNetwork");
  }

  // Unknown error: show the server-provided text if present, else generic.
  return raw && raw.trim() ? raw : t(fallbackKey);
}

/**
 * True when a Google/OAuth error indicates the provider is not configured in
 * the Supabase dashboard yet (so we can show setup guidance instead of a
 * generic failure).
 */
export function isOAuthNotConfigured(code?: string, raw?: string): boolean {
  if (code === "not_configured") return true;
  const msg = (raw || "").toLowerCase();
  return (
    msg.includes("provider") &&
    (msg.includes("not") || msg.includes("invalid") || msg.includes("disabled"))
  );
}
