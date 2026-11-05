import { pgTable, text, uuid, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { baseEntityFields } from "../base.schema";
import { postsTable } from "../core/post.schema";
import { AiApprovalStatusEnum, AiApprovalDecisionEnum } from "../enum.schema";
import { AiApprovalStatus, AiApprovalDecision } from "../../enum/ai.enum";

export { AiApprovalStatus, AiApprovalDecision };

export const approvalRequestsTable = pgTable(
  "ts_ai_approval_requests",
  {
    ...baseEntityFields,
    postId: uuid("post_id")
      .notNull()
      .references(() => postsTable.id, { onDelete: "cascade" }),
    postVersion: integer("post_version").notNull().default(1),
    tokenHash: text("token_hash").notNull(), // SHA-256 hash of single-use 32-byte secret token
    status: AiApprovalStatusEnum("status").notNull().default(AiApprovalStatus.PENDING),
    decision: AiApprovalDecisionEnum("decision"),
    feedback: text("feedback"),
    decidedBy: text("decided_by"),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    emailMessageId: text("email_message_id"),
    emailStatus: text("email_status"), // 'SENT' | 'DELIVERED' | 'FAILED'
  },
  (table) => [uniqueIndex("ts_ai_approval_requests_token_hash_idx").on(table.tokenHash)],
);

export type ApprovalRequest = typeof approvalRequestsTable.$inferSelect;
export type InsertApprovalRequest = typeof approvalRequestsTable.$inferInsert;
