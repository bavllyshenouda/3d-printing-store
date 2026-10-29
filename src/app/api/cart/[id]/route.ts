import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/auth/customer";
import { updateCartItemSchema } from "@/lib/validations/cart";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  return handleQuantityUpdate(request, context);
}

export async function PUT(request: Request, context: RouteContext) {
  return handleQuantityUpdate(request, context);
}

async function handleQuantityUpdate(request: Request, context: RouteContext) {
  try {
    const { id: itemId } = await context.params;
    const auth = await requireCustomer(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const { user, supabase } = auth;

    const body = await request.json();
    const parseResult = updateCartItemSchema.safeParse(body);

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

    const { quantity } = parseResult.data;

    // Fetch the cart item, verifying ownership (user_id = user.id)
    const { data: cartItem, error: fetchError } = await supabase
      .from("cart_items")
      .select("id, user_id, product_id, color, quantity")
      .eq("id", itemId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json(
        {
          success: false,
          error: fetchError.message,
        },
        { status: 500 }
      );
    }

    if (!cartItem) {
      return NextResponse.json(
        {
          success: false,
          error: "Cart item not found",
        },
        { status: 404 }
      );
    }

    // Fetch authoritative product inventory from database
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, name, price, stock, is_active")
      .eq("id", cartItem.product_id)
      .maybeSingle();

    if (productError || !product) {
      return NextResponse.json(
        {
          success: false,
          error: "Associated product could not be verified",
        },
        { status: 400 }
      );
    }

    if (!product.is_active) {
      return NextResponse.json(
        {
          success: false,
          error: "Product is no longer active",
        },
        { status: 400 }
      );
    }

    if (quantity > product.stock) {
      return NextResponse.json(
        {
          success: false,
          error: `Requested quantity (${quantity}) exceeds available stock (${product.stock}).`,
        },
        { status: 400 }
      );
    }

    // Update cart item quantity
    const { data: updatedItem, error: updateError } = await supabase
      .from("cart_items")
      .update({
        quantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", itemId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        {
          success: false,
          error: updateError.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Cart item quantity updated successfully",
        data: {
          item: updatedItem,
          authoritative_unit_price: Number(product.price),
          line_total: Number((Number(product.price) * quantity).toFixed(2)),
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
    const { id: itemId } = await context.params;
    const auth = await requireCustomer(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const { user, supabase } = auth;

    // Scoped deletion: enforces user_id = user.id
    const { data: deletedItem, error: deleteError } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", itemId)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    if (deleteError) {
      return NextResponse.json(
        {
          success: false,
          error: deleteError.message,
        },
        { status: 500 }
      );
    }

    if (!deletedItem) {
      return NextResponse.json(
        {
          success: false,
          error: "Cart item not found or does not belong to your account",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Cart item removed successfully",
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

