import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Check for explicit Bearer token in header or rely on cookies
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace(/^Bearer\s+/i, "");

    const {
      data: { user },
      error,
    } = token ? await supabase.auth.getUser(token) : await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Invalid or missing authentication session",
        },
        { status: 401 }
      );
    }

    // Check whether the user has administrator privileges
    const { data: adminRecord } = await supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const isAdmin = Boolean(adminRecord);

    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            created_at: user.created_at,
            last_sign_in_at: user.last_sign_in_at,
            app_metadata: user.app_metadata,
            user_metadata: user.user_metadata,
          },
          is_admin: isAdmin,
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

