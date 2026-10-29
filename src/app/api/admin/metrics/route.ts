import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
          error: "Unauthorized: Authentication required",
        },
        { status: 401 }
      );
    }

    // Verify whether the authenticated user exists in the admins table
    const { data: adminRecord, error: adminError } = await supabase
      .from("admins")
      .select("user_id, created_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (adminError || !adminRecord) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: Administrator privileges required to access this resource",
        },
        { status: 403 }
      );
    }

    // Return administrative data for authorized administrators
    return NextResponse.json(
      {
        success: true,
        message: "Administrator access granted",
        data: {
          admin_user_id: adminRecord.user_id,
          admin_since: adminRecord.created_at,
          system_status: "operational",
          total_registered_profiles_count: "restricted_metric",
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

