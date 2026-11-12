import { headers } from "next/headers";
export { safeInternalPath } from "./safe-redirect";

/**
 * Resolve the absolute base URL (origin) used to build auth redirect links
 * (OAuth `redirectTo` and email verification `emailRedirectTo`).
 *
 * Prefers process.env.NEXT_PUBLIC_SITE_URL when set (stripping any trailing slash).
 * In development, falls back to forwarded/host headers or request origin.
 * In production, if NEXT_PUBLIC_SITE_URL is missing, logs an error and falls back
 * to the request origin (never trusting unvalidated forwarded headers).
 */
export async function getAuthBaseUrl(request?: Request): Promise<string> {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (configuredSiteUrl) {
    return configuredSiteUrl;
  }

  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    const headerStore = await headers();
    const forwardedHost =
      headerStore.get("x-forwarded-host") ??
      (request ? request.headers.get("x-forwarded-host") : null);

    if (forwardedHost) {
      return `http://${forwardedHost}`;
    }

    if (request) {
      return new URL(request.url).origin;
    }

    const host = headerStore.get("host");
    if (host) {
      return `http://${host}`;
    }

    return "http://localhost:3000";
  }

  // Production: NEXT_PUBLIC_SITE_URL is missing
  console.error("NEXT_PUBLIC_SITE_URL is not set in production. Falling back to request origin.");

  if (request) {
    return new URL(request.url).origin;
  }

  const headerStore = await headers();
  const host = headerStore.get("host");
  if (host) {
    return `https://${host}`;
  }

  return "http://localhost:3000";
}
