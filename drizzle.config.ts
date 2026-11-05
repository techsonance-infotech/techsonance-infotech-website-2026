import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

// Migrations need a session-capable connection: DIRECT_URL (session pooler :5432
// or direct db host). Falls back to DATABASE_URL (transaction pooler :6543),
// which is not reliable for DDL.
const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) {
  throw new Error("DIRECT_URL or DATABASE_URL is not set in environment");
}

if (!process.env.DIRECT_URL && url.includes(":6543")) {
  console.warn(
    "[drizzle] DIRECT_URL not set; using the transaction pooler (:6543) for migrations. " +
      "Set DIRECT_URL to the session pooler (:5432) to avoid hangs/failures.",
  );
}

export default defineConfig({
  schema: "./lib/database/schema/index.schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
});
