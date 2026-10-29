import { createClient } from "@/lib/supabase/server";

export interface HomepageProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stock: number;
  material: string | null;
  available_colors: string[] | null;
  is_featured: boolean;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  images?: Array<{
    id: string;
    image_url: string;
    alt_text: string | null;
    is_primary: boolean;
    sort_order: number;
  }> | null;
}

export interface HomepageCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
}

export async function getFeaturedProducts(): Promise<HomepageProduct[]> {
  try {
    const supabase = await createClient();

    // Query active products, prioritizing featured items
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
        is_featured,
        category:categories(id, name, slug),
        images:product_images(id, image_url, alt_text, is_primary, sort_order)
      `
      )
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(6);

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching featured products:", error.message);
      return [];
    }

    return (data as unknown as HomepageProduct[]) || [];
  } catch (err) {
    console.error("Failed to connect to database for featured products:", err);
    return [];
  }
}

export async function getCategories(): Promise<HomepageCategory[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug, description, image_url, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })
      .limit(6);

    if (error) {
      console.error("Error fetching categories:", error.message);
      return [];
    }

    return (data as unknown as HomepageCategory[]) || [];
  } catch (err) {
    console.error("Failed to connect to database for categories:", err);
    return [];
  }
}

