import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { productQuerySchema } from "@/lib/validations/product";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const queryEntries = Object.fromEntries(searchParams.entries());

    const parseResult = productQuerySchema.safeParse(queryEntries);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid query parameters",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      page,
      limit,
      category,
      min_price,
      max_price,
      material,
      search,
      sort,
    } = parseResult.data;

    const supabase = await createClient();

    // If a category identifier was provided, resolve its UUID
    let categoryId: string | null = null;
    if (category) {
      if (UUID_REGEX.test(category)) {
        categoryId = category;
      } else {
        const { data: catRecord } = await supabase
          .from("categories")
          .select("id")
          .eq("slug", category)
          .maybeSingle();

        if (catRecord) {
          categoryId = catRecord.id;
        } else {
          // Category slug does not exist, return empty result set
          return NextResponse.json(
            {
              success: true,
              data: {
                products: [],
                pagination: {
                  page,
                  limit,
                  total: 0,
                  total_pages: 0,
                  has_next_page: false,
                  has_prev_page: false,
                },
              },
            },
            { status: 200 }
          );
        }
      }
    }

    // Build the query
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
        category:categories(id, name, slug),
        images:product_images(id, image_url, alt_text, is_primary, sort_order)
      `,
        { count: "exact" }
      )
      .eq("is_active", true); // Public filter: published products only

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    if (min_price !== undefined) {
      query = query.gte("price", min_price);
    }

    if (max_price !== undefined) {
      query = query.lte("price", max_price);
    }

    if (material) {
      query = query.ilike("material", `%${material}%`);
    }

    if (search) {
      const sanitized = search.replace(/[%_]/g, "\\$&");
      query = query.or(
        `name.ilike.%${sanitized}%,description.ilike.%${sanitized}%`
      );
    }

    // Sorting
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

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: rawProducts, count, error } = await query;

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    // Ensure images inside products are sorted by is_primary DESC, sort_order ASC
    const products = (rawProducts || []).map((prod) => {
      const images = Array.isArray(prod.images) ? [...prod.images] : [];
      images.sort((a, b) => {
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

    return NextResponse.json(
      {
        success: true,
        data: {
          products,
          pagination: {
            page,
            limit,
            total,
            total_pages: totalPages,
            has_next_page: page < totalPages,
            has_prev_page: page > 1,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}

