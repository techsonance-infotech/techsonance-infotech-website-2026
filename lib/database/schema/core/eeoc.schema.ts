import { pgTable, text, uuid, index } from "drizzle-orm/pg-core";
import { baseCreatedAt } from "../base.schema";
import { jobsTable } from "./job.schema";

export const eeocResponsesTable = pgTable(
  "ts_content_eeoc_responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobsTable.id, { onDelete: "cascade" }),
    gender: text("gender"),
    ethnicity: text("ethnicity"),
    veteranStatus: text("veteran_status"),
    disabilityStatus: text("disability_status"),
    ...baseCreatedAt,
  },
  (table) => [index("ts_content_eeoc_job_idx").on(table.jobId)],
);

export type EEOCResponse = typeof eeocResponsesTable.$inferSelect;
export type InsertEEOCResponse = typeof eeocResponsesTable.$inferInsert;
