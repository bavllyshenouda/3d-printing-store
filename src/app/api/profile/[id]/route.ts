import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateProfileSchema } from "@/lib/validations/auth";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id: targetProfileId } = await context.params;
    const supabase = await createClient();

    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace(/^Bearer\s+/i, "");

    const {
      data: { user },
      error: userError,
    } = token ? await supabase.auth.getUser(token) : await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Authentication required",
        },
        { status: 401 }
      );
    }

    // Security check: Check if current user is attempting to modify someone else's profile
    if (user.id !== targetProfileId) {
      // Check if current user is an admin
      const { data: adminRecord } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      const isAdmin = Boolean(adminRecord);

      if (!isAdmin) {
        return NextResponse.json(
          {
            success: false,
            error: "Forbidden: You are not authorized to update another user's profile",
          },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const parseResult = updateProfileSchema.safeParse(body);

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

    const { first_name, last_name, phone } = parseResult.data;

    const updateData: {
      first_name?: string;
      last_name?: string;
      phone?: string | null;
      updated_at?: string;
    } = {
      updated_at: new Date().toISOString(),
    };

    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (phone !== undefined) updateData.phone = phone;

    // Database RLS will ALSO independently enforce that non-admins cannot update other rows
    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", targetProfileId)
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
        message: "Profile updated successfully",
        data: {
          profile: updatedProfile,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}

