import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("include_inactive") === "true";

    let query = supabase
      .from("categories")
      .select("id, name, slug, description, image_url, is_active, sort_order, created_at, updated_at")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (!includeInactive) {
      // Public filter: only active categories
      query = query.eq("is_active", true);
    }

    const { data: categories, error } = await query;

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
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

