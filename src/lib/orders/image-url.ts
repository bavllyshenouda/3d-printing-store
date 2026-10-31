/**
 * Client-safe guard for order line-item images.
 *
 * After server-side resolution (`@/lib/orders/order-item-image`), `product_image_url`
 * is normally an absolute Supabase URL (public or short-lived signed) or `null`.
 * This guard makes sure `next/image` is never handed a raw Storage object path,
 * which throws "Failed to parse src ... must start with a leading slash". When the
 * value is not a renderable absolute URL, callers fall back to the existing
 * placeholder instead of crashing.
 *
 * Kept free of any Supabase import so it is safe to bundle into client components.
 */
export function isRenderableImageUrl(src: unknown): src is string {
  return typeof src === "string" && /^https?:\/\//i.test(src.trim());
}
