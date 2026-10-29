import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { categorySchema, slugify } from "@/lib/validations/product";

export async function POST(request: Request) {
  try {
    const adminAuth = await requireAdmin(request);
    if (!adminAuth.authorized) {
      return adminAuth.response;
    }

    const { supabase } = adminAuth;
    const body = await request.json();

    const parseResult = categorySchema.safeParse(body);
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
          error: "Unable to generate a valid slug from category name",
        },
        { status: 400 }
      );
    }

    const { data: newCategory, error } = await supabase
      .from("categories")
      .insert({
        name: input.name,
        slug,
        description: input.description || null,
        image_url: input.image_url || null,
        is_active: input.is_active,
        sort_order: input.sort_order,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          {
            success: false,
            error: `Category with slug '${slug}' already exists`,
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
        message: "Category created successfully",
        data: {
          category: newCategory,
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

