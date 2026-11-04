import { pgTable, text, uuid, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { baseEntityFields } from "../base.schema";
import { sitesTable } from "../core/site.schema";

export const generationJobsTable = pgTable("ts_ai_generation_jobs", {
  ...baseEntityFields,
  siteId: uuid("site_id")
    .notNull()
    .references(() => sitesTable.id, { onDelete: "cascade" }),
  topicId: uuid("topic_id"),
  topicText: text("topic_text").notNull(),
  category: text("category").default("Engineering"),
  status: text("status").notNull().default("QUEUED"), // 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'WAITING_QUOTA' | 'NEEDS_REVIEW' | 'FAILED'
  currentStep: text("current_step").default("outline"), // 'outline' | 'sections' | 'meta' | 'image' | 'validate' | 'save-pending'
  attempt: integer("attempt").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(3),
  priority: integer("priority").notNull().default(0),
  version: integer("version").notNull().default(1),
  workerId: text("worker_id"),
  leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true }),
  resumeAt: timestamp("resume_at", { withTimezone: true }),
  resultPostId: uuid("result_post_id"),
  errorDetails: jsonb("error_details"),
});

export type GenerationJob = typeof generationJobsTable.$inferSelect;
export type InsertGenerationJob = typeof generationJobsTable.$inferInsert;
