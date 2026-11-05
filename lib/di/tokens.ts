import { InjectionToken } from "@needle-di/core";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { BOT_CONFIG } from "../config";
import type { Env } from "../env";
import type { Database } from "@/types/database.types";
import type { Database as DrizzleDb } from "@/lib/database/index";

export const BOT_CONFIG_TOKEN = new InjectionToken<typeof BOT_CONFIG>("BOT_CONFIG_TOKEN");
export const ENV_CONFIG_TOKEN = new InjectionToken<Env>("ENV_CONFIG_TOKEN");
export const SUPABASE_CLIENT_TOKEN = new InjectionToken<SupabaseClient<Database> | null>(
  "SUPABASE_CLIENT_TOKEN",
);
export const DRIZZLE_DB_TOKEN = new InjectionToken<DrizzleDb>("DRIZZLE_DB_TOKEN");
