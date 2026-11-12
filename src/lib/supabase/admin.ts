import "server-only";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

/**
 * Creates an elevated Supabase client with the service role key.
 *
 * CRITICAL SECURITY CONSTRAINTS:
 * - Server-only (guarded by `import "server-only"`).
 * - Bypasses Row Level Security (RLS).
 * - Use ONLY inside the webhook/inbound processing path where there is no user session.
 * - NEVER import from client components or normal customer routes.
 *
 * TODO(db): Conduct RLS review for the admin client usage.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase admin configuration: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not defined"
    );
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

