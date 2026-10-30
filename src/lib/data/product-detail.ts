import { createClient } from "@/lib/supabase/server";
import { CatalogProduct } from "./catalog";

export interface ProductDetailImage {
  id: string;
  image_url: string;
  alt_text: string | null;
  is_primary: boolean;
  sort_order: number;
}

export interface ProductDetailCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  is_active?: boolean;
}

export interface ProductDetail {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stock: number;
  material: string | null;
  available_colors: string[] | null;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  category: ProductDetailCategory | null;
  images: ProductDetailImage[];
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function getProductDetail(slugOrId: string): Promise<ProductDetail | null> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("products")
      .select(
        `
        id,
        category_id,
        name,
        slug,
        description,
        price,
        stock,
        material,
        available_colors,
        is_active,
        is_featured,
        created_at,
        updated_at,
        category:categories(id, name, slug, description, is_active),
        images:product_images(id, image_url, alt_text, is_primary, sort_order)
      `
      )
      .eq("is_active", true);

    if (UUID_REGEX.test(slugOrId)) {
      query = query.eq("id", slugOrId);
    } else {
      query = query.eq("slug", slugOrId);
    }

    const { data: rawProduct, error } = await query.maybeSingle();

    if (error) {
      console.error("Error fetching product detail:", error.message);
      return null;
    }

    if (!rawProduct) {
      return null;
    }

    // Sort images: primary first, then sort_order ascending
    const images = Array.isArray(rawProduct.images) ? [...rawProduct.images] : [];
    images.sort((a: any, b: any) => {
      if (a.is_primary === b.is_primary) {
        return a.sort_order - b.sort_order;
      }
      return a.is_primary ? -1 : 1;
    });

    return {
      ...rawProduct,
      price: Number(rawProduct.price),
      stock: Number(rawProduct.stock),
      images,
    } as unknown as ProductDetail;
  } catch (err) {
    console.error("Failed to connect to database for product detail:", err);
    return null;
  }
}

export async function getRelatedProducts(
  productId: string,
  categoryId?: string | null,
  limit = 4
): Promise<CatalogProduct[]> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("products")
      .select(
        `
        id,
        name,
        slug,
        description,
        price,
        stock,
        material,
        available_colors,
        is_active,
        is_featured,
        created_at,
        category:categories(id, name, slug),
        images:product_images(id, image_url, alt_text, is_primary, sort_order)
      `
      )
      .eq("is_active", true)
      .neq("id", productId);

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    query = query
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    const { data: primaryRelated, error } = await query;

    if (error) {
      console.error("Error fetching related products:", error.message);
      return [];
    }

    let products: CatalogProduct[] = (primaryRelated || []).map((p: any) => {
      const imgs = Array.isArray(p.images) ? [...p.images] : [];
      imgs.sort((a: any, b: any) => {
        if (a.is_primary === b.is_primary) return a.sort_order - b.sort_order;
        return a.is_primary ? -1 : 1;
      });
      return {
        ...p,
        price: Number(p.price),
        stock: Number(p.stock),
        images: imgs,
      };
    });

    // If we have fewer than limit products and we filtered by category, fetch more general products
    if (products.length < limit && categoryId) {
      const needed = limit - products.length;
      const existingIds = [productId, ...products.map((p) => p.id)];

      const { data: fallbackRelated } = await supabase
        .from("products")
        .select(
          `
          id,
          name,
          slug,
          description,
          price,
          stock,
          material,
          available_colors,
          is_active,
          is_featured,
          created_at,
          category:categories(id, name, slug),
          images:product_images(id, image_url, alt_text, is_primary, sort_order)
        `
        )
        .eq("is_active", true)
        .not("id", "in", `(${existingIds.join(",")})`)
        .order("created_at", { ascending: false })
        .limit(needed);

      if (fallbackRelated && fallbackRelated.length > 0) {
        const fallbacks: CatalogProduct[] = fallbackRelated.map((p: any) => {
          const imgs = Array.isArray(p.images) ? [...p.images] : [];
          imgs.sort((a: any, b: any) => {
            if (a.is_primary === b.is_primary) return a.sort_order - b.sort_order;
            return a.is_primary ? -1 : 1;
          });
          return {
            ...p,
            price: Number(p.price),
            stock: Number(p.stock),
            images: imgs,
          };
        });
        products = [...products, ...fallbacks];
      }
    }

    return products;
  } catch (err) {
    console.error("Failed to connect to database for related products:", err);
    return [];
  }
}

