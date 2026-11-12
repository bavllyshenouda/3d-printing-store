/**
 * Sanitize a redirect path so it can only ever be an internal, relative path.
 * Prevents open-redirect attacks including backslashes, protocol-relative URLs,
 * control characters, and scheme injections.
 *
 * Client-safe: Does not import any server-only modules (such as next/headers).
 */
export function safeInternalPath(
  value: string | null | undefined,
  fallback = "/profile"
): string {
  if (!value || typeof value !== "string") {
    return fallback;
  }

  // Must start with a single "/" and not "//"
  if (!value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  // Reject raw backslash and control characters (0x00-0x1F, 0x7F)
  if (value.includes("\\") || /[\x00-\x1F\x7F]/.test(value)) {
    return fallback;
  }

  // Reject URL-encoded backslashes (%5c or %5C)
  if (/%5c/i.test(value)) {
    return fallback;
  }

  // Check decoded value for backslashes or control characters
  try {
    const decoded = decodeURIComponent(value);
    if (decoded.includes("\\") || /[\x00-\x1F\x7F]/.test(decoded)) {
      return fallback;
    }
  } catch {
    // Malformed URI sequence
    return fallback;
  }

  // Final check: resolve against dummy base and verify origin is unchanged
  try {
    const resolved = new URL(value, "http://localhost");
    if (resolved.origin !== "http://localhost") {
      return fallback;
    }
  } catch {
    return fallback;
  }

  return value;
}

