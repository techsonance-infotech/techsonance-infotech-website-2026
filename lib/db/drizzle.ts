import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/lib/db/schema";
import { getEnv } from "@/lib/env";

export function resolveDatabaseUrl(): string {
  const env = getEnv();
  let connectionString =
    env.DATABASE_URL ||
    env.SUPABASE_DB_URL ||
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DB_URL;

  if (!connectionString) {
    // Fallback default for local docker / dev environment
    connectionString = "postgresql://postgres:postgres@localhost:54322/postgres";
  }

  // Local Supabase Docker resolver fix if needed
  if (connectionString.includes("postgres:postgres@supabase_db_")) {
    try {
      const url = new URL(connectionString);
      url.hostname = url.hostname.split("_")[1] || url.hostname;
      connectionString = url.href;
    } catch {
      // keep connectionString as is
    }
  }

  return connectionString;
}

let cachedDb: ReturnType<typeof createDbInstance> | null = null;

function createDbInstance(connectionUrl?: string) {
  const url = connectionUrl || resolveDatabaseUrl();
  const client = postgres(url, {
    prepare: false, // Required for Supabase Transaction Pooler mode
    max: 10,
  });
  return drizzle({
    client,
    relations: schema.contentRelations,
  });
}

export function getDrizzleDb(connectionUrl?: string) {
  if (connectionUrl) {
    return createDbInstance(connectionUrl);
  }
  if (!cachedDb) {
    cachedDb = createDbInstance();
  }
  return cachedDb;
}

export const db = getDrizzleDb();
export type DrizzleDatabase = ReturnType<typeof getDrizzleDb>;
