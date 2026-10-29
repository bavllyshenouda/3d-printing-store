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

    let query = supabase.from("categories").select("*");

    if (UUID_REGEX.test(slugOrId)) {
      query = query.eq("id", slugOrId);
    } else {
      query = query.eq("slug", slugOrId);
    }

    const { data: category, error } = await query.maybeSingle();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          error: "Category not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          category,
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

