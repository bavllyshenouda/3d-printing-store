import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";

interface RouteContext {
  params: Promise<{ id: string; imageId: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const adminAuth = await requireAdmin(request);
    if (!adminAuth.authorized) {
      return adminAuth.response;
    }

    const { id: productId, imageId } = await context.params;
    const { supabase } = adminAuth;
    const body = await request.json();

    const updatePayload: {
      alt_text?: string | null;
      is_primary?: boolean;
      sort_order?: number;
    } = {};

    if (body.alt_text !== undefined) updatePayload.alt_text = body.alt_text;
    if (body.sort_order !== undefined) updatePayload.sort_order = body.sort_order;
    if (typeof body.is_primary === "boolean") {
      updatePayload.is_primary = body.is_primary;
      if (body.is_primary) {
        // Reset existing primary images for this product
        await supabase
          .from("product_images")
          .update({ is_primary: false })
          .eq("product_id", productId);
      }
    }

    const { data: updatedImage, error } = await supabase
      .from("product_images")
      .update(updatePayload)
      .eq("id", imageId)
      .eq("product_id", productId)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    if (!updatedImage) {
      return NextResponse.json(
        { success: false, error: "Image not found for this product" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Image metadata updated successfully",
        data: {
          image: updatedImage,
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

    const { id: productId, imageId } = await context.params;
    const { supabase } = adminAuth;

    const { error } = await supabase
      .from("product_images")
      .delete()
      .eq("id", imageId)
      .eq("product_id", productId);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Image deleted successfully",
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

