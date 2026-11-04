import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL (or DIRECT_URL) is not set in environment");
}

export default defineConfig({
  schema: "./lib/database/schema/index.schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
});
