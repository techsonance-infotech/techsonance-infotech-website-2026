import { InjectionToken } from "@needle-di/core";
import type { SupabaseClient } from "@supabase/supabase-js";
import { BOT_CONFIG } from "../config";
import type { Env } from "../env";
import type { Database } from "@/types/database.types";
import type { DrizzleDatabase } from "@/lib/db/drizzle";

export const BOT_CONFIG_TOKEN = new InjectionToken<typeof BOT_CONFIG>("BOT_CONFIG_TOKEN");
export const ENV_CONFIG_TOKEN = new InjectionToken<Env>("ENV_CONFIG_TOKEN");
export const SUPABASE_CLIENT_TOKEN = new InjectionToken<SupabaseClient<Database> | null>(
  "SUPABASE_CLIENT_TOKEN"
);
export const DRIZZLE_DB_TOKEN = new InjectionToken<DrizzleDatabase>("DRIZZLE_DB_TOKEN");
