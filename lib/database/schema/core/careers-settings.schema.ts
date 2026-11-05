import { pgTable, text, uuid, integer, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { baseEntityFields } from "../base.schema";
import { sitesTable } from "./site.schema";

export const careersSettingsTable = pgTable(
  "ts_content_careers_settings",
  {
    ...baseEntityFields,
    siteId: uuid("site_id")
      .notNull()
      .references(() => sitesTable.id, { onDelete: "cascade" }),
    requireApprovalToPublish: boolean("require_approval_to_publish").notNull().default(true),
    defaultCloseDurationDays: integer("default_close_duration_days").notNull().default(30),
    documentRetentionDays: integer("document_retention_days").notNull().default(90),
    adminAlertRecipients: text("admin_alert_recipients").array().notNull().default([]),
  },
  (table) => [uniqueIndex("ts_content_careers_settings_site_idx").on(table.siteId)],
);

export type CareersSettings = typeof careersSettingsTable.$inferSelect;
export type InsertCareersSettings = typeof careersSettingsTable.$inferInsert;
