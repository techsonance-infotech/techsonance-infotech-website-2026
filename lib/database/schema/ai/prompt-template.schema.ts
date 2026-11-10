import { pgTable, text, uuid, integer, boolean } from "drizzle-orm/pg-core";
import { baseEntityFields } from "../base.schema";
import { sitesTable } from "../core/site.schema";

export const promptTemplatesTable = pgTable("ts_ai_prompt_templates", {
  ...baseEntityFields,
  siteId: uuid("site_id")
    .notNull()
    .references(() => sitesTable.id, { onDelete: "cascade" }),
  stepName: text("step_name").notNull(), // 'outline' | 'section' | 'meta' | 'critic' | 'image'
  version: integer("version").notNull().default(1),
  systemPrompt: text("system_prompt").notNull(),
  userPromptTemplate: text("user_prompt_template").notNull(),
  modelPreference: text("model_preference").default("gemini-3.5-flash-lite"),
  temperature: integer("temperature").default(70), // 0-100 (represents 0.0 - 1.0)
  isActive: boolean("is_active").notNull().default(true),
});

export type PromptTemplate = typeof promptTemplatesTable.$inferSelect;
export type InsertPromptTemplate = typeof promptTemplatesTable.$inferInsert;
