import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { relations } from "./relation";
import { getEnv } from "@/lib/env";

export function resolveDatabaseUrl(): string {
  let env;
  try {
    env = getEnv();
  } catch {
    // fallback
  }

  let connectionString =
    env?.DATABASE_URL ||
    env?.SUPABASE_DB_URL ||
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DB_URL;

  if (!connectionString) {
    connectionString = "postgresql://postgres:postgres@localhost:54322/postgres";
  }

  if (connectionString.includes("postgres:postgres@supabase_db_")) {
    try {
      const url = new URL(connectionString);
      url.hostname = url.hostname.split("_")[1] || url.hostname;
      connectionString = url.href;
    } catch {
      // keep
    }
  }

  return connectionString;
}

function createClient(connectionString: string) {
  return postgres(connectionString, {
    prepare: false, // Required for Supabase Transaction Pooler mode (port 6543)
    max: Number(process.env.DB_POOL_MAX) || 10,
    connect_timeout: 8,
  });
}

function makeDrizzle(client: ReturnType<typeof createClient>) {
  return drizzle({ client, relations });
}

export type Database = ReturnType<typeof makeDrizzle>;
export type DbTransaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

// Survives HMR in Next.js development
const g = globalThis as unknown as {
  __pg?: { client: ReturnType<typeof createClient> | null; db: Database | null };
};
const state = (g.__pg ??= { client: null, db: null });

export function getDrizzleDb(connectionUrl?: string): Database {
  if (connectionUrl) {
    // Custom URL: never touch the shared state. Caller owns lifecycle.
    return makeDrizzle(createClient(connectionUrl));
  }
  if (!state.db) {
    state.client = createClient(resolveDatabaseUrl());
    state.db = makeDrizzle(state.client);
  }
  return state.db;
}

export const db = new Proxy({} as Database, {
  get(_t, prop) {
    // Don't create a pool for introspection probes
    if (typeof prop === "symbol" || prop === "then") return undefined;
    const instance = getDrizzleDb();
    const value = Reflect.get(instance as object, prop, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
  has: (_t, prop) => Reflect.has(getDrizzleDb() as object, prop),
  ownKeys: () => Reflect.ownKeys(getDrizzleDb() as object),
  getOwnPropertyDescriptor: (_t, prop) => {
    const d = Reflect.getOwnPropertyDescriptor(getDrizzleDb() as object, prop);
    return d ? { ...d, configurable: true } : undefined;
  },
});

export async function checkDatabaseConnection(timeoutMs = 3000): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    getDrizzleDb(); // ensures state.client exists
    await Promise.race([
      state.client!`SELECT 1`,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("health check timeout")), timeoutMs);
      }),
    ]);
    return true;
  } catch (error) {
    console.error("db_connection_error:", error instanceof Error ? error.message : "unknown");
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function closeDatabaseConnections(): Promise<void> {
  const client = state.client;
  state.client = null; // null first so new callers don't get a closing pool
  state.db = null;
  if (client) {
    await client.end({ timeout: 2 }).catch((err: unknown) => {
      console.error("db_pool_close_error:", err instanceof Error ? err.message : "unknown");
    });
  }
}

export * from "./schema/index.schema";
export { relations };
