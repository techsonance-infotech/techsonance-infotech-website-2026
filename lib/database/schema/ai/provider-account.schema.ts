import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { baseEntityFields } from "../base.schema";

export const providerAccountsTable = pgTable("ts_ai_provider_accounts", {
  ...baseEntityFields,
  provider: text("provider").notNull(), // 'cloudflare' | 'gemini' | 'groq' | 'pollinations'
  label: text("label").notNull(),
  capabilities: text("capabilities").array().notNull().default([]), // ['text', 'image']
  models: text("models").array().notNull().default([]),
  status: text("status").notNull().default("ACTIVE"), // 'ACTIVE' | 'EXHAUSTED' | 'DISABLED' | 'COOLDOWN'
  priority: integer("priority").notNull().default(1),
  dailyQuotaLimit: integer("daily_quota_limit"),
  dailyQuotaUsed: integer("daily_quota_used").default(0),
  quotaResetAt: timestamp("quota_reset_at", { withTimezone: true }),
  cooldownUntil: timestamp("cooldown_until", { withTimezone: true }),
});

export type ProviderAccount = typeof providerAccountsTable.$inferSelect;
export type InsertProviderAccount = typeof providerAccountsTable.$inferInsert;
