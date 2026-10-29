import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { updateProductSchema } from "@/lib/validations/product";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const adminAuth = await requireAdmin(request);
    if (!adminAuth.authorized) {
      return adminAuth.response;
    }

    const { id } = await context.params;
    const { supabase } = adminAuth;

    const { data: product, error } = await supabase
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
      `
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: "Product not found",
        },
        { status: 404 }
      );
    }

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

export async function PUT(request: Request, context: RouteContext) {
  return handleProductUpdate(request, context);
}

export async function PATCH(request: Request, context: RouteContext) {
  return handleProductUpdate(request, context);
}

async function handleProductUpdate(request: Request, context: RouteContext) {
  try {
    const adminAuth = await requireAdmin(request);
    if (!adminAuth.authorized) {
      return adminAuth.response;
    }

    const { id } = await context.params;
    const { supabase } = adminAuth;
    const body = await request.json();

    const parseResult = updateProductSchema.safeParse(body);
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

    // If category_id is being updated, verify it exists
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

    const { data: updatedProduct, error } = await supabase
      .from("products")
      .update(input)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          {
            success: false,
            error: "Product with this slug already exists",
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

    if (!updatedProduct) {
      return NextResponse.json(
        {
          success: false,
          error: "Product not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Product updated successfully",
        data: {
          product: updatedProduct,
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

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const adminAuth = await requireAdmin(request);
    if (!adminAuth.authorized) {
      return adminAuth.response;
    }

    const { id } = await context.params;
    const { supabase } = adminAuth;
    const { searchParams } = new URL(request.url);
    const softDelete = searchParams.get("soft") === "true";

    if (softDelete) {
      // Deactivate product instead of hard deletion
      const { data: deactivated, error } = await supabase
        .from("products")
        .update({ is_active: false })
        .eq("id", id)
        .select()
        .maybeSingle();

      if (error) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          { status: 400 }
        );
      }

      if (!deactivated) {
        return NextResponse.json(
          {
            success: false,
            error: "Product not found",
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: "Product deactivated (soft-deleted) successfully",
          data: { product: deactivated },
        },
        { status: 200 }
      );
    }

    // Hard deletion: cascades to product_images automatically via FK constraint
    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
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
        message: "Product deleted successfully",
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

