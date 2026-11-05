import { createBrowserClient } from "@supabase/ssr";
import { getPublicEnv } from "@/lib/env/public";

export function createClient() {
  const env = getPublicEnv();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
