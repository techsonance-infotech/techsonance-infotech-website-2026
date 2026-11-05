import { pgTable, text, uuid, integer, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { baseEntityFields } from "../base.schema";
import { generationJobsTable } from "./generation-job.schema";
import { AiStepStatusEnum } from "../enum.schema";
import { AiStepStatus } from "../../enum/ai.enum";

export { AiStepStatus };

export const jobStepsTable = pgTable(
  "ts_ai_job_steps",
  {
    ...baseEntityFields,
    jobId: uuid("job_id")
      .notNull()
      .references(() => generationJobsTable.id, { onDelete: "cascade" }),
    stepName: text("step_name").notNull(), // 'outline' | 'section_1' | 'meta' | 'image' | 'validate' | 'critic'
    status: AiStepStatusEnum("status").notNull().default(AiStepStatus.PENDING),
    idempotencyKey: text("idempotency_key").notNull(), // `${jobId}:${stepName}:${version}`
    inputData: jsonb("input_data"),
    outputData: jsonb("output_data"),
    provider: text("provider"),
    model: text("model"),
    tokensUsed: integer("tokens_used").default(0),
    durationMs: integer("duration_ms").default(0),
    error: text("error"),
  },
  (table) => [uniqueIndex("ts_ai_job_steps_idempotency_idx").on(table.idempotencyKey)],
);

export type JobStep = typeof jobStepsTable.$inferSelect;
export type InsertJobStep = typeof jobStepsTable.$inferInsert;
