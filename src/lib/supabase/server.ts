import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { Database } from "@/types/database";

export async function createClient() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const authHeader = headerStore.get("authorization");

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },

        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Cookie updates may need to be handled by middleware
            // or a Server Action in some rendering contexts.
          }
        },
      },
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
    }
  );
}
