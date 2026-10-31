import { headers } from "next/headers";

/**
 * Resolve the absolute base URL (origin) used to build auth redirect links
 * (OAuth `redirectTo` and email verification `emailRedirectTo`).
 *
 * Works both in Route Handlers (a `Request` is available) and in Server
 * Actions / Server Components (falls back to the `headers()` store). Honors the
 * `x-forwarded-host` header in production so links match the public host behind
 * a proxy (e.g. Vercel), while using the raw origin in local development.
 */
export async function getAuthBaseUrl(request?: Request): Promise<string> {
  const headerStore = await headers();
  const forwardedHost =
    headerStore.get("x-forwarded-host") ??
    (request ? request.headers.get("x-forwarded-host") : null);
  const isLocalEnv = process.env.NODE_ENV === "development";

  if (!isLocalEnv && forwardedHost) {
    return `https://${forwardedHost}`;
  }

  if (request) {
    return new URL(request.url).origin;
  }

  const host = headerStore.get("host");
  if (host) {
    return `http${isLocalEnv ? "" : "s"}://${host}`;
  }

  // Last resort fallback for local development
  return "http://localhost:3000";
}

/**
 * Sanitize a `next`/`redirect` value so it can only ever be an internal,
 * relative path. Prevents open-redirect attacks.
 */
export function safeInternalPath(
  value: string | null | undefined,
  fallback = "/profile"
): string {
  return value && value.startsWith("/") && !value.startsWith("//")
    ? value
    : fallback;
}
