import { pgTable, text, uuid, bigserial, timestamp } from "drizzle-orm/pg-core";
import { AiAlertSeverityEnum } from "../enum.schema";
import { AiAlertSeverity } from "../../enum/ai.enum";
import { credentialsTable } from "./credential.schema";

export { AiAlertSeverity };

export const alertsTable = pgTable("ts_ai_alerts", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  severity: AiAlertSeverityEnum("severity").notNull(),
  type: text("type").notNull(),
  credentialId: uuid("credential_id").references(() => credentialsTable.id, {
    onDelete: "set null",
  }),
  dedupeKey: text("dedupe_key").notNull(),
  channel: text("channel").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type AiAlert = typeof alertsTable.$inferSelect;
export type InsertAiAlert = typeof alertsTable.$inferInsert;
