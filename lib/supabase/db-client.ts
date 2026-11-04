import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getEnv } from "../env";
import type { Database } from "@/types/database.types";

let sharedClient: SupabaseClient<Database> | null = null;

/**
 * Returns a reusable singleton Supabase client for server-side content queries.
 * Driven strictly by validated `getEnv()` settings.
 */
export function getSharedSupabaseClient(): SupabaseClient<Database> | null {
  if (sharedClient) return sharedClient;

  let env;
  try {
    env = getEnv();
  } catch {
    return null;
  }

  const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
  const key =
    env.SUPABASE_SERVICE_ROLE_KEY ||
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    env.SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  sharedClient = createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return sharedClient;
}

export function resetSharedSupabaseClient(): void {
  sharedClient = null;
}
