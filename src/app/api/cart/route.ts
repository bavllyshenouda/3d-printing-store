import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/auth/customer";
import { addToCartSchema } from "@/lib/validations/cart";

export async function GET(request: Request) {
  try {
    const auth = await requireCustomer(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const { user, supabase } = auth;

    // Retrieve cart items for the authenticated user
    // RLS policy "Customers manage own cart" ensures isolation at database level
    const { data: rawItems, error: cartError } = await supabase
      .from("cart_items")
      .select(
        `
        id,
        user_id,
        product_id,
        color,
        quantity,
        created_at,
        updated_at,
        product:products (
          id,
          name,
          slug,
          price,
          stock,
          material,
          available_colors,
          is_active,
          images:product_images (
            id,
            image_url,
            alt_text,
            is_primary,
            sort_order
          )
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (cartError) {
      return NextResponse.json(
        {
          success: false,
          error: cartError.message,
        },
        { status: 500 }
      );
    }

    let subtotal = 0;
    let totalItems = 0;
    let hasUnavailableItems = false;

    type RawCartItem = (typeof rawItems)[number];

    const items = (rawItems || []).map((item: RawCartItem) => {
      const product = item.product;

      if (!product) {
        hasUnavailableItems = true;
        return {
          id: item.id,
          product_id: item.product_id,
          color: item.color,
          quantity: item.quantity,
          is_available: false,
          unavailable_reason: "Product no longer exists",
          unit_price: 0,
          line_total: 0,
          product: null,
        };
      }

      // Check primary image
      const productImages = Array.isArray(product.images)
        ? [...product.images]
        : [];
      productImages.sort((a, b) => {
        if (a.is_primary === b.is_primary) return a.sort_order - b.sort_order;
        return a.is_primary ? -1 : 1;
      });
      const primaryImage = productImages[0]?.image_url || null;

      // Authoritative pricing from database
      const unitPrice = Number(product.price);
      const isPublished = Boolean(product.is_active);
      const hasStock = product.stock >= item.quantity;
      const isAvailable = isPublished && hasStock;

      if (!isAvailable) {
        hasUnavailableItems = true;
      }

      const lineTotal = Number((unitPrice * item.quantity).toFixed(2));

      if (isAvailable) {
        subtotal += lineTotal;
        totalItems += item.quantity;
      }

      let unavailableReason: string | null = null;
      if (!isPublished) {
        unavailableReason = "Product is currently unavailable";
      } else if (product.stock === 0) {
        unavailableReason = "Product is out of stock";
      } else if (product.stock < item.quantity) {
        unavailableReason = `Only ${product.stock} units remaining in stock`;
      }

      return {
        id: item.id,
        product_id: item.product_id,
        color: item.color,
        quantity: item.quantity,
        unit_price: unitPrice,
        line_total: lineTotal,
        is_available: isAvailable,
        unavailable_reason: unavailableReason,
        created_at: item.created_at,
        updated_at: item.updated_at,
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          material: product.material,
          available_stock: product.stock,
          is_active: product.is_active,
          primary_image: primaryImage,
        },
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          items,
          summary: {
            subtotal: Number(subtotal.toFixed(2)),
            total_items: totalItems,
            has_unavailable_items: hasUnavailableItems,
          },
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
    const auth = await requireCustomer(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const { user, supabase } = auth;

    const body = await request.json();
    const parseResult = addToCartSchema.safeParse(body);

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

    const { product_id, color, quantity } = parseResult.data;

    // 1. Fetch authoritative product information from database
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, name, price, stock, is_active, available_colors")
      .eq("id", product_id)
      .maybeSingle();

    if (productError) {
      return NextResponse.json(
        {
          success: false,
          error: productError.message,
        },
        { status: 500 }
      );
    }

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: "Product not found",
        },
        { status: 404 }
      );
    }

    // 2. Validate product availability and published status
    if (!product.is_active) {
      return NextResponse.json(
        {
          success: false,
          error: "This product is currently unpublished and cannot be added to the cart",
        },
        { status: 400 }
      );
    }

    // 3. Validate color selection against product's available colors
    const colors = Array.isArray(product.available_colors)
      ? product.available_colors
      : [];
    const colorMatches = colors.some(
      (c) => c.toLowerCase() === color.toLowerCase()
    );

    if (colors.length > 0 && !colorMatches) {
      return NextResponse.json(
        {
          success: false,
          error: `Selected color '${color}' is not available for this product. Available colors: ${colors.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    // 4. Validate inventory / stock
    if (product.stock <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Product is out of stock",
        },
        { status: 400 }
      );
    }

    // 5. Check if entry for (user_id, product_id, color) already exists in cart
    const { data: existingItem, error: existingError } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("user_id", user.id)
      .eq("product_id", product_id)
      .eq("color", color)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        {
          success: false,
          error: existingError.message,
        },
        { status: 500 }
      );
    }

    if (existingItem) {
      // Duplicate entry: Increment quantity up to available inventory limit
      const newQuantity = existingItem.quantity + quantity;

      if (newQuantity > product.stock) {
        return NextResponse.json(
          {
            success: false,
            error: `Cannot add ${quantity} more unit(s). You already have ${existingItem.quantity} in your cart, and only ${product.stock} units are in stock.`,
          },
          { status: 400 }
        );
      }

      const { data: updatedItem, error: updateError } = await supabase
        .from("cart_items")
        .update({
          quantity: newQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingItem.id)
        .eq("user_id", user.id)
        .select()
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
          message: "Cart item quantity updated",
          data: {
            item: updatedItem,
            authoritative_unit_price: Number(product.price),
            line_total: Number((Number(product.price) * newQuantity).toFixed(2)),
          },
        },
        { status: 200 }
      );
    }

    // 6. New cart entry: Validate requested quantity does not exceed stock
    if (quantity > product.stock) {
      return NextResponse.json(
        {
          success: false,
          error: `Requested quantity (${quantity}) exceeds available stock (${product.stock}).`,
        },
        { status: 400 }
      );
    }

    // Insert new cart item
    const { data: newItem, error: insertError } = await supabase
      .from("cart_items")
      .insert({
        user_id: user.id,
        product_id,
        color,
        quantity,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        {
          success: false,
          error: insertError.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Product added to cart successfully",
        data: {
          item: newItem,
          authoritative_unit_price: Number(product.price),
          line_total: Number((Number(product.price) * quantity).toFixed(2)),
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

export async function DELETE(request: Request) {
  try {
    const auth = await requireCustomer(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const { user, supabase } = auth;

    // Clear entire cart for authenticated customer
    const { error: deleteError } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) {
      return NextResponse.json(
        {
          success: false,
          error: deleteError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Cart cleared successfully",
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

