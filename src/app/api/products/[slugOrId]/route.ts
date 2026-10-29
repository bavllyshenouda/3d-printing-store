import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface RouteContext {
  params: Promise<{ slugOrId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { slugOrId } = await context.params;
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
        category:categories(id, name, slug, is_active),
        images:product_images(id, image_url, alt_text, is_primary, sort_order)
      `
      )
      .eq("is_active", true); // Public filter: published products only

    if (UUID_REGEX.test(slugOrId)) {
      query = query.eq("id", slugOrId);
    } else {
      query = query.eq("slug", slugOrId);
    }

    const { data: rawProduct, error } = await query.maybeSingle();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    if (!rawProduct) {
      return NextResponse.json(
        {
          success: false,
          error: "Product not found",
        },
        { status: 404 }
      );
    }

    // Sort images: primary image first, then sort_order ascending
    const images = Array.isArray(rawProduct.images)
      ? [...rawProduct.images]
      : [];
    images.sort((a, b) => {
      if (a.is_primary === b.is_primary) {
        return a.sort_order - b.sort_order;
      }
      return a.is_primary ? -1 : 1;
    });

    const product = {
      ...rawProduct,
      images,
    };

    return NextResponse.json(
      {
        success: true,
        data: {
          product,
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

