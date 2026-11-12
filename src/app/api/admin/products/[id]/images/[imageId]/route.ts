import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { updateProductImageSchema } from "@/lib/validations/product";

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

    const parseResult = updateProductImageSchema.safeParse(body);
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

    if (input.is_primary) {
      // Reset existing primary images for this product
      const { error: unsetError } = await supabase
        .from("product_images")
        .update({ is_primary: false })
        .eq("product_id", productId);

      if (unsetError) {
        return NextResponse.json(
          {
            success: false,
            error: `Failed to unset existing primary images: ${unsetError.message}`,
          },
          { status: 500 }
        );
      }
    }

    const updatePayload: {
      alt_text?: string | null;
      is_primary?: boolean;
      sort_order?: number;
    } = {};

    if (input.alt_text !== undefined) updatePayload.alt_text = input.alt_text;
    if (input.sort_order !== undefined) updatePayload.sort_order = input.sort_order;
    if (input.is_primary !== undefined) updatePayload.is_primary = input.is_primary;

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

    // Check if target image exists and whether it is primary
    const { data: targetImage, error: fetchError } = await supabase
      .from("product_images")
      .select("id, is_primary")
      .eq("id", imageId)
      .eq("product_id", productId)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    if (!targetImage) {
      return NextResponse.json(
        { success: false, error: "Image not found for this product" },
        { status: 404 }
      );
    }

    const { error: deleteError } = await supabase
      .from("product_images")
      .delete()
      .eq("id", imageId)
      .eq("product_id", productId);

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: deleteError.message },
        { status: 400 }
      );
    }

    // When deleting the primary image, promote the next image by sort_order
    if (targetImage.is_primary) {
      const { data: nextImage } = await supabase
        .from("product_images")
        .select("id")
        .eq("product_id", productId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (nextImage) {
        await supabase
          .from("product_images")
          .update({ is_primary: true })
          .eq("id", nextImage.id);
      }
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

