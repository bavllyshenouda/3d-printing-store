import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { User, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

export type CustomerAuthResult =
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
 * Enforces authenticated customer session on the server.
 * Cryptographically validates session using @supabase/ssr getUser().
 * Supports Bearer token in Authorization header or session cookies.
 * Returns either authorized context with the authenticated Supabase client,
 * or an unauthorized (401) response.
 */
export async function requireCustomer(
  request: Request
): Promise<CustomerAuthResult> {
  const supabase = await createClient();

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "")?.trim();

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

  return {
    authorized: true,
    user,
    supabase,
  };
}

