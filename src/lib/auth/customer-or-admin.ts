import { NextResponse } from "next/server";
import { User, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";
import { requireAdmin } from "./admin";
import { requireCustomer } from "./customer";

export type CustomerOrAdminAuthResult =
  | {
      authorized: true;
      user: User;
      supabase: SupabaseClient<Database>;
      isAdmin: boolean;
    }
  | {
      authorized: false;
      response: NextResponse;
    };

/**
 * Resolves authentication for routes accessible to both customers and administrators.
 * Always checks requireAdmin FIRST so that administrators are correctly identified
 * with isAdmin = true, rather than treated as a normal customer scoped to their own records.
 */
export async function requireCustomerOrAdmin(
  request: Request
): Promise<CustomerOrAdminAuthResult> {
  const adminAuth = await requireAdmin(request);
  if (adminAuth.authorized) {
    return {
      authorized: true,
      user: adminAuth.user,
      supabase: adminAuth.supabase,
      isAdmin: true,
    };
  }

  const customerAuth = await requireCustomer(request);
  if (customerAuth.authorized) {
    return {
      authorized: true,
      user: customerAuth.user,
      supabase: customerAuth.supabase,
      isAdmin: false,
    };
  }

  return {
    authorized: false,
    response: customerAuth.response,
  };
}

