import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { productImageSchema } from "@/lib/validations/product";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const adminAuth = await requireAdmin(request);
    if (!adminAuth.authorized) {
      return adminAuth.response;
    }

    const { id: productId } = await context.params;
    const { supabase } = adminAuth;
    const body = await request.json();

    const parseResult = productImageSchema.safeParse(body);
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

    // Verify product exists
    const { data: productExists } = await supabase
      .from("products")
      .select("id")
      .eq("id", productId)
      .maybeSingle();

    if (!productExists) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    // If marked as primary, unmark other images for this product first
    if (input.is_primary) {
      await supabase
        .from("product_images")
        .update({ is_primary: false })
        .eq("product_id", productId);
    }

    const { data: newImage, error } = await supabase
      .from("product_images")
      .insert({
        product_id: productId,
        image_url: input.image_url,
        alt_text: input.alt_text || null,
        is_primary: input.is_primary,
        sort_order: input.sort_order,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Product image added successfully",
        data: {
          image: newImage,
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

