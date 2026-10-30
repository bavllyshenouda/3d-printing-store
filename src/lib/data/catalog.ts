import { createClient } from "@/lib/supabase/server";

export interface CatalogProduct {
  id: string;
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
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  images: Array<{
    id: string;
    image_url: string;
    alt_text: string | null;
    is_primary: boolean;
    sort_order: number;
  }>;
}

export interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
}

export interface CatalogQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  min_price?: number;
  max_price?: number;
  material?: string;
  search?: string;
  sort?: "newest" | "oldest" | "price_asc" | "price_desc" | "name_asc" | "name_desc";
  in_stock_only?: boolean;
}

export interface CatalogPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface CatalogResult {
  products: CatalogProduct[];
  categories: CatalogCategory[];
  availableMaterials: string[];
  pagination: CatalogPagination;
  priceRange: {
    min: number;
    max: number;
  };
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const STANDARD_MATERIALS = [
  "PLA+",
  "PETG",
  "PETG-CF",
  "ABS",
  "Resin 8K",
  "TPU 95A",
  "Nylon-CF",
];

export async function getCatalogCategories(): Promise<CatalogCategory[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug, description, image_url, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching catalog categories:", error.message);
      return [];
    }

    return (data as CatalogCategory[]) || [];
  } catch (err) {
    console.error("Failed to connect to database for categories:", err);
    return [];
  }
}

export async function getCatalogData(params: CatalogQueryParams): Promise<CatalogResult> {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(50, Math.max(1, params.limit || 12));
  const sort = params.sort || "newest";

  const emptyResult: CatalogResult = {
    products: [],
    categories: [],
    availableMaterials: STANDARD_MATERIALS,
    pagination: {
      page,
      limit,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    },
    priceRange: {
      min: 0,
      max: 10000,
    },
  };

  try {
    const supabase = await createClient();

    // 1. Fetch categories
    const categories = await getCatalogCategories();

    // 2. Resolve category filter if specified
    let categoryId: string | null = null;
    if (params.category) {
      if (UUID_REGEX.test(params.category)) {
        categoryId = params.category;
      } else {
        const found = categories.find((c) => c.slug === params.category);
        if (found) {
          categoryId = found.id;
        } else {
          // Slug not found in active categories
          const { data: dbCat } = await supabase
            .from("categories")
            .select("id")
            .eq("slug", params.category)
            .maybeSingle();

          if (dbCat) {
            categoryId = dbCat.id;
          } else {
            return {
              ...emptyResult,
              categories,
            };
          }
        }
      }
    }

    // 3. Build product query
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
      `,
        { count: "exact" }
      )
      .eq("is_active", true);

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    if (params.min_price !== undefined && !isNaN(params.min_price)) {
      query = query.gte("price", params.min_price);
    }

    if (params.max_price !== undefined && !isNaN(params.max_price)) {
      query = query.lte("price", params.max_price);
    }

    if (params.material) {
      query = query.ilike("material", `%${params.material}%`);
    }

    if (params.in_stock_only) {
      query = query.gt("stock", 0);
    }

    if (params.search) {
      const sanitized = params.search.replace(/[%_]/g, "\\$&");
      query = query.or(
        `name.ilike.%${sanitized}%,description.ilike.%${sanitized}%`
      );
    }

    // 4. Sorting
    switch (sort) {
      case "price_asc":
        query = query.order("price", { ascending: true });
        break;
      case "price_desc":
        query = query.order("price", { ascending: false });
        break;
      case "oldest":
        query = query.order("created_at", { ascending: true });
        break;
      case "name_asc":
        query = query.order("name", { ascending: true });
        break;
      case "name_desc":
        query = query.order("name", { ascending: false });
        break;
      case "newest":
      default:
        query = query.order("created_at", { ascending: false });
        break;
    }

    // 5. Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: rawProducts, count, error } = await query;

    if (error) {
      console.error("Error querying catalog products:", error.message);
      return {
        ...emptyResult,
        categories,
      };
    }

    // Sort product images by is_primary DESC, sort_order ASC
    const products: CatalogProduct[] = (rawProducts || []).map((prod: any) => {
      const images = Array.isArray(prod.images) ? [...prod.images] : [];
      images.sort((a: any, b: any) => {
        if (a.is_primary === b.is_primary) {
          return a.sort_order - b.sort_order;
        }
        return a.is_primary ? -1 : 1;
      });
      return {
        ...prod,
        images,
      };
    });

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      products,
      categories,
      availableMaterials: STANDARD_MATERIALS,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      priceRange: {
        min: 0,
        max: 5000,
      },
    };
  } catch (err) {
    console.error("Catalog data retrieval failure:", err);
    return emptyResult;
  }
}

