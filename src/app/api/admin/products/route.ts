import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import {
  productSchema,
  productQuerySchema,
  slugify,
} from "@/lib/validations/product";

export async function GET(request: Request) {
  try {
    const adminAuth = await requireAdmin(request);
    if (!adminAuth.authorized) {
      return adminAuth.response;
    }

    const { supabase } = adminAuth;
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

    const { page, limit, search, sort, is_active } = parseResult.data;

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
      );

    if (is_active !== undefined) {
      query = query.eq("is_active", is_active);
    }

    if (search) {
      const sanitized = search.replace(/[%_]/g, "\\$&");
      query = query.or(
        `name.ilike.%${sanitized}%,description.ilike.%${sanitized}%`
      );
    }

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

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: products, count, error } = await query;

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json(
      {
        success: true,
        data: {
          products: products || [],
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

export async function POST(request: Request) {
  try {
    const adminAuth = await requireAdmin(request);
    if (!adminAuth.authorized) {
      return adminAuth.response;
    }

    const { supabase } = adminAuth;
    const body = await request.json();

    const parseResult = productSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const input = parseResult.data;
    const slug = input.slug || slugify(input.name);

    if (!slug) {
      return NextResponse.json(
        {
          success: false,
          error: "Unable to generate a valid slug from product name",
        },
        { status: 400 }
      );
    }

    // Check if category_id exists if provided
    if (input.category_id) {
      const { data: categoryRecord } = await supabase
        .from("categories")
        .select("id")
        .eq("id", input.category_id)
        .maybeSingle();

      if (!categoryRecord) {
        return NextResponse.json(
          {
            success: false,
            error: "Referenced category_id does not exist",
          },
          { status: 400 }
        );
      }
    }

    const { data: newProduct, error } = await supabase
      .from("products")
      .insert({
        name: input.name,
        slug,
        description: input.description || null,
        category_id: input.category_id || null,
        price: input.price,
        stock: input.stock,
        material: input.material || null,
        available_colors: input.available_colors || [],
        is_active: input.is_active,
        is_featured: input.is_featured,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        // Unique violation (e.g. slug already exists)
        return NextResponse.json(
          {
            success: false,
            error: `Product with slug '${slug}' already exists. Please choose a different slug.`,
          },
          { status: 409 }
        );
      }
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Product created successfully",
        data: {
          product: newProduct,
        },
      },
      { status: 201 }
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

