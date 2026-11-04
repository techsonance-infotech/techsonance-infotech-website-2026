import { pgTable, text, uuid, integer } from "drizzle-orm/pg-core";
import { baseEntityFields } from "../base.schema";
import { sitesTable } from "../core/site.schema";

export const topicsTable = pgTable("ts_ai_topics", {
  ...baseEntityFields,
  siteId: uuid("site_id")
    .notNull()
    .references(() => sitesTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  keywords: text("keywords").array().notNull().default([]),
  category: text("category").default("Engineering"),
  targetAudience: text("target_audience").default("Tech Leads & Engineers"),
  difficulty: text("difficulty").default("intermediate"),
  status: text("status").notNull().default("SUGGESTED"), // 'SUGGESTED' | 'ACCEPTED' | 'QUEUED' | 'GENERATED' | 'REJECTED'
  priority: integer("priority").notNull().default(0),
  suggestedBy: text("suggested_by").default("ai"), // 'ai' | 'admin'
  notes: text("notes"),
});

export type Topic = typeof topicsTable.$inferSelect;
export type InsertTopic = typeof topicsTable.$inferInsert;
