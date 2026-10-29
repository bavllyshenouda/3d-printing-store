import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { User, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

export type AdminAuthResult =
  | {
      authorized: true;
      user: User;
      supabase: SupabaseClient<Database>;
    }
  | {
      authorized: false;
      response: NextResponse;
    };

/**
 * Enforces administrator authentication and authorization on the server.
 * Returns either authorized context with the authenticated Supabase client,
 * or an unauthorized (401) / forbidden (403) response.
 */
export async function requireAdmin(request: Request): Promise<AdminAuthResult> {
  const supabase = await createClient();

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");

  const {
    data: { user },
    error: userError,
  } = token ? await supabase.auth.getUser(token) : await supabase.auth.getUser();

  if (userError || !user) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Authentication required",
        },
        { status: 401 }
      ),
    };
  }

  // Check presence in the admins table
  const { data: adminRecord, error: adminError } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError || !adminRecord) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          error: "Forbidden: Administrator privileges required to perform this action",
        },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    user,
    supabase,
  };
}

