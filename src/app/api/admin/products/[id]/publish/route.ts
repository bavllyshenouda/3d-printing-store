import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const adminAuth = await requireAdmin(request);
    if (!adminAuth.authorized) {
      return adminAuth.response;
    }

    const { id } = await context.params;
    const { supabase } = adminAuth;

    let targetStatus: boolean | undefined = undefined;

    try {
      const body = await request.json();
      if (typeof body.is_active === "boolean") {
        targetStatus = body.is_active;
      }
    } catch {
      // Body may be empty if toggling
    }

    // If targetStatus was not explicitly provided in body, toggle the current state
    if (targetStatus === undefined) {
      const { data: currentProduct, error: fetchError } = await supabase
        .from("products")
        .select("is_active")
        .eq("id", id)
        .maybeSingle();

      if (fetchError) {
        return NextResponse.json(
          { success: false, error: fetchError.message },
          { status: 500 }
        );
      }

      if (!currentProduct) {
        return NextResponse.json(
          { success: false, error: "Product not found" },
          { status: 404 }
        );
      }

      targetStatus = !currentProduct.is_active;
    }

    const { data: updatedProduct, error: updateError } = await supabase
      .from("products")
      .update({ is_active: targetStatus })
      .eq("id", id)
      .select("id, name, slug, is_active, updated_at")
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: targetStatus
          ? "Product published successfully"
          : "Product unpublished successfully",
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

