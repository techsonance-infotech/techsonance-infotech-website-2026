import { pgTable, text, uuid, bigserial, jsonb, timestamp } from "drizzle-orm/pg-core";
import { credentialsTable } from "./credential.schema";

export const credentialEventsTable = pgTable("ts_ai_credential_events", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  credentialId: uuid("credential_id").references(() => credentialsTable.id, {
    onDelete: "set null",
  }),
  event: text("event").notNull(),
  actor: text("actor").notNull(),
  requestId: text("request_id"),
  meta: jsonb("meta").notNull().default({}),
  at: timestamp("at", { withTimezone: true }).defaultNow().notNull(),
});

export type AiCredentialEvent = typeof credentialEventsTable.$inferSelect;
export type InsertAiCredentialEvent = typeof credentialEventsTable.$inferInsert;
