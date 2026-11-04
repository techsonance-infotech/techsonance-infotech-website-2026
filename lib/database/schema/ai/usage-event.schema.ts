import { pgTable, text, uuid, integer, timestamp } from "drizzle-orm/pg-core";
import { baseEntityFields } from "../base.schema";

export const usageEventsTable = pgTable("ts_ai_usage_events", {
  ...baseEntityFields,
  jobId: uuid("job_id"),
  stepName: text("step_name"),
  provider: text("provider").notNull(), // 'cloudflare' | 'gemini' | 'groq' | 'pollinations'
  model: text("model").notNull(),
  promptTokens: integer("prompt_tokens").default(0),
  completionTokens: integer("completion_tokens").default(0),
  totalTokens: integer("total_tokens").default(0),
  durationMs: integer("duration_ms").default(0),
  status: text("status").notNull(), // 'SUCCESS' | 'RATE_LIMITED' | 'QUOTA_EXCEEDED' | 'ERROR'
  errorMessage: text("error_message"),
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow(),
});

export type UsageEvent = typeof usageEventsTable.$inferSelect;
export type InsertUsageEvent = typeof usageEventsTable.$inferInsert;
