import "server-only";
import { inject } from "@needle-di/core";
import { eq } from "drizzle-orm";
import { DRIZZLE_DB_TOKEN } from "@/lib/di/tokens";
import type { Database } from "@/lib/database/index";
import { withTransaction } from "@/lib/database/transaction";
import {
  approvalRequestsTable,
  postsTable,
  auditLogsTable,
  type ApprovalRequest,
  type InsertApprovalRequest,
  type Post,
  type InsertPost,
} from "@/lib/database/schema/index.schema";
import type { AiApprovalDecision, AiApprovalStatus } from "@/lib/database/enum/ai.enum";
import { mapDbError } from "@/lib/dbErrors";

export class ApprovalRequestsRepository {
  constructor(private db: Database = inject(DRIZZLE_DB_TOKEN)) {}

  async create(data: InsertApprovalRequest): Promise<ApprovalRequest> {
    try {
      const [created] = await this.db.insert(approvalRequestsTable).values(data).returning();
      return created;
    } catch (err) {
      throw mapDbError(err, {
        context: "ApprovalRequestsRepository.create",
      });
    }
  }

  async updateEmailStatus(tokenHash: string, emailStatus: string): Promise<void> {
    try {
      await this.db
        .update(approvalRequestsTable)
        .set({ emailStatus })
        .where(eq(approvalRequestsTable.tokenHash, tokenHash));
    } catch (err) {
      throw mapDbError(err, {
        context: "ApprovalRequestsRepository.updateEmailStatus",
      });
    }
  }

  async findByTokenHash(
    tokenHash: string,
  ): Promise<{ request: ApprovalRequest; post: Post | null } | null> {
    try {
      const [req] = await this.db
        .select()
        .from(approvalRequestsTable)
        .where(eq(approvalRequestsTable.tokenHash, tokenHash))
        .limit(1);

      if (!req) return null;

      const [post] = await this.db
        .select()
        .from(postsTable)
        .where(eq(postsTable.id, req.postId))
        .limit(1);

      return { request: req, post: post ?? null };
    } catch (err) {
      throw mapDbError(err, {
        context: "ApprovalRequestsRepository.findByTokenHash",
      });
    }
  }

  async applyDecisionWithPostUpdate(
    requestId: string,
    postId: string,
    decisionData: {
      decision: AiApprovalDecision;
      status: AiApprovalStatus;
      feedback: string | null;
      decidedBy: string;
    },
    postUpdates: Partial<InsertPost>,
    auditAction: string,
  ): Promise<void> {
    const now = new Date();

    try {
      await withTransaction(
        async (tx) => {
          await tx
            .update(postsTable)
            .set({
              ...postUpdates,
              updatedAt: now,
            })
            .where(eq(postsTable.id, postId));

          await tx
            .update(approvalRequestsTable)
            .set({
              decision: decisionData.decision,
              status: decisionData.status,
              feedback: decisionData.feedback,
              decidedBy: decisionData.decidedBy,
              decidedAt: now,
              usedAt: now,
            })
            .where(eq(approvalRequestsTable.id, requestId));

          await tx.insert(auditLogsTable).values({
            actorId: null,
            entityType: "post",
            entityId: postId,
            action: auditAction,
            afterState: {
              decision: decisionData.decision,
              feedback: decisionData.feedback,
              status: postUpdates.status,
            },
          });
        },
        { database: this.db },
      );
    } catch (err) {
      throw mapDbError(err, {
        context: "ApprovalRequestsRepository.applyDecisionWithPostUpdate",
        id: requestId,
      });
    }
  }
}
