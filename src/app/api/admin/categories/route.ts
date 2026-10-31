import { NextResponse } from "next/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth/admin";
import { categorySchema, slugify } from "@/lib/validations/product";
import { Database } from "@/types/database";

// Resolve a slug that does not collide with an existing category, appending -2, -3, ...
// Never overwrites another category's slug; preserves existing IDs/relationships.
async function resolveUniqueCategorySlug(
  supabase: SupabaseClient<Database>,
  baseSlug: string
): Promise<string> {
  let candidate = baseSlug;
  let counter = 1;
  while (counter <= 50) {
    const { data } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data) return candidate;
    counter += 1;
    candidate = `${baseSlug}-${counter}`;
  }
  // Pathological fallback (extremely unlikely): time-based suffix.
  return `${baseSlug}-${Date.now().toString(36)}`;
}

export async function GET(request: Request) {
  try {
    const adminAuth = await requireAdmin(request);
    if (!adminAuth.authorized) {
      return adminAuth.response;
    }

    const { supabase } = adminAuth;

    // Admins see every category, including inactive/hidden ones.
    const { data: categories, error } = await supabase
      .from("categories")
      .select(
        "id, name, slug, description, image_url, is_active, sort_order, created_at, updated_at"
      )
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          categories: categories || [],
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
    const baseSlug = input.slug || slugify(input.name);

    if (!baseSlug) {
      return NextResponse.json(
        {
          success: false,
          error: "Unable to generate a valid slug from category name",
        },
        { status: 400 }
      );
    }

    // Duplicate-safe: derive a unique slug so we never overwrite another category.
    const slug = await resolveUniqueCategorySlug(supabase, baseSlug);

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

