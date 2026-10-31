import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

/**
 * Order line-item image resolution.
 *
 * `order_items.product_image_url` is a snapshot column with TWO possible shapes:
 *  1. Regular checkout items  -> an ABSOLUTE public URL (from `product_images.image_url`).
 *  2. Custom-print items      -> a RAW Storage object path inside the PRIVATE
 *                                `custom-print-files` bucket (from `custom_print_files.storage_path`,
 *                                e.g. "<userId>/<requestId>/<ts>-<file>.jpeg"). These items have
 *                                `product_id = NULL`.
 *
 * Passing shape (2) straight to `next/image` throws:
 *   "Failed to parse src ... if using relative image it must start with a leading slash".
 * This module turns any stored value into a URL that `next/image` can render, WITHOUT ever
 * exposing private files publicly: private paths become short-lived signed URLs.
 */

const ABSOLUTE_URL_RE = /^https?:\/\//i;
const PRODUCT_IMAGES_BUCKET = "product-images";
const CUSTOM_PRINT_FILES_BUCKET = "custom-print-files";
/** Signed URL lifetime (seconds). Matches the existing custom-print preview route (15 min). */
const SIGNED_URL_TTL_SECONDS = 900;

export interface OrderItemImageSource {
  product_id?: string | null;
  product_image_url?: string | null;
}

/**
 * Resolve a single order item's stored image value into a renderable URL.
 * Returns `null` when there is no usable image so callers can fall back to a placeholder.
 */
export async function resolveOrderItemImageUrl(
  supabase: SupabaseClient<Database>,
  item: OrderItemImageSource
): Promise<string | null> {
  const raw = item.product_image_url;
  if (typeof raw !== "string") return null;

  const value = raw.trim();
  if (!value) return null;

  // Already an absolute URL (regular product snapshot) -> use as-is.
  if (ABSOLUTE_URL_RE.test(value)) return value;

  // Otherwise it's a Storage object path. Strip any leading slashes so the SDK
  // receives a bucket-relative key.
  const path = value.replace(/^\/+/, "");
  if (!path) return null;

  try {
    if (item.product_id == null) {
      // Custom-print item: the file lives in the PRIVATE bucket -> short-lived signed URL.
      const { data, error } = await supabase.storage
        .from(CUSTOM_PRINT_FILES_BUCKET)
        .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

      if (error || !data?.signedUrl) return null;
      return data.signedUrl;
    }

    // Regular item that (defensively) holds a path instead of a URL -> public bucket URL.
    const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path);
    return data?.publicUrl ?? null;
  } catch {
    // Expired/invalid path, missing object, or network failure -> graceful fallback.
    return null;
  }
}

/**
 * Resolve images for a list of order items in parallel, returning new objects with
 * `product_image_url` replaced by a renderable URL (or `null`). The input array is not mutated.
 */
export async function resolveOrderItemImages<T extends OrderItemImageSource>(
  supabase: SupabaseClient<Database>,
  items: T[] | null | undefined
): Promise<T[]> {
  if (!Array.isArray(items)) return [];

  return Promise.all(
    items.map(async (item) => ({
      ...item,
      product_image_url: await resolveOrderItemImageUrl(supabase, item),
    }))
  );
}
