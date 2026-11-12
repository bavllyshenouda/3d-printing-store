/**
 * PostgREST query sanitization utilities.
 * Protects against PostgREST filter injection and wildcard abuse in Supabase queries.
 */

/**
 * Sanitizes search terms before interpolating into PostgREST filter expressions (such as .or()).
 * Removes characters with special grammatical meaning in PostgREST syntax:
 * commas (,), parentheses (()), dots (.), quotes (", '), backslashes (\), and wildcards (%, _, *).
 * Trims whitespace and enforces a maximum length of 100 characters.
 */
export function sanitizePostgrestFilter(
  term: string | null | undefined,
  maxLength = 100
): string {
  if (!term) return "";
  return term
    .replace(/[,()"'\\%_*.]/g, "")
    .trim()
    .slice(0, maxLength);
}

/**
 * Escapes SQL / PostgREST ILIKE wildcard characters (% and _) with a backslash.
 * Limits the input string to maxLength (default 100).
 */
export function escapeIlikePattern(
  term: string | null | undefined,
  maxLength = 100
): string {
  if (!term) return "";
  return term
    .slice(0, maxLength)
    .replace(/[%_\\]/g, "\\$&");
}

