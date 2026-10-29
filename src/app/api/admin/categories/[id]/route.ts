import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { updateCategorySchema } from "@/lib/validations/product";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, context: RouteContext) {
  return handleCategoryUpdate(request, context);
}

export async function PATCH(request: Request, context: RouteContext) {
  return handleCategoryUpdate(request, context);
}

async function handleCategoryUpdate(request: Request, context: RouteContext) {
  try {
    const adminAuth = await requireAdmin(request);
    if (!adminAuth.authorized) {
      return adminAuth.response;
    }

    const { id } = await context.params;
    const { supabase } = adminAuth;
    const body = await request.json();

    const parseResult = updateCategorySchema.safeParse(body);
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

    const { data: updatedCategory, error } = await supabase
      .from("categories")
      .update(input)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          {
            success: false,
            error: "Category with this slug already exists",
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

    if (!updatedCategory) {
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
        message: "Category updated successfully",
        data: {
          category: updatedCategory,
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
      const { data: deactivated, error } = await supabase
        .from("categories")
        .update({ is_active: false })
        .eq("id", id)
        .select()
        .maybeSingle();

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        );
      }

      if (!deactivated) {
        return NextResponse.json(
          { success: false, error: "Category not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: "Category deactivated (soft-deleted) successfully",
          data: { category: deactivated },
        },
        { status: 200 }
      );
    }

    // Hard delete (products.category_id will be set to NULL via ON DELETE SET NULL)
    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Category deleted successfully",
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

