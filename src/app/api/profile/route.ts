import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateProfileSchema } from "@/lib/validations/auth";

export async function GET(request: Request) {
  try {
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
          error: "Unauthorized: Authentication required to view profile",
        },
        { status: 401 }
      );
    }

    // Query profiles table. RLS policy "Read own profile" ensures customer can only access their own row.
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        {
          success: false,
          error: profileError.message,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          profile,
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

export async function PUT(request: Request) {
  return handleProfileUpdate(request);
}

export async function PATCH(request: Request) {
  return handleProfileUpdate(request);
}

async function handleProfileUpdate(request: Request) {
  try {
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
          error: "Unauthorized: Authentication required to update profile",
        },
        { status: 401 }
      );
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

    // Build update payload strictly constrained to allowed fields
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

    // Enforced via server logic AND RLS policy "Update own profile" (id = auth.uid())
    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", user.id)
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

