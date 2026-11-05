import "server-only";
import { inject } from "@needle-di/core";
import { eq, and, ilike, count, desc } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { DRIZZLE_DB_TOKEN } from "../di/tokens";
import type { Database } from "../database/index";
import { jobsTable, type Job, type InsertJob } from "../database/schema/core/job.schema";
import { JobStatus, JobApprovalStatus } from "../database/enum";
import { auditLogsTable } from "../database/schema/core/audit.schema";
import { versionsTable, type ContentVersion } from "../database/schema/core/version.schema";
import { AppError } from "@/lib/errors";
import { mapDbError } from "@/lib/dbErrors";
import { logger } from "@/lib/logger";
import {
  CAREER_ERRORS,
  CAREER_AUDIT_ACTIONS,
  DEFAULT_APPLICATIONS_PAGE_SIZE,
} from "@/lib/constants/careers.constants";

export interface ListJobsOptions {
  siteId?: string;
  status?: JobStatus;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ListJobsResult {
  jobs: Job[];
  total: number;
}

export class AdminJobsService {
  constructor(private db: Database = inject(DRIZZLE_DB_TOKEN)) {}

  async listJobs(options: ListJobsOptions = {}): Promise<ListJobsResult> {
    const limit = options.limit ?? 20;
    const offset = options.offset ?? 0;

    try {
      const dbAny = this.db as unknown as {
        query?: {
          jobsTable?: {
            findMany: (opts?: unknown) => Promise<unknown[]>;
          };
        };
      };

      if (typeof dbAny.query?.jobsTable?.findMany === "function") {
        const [jobs, totalResult] = await Promise.all([
          dbAny.query.jobsTable.findMany({
            limit,
            offset,
          }),
          this.db.select({ cnt: count() }).from(jobsTable),
        ]);
        return {
          jobs: jobs as Job[],
          total: (totalResult as Array<{ cnt: number }>)[0]?.cnt ?? 0,
        };
      }

      const conditions = [];
      if (options.siteId) {
        conditions.push(eq(jobsTable.siteId, options.siteId));
      }
      if (options.status) {
        conditions.push(eq(jobsTable.status, options.status));
      }
      if (options.search && options.search.trim()) {
        conditions.push(ilike(jobsTable.title, `%${options.search.trim()}%`));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [jobs, totalResult] = await Promise.all([
        this.db
          .select()
          .from(jobsTable)
          .where(whereClause)
          .orderBy(desc(jobsTable.createdAt))
          .limit(limit)
          .offset(offset),
        whereClause
          ? this.db.select({ cnt: count() }).from(jobsTable).where(whereClause)
          : this.db.select({ cnt: count() }).from(jobsTable),
      ]);

      return {
        jobs,
        total: totalResult[0]?.cnt ?? 0,
      };
    } catch (error) {
      logger.error("AdminJobsService.listJobs error", { error: String(error) });
      throw mapDbError(error);
    }
  }

  async getJobById(id: string): Promise<Job | null> {
    if (!id || !id.trim()) return null;

    try {
      const dbAny = this.db as unknown as {
        query?: {
          jobsTable?: {
            findFirst: (opts?: unknown) => Promise<Job | null>;
          };
        };
      };

      if (typeof dbAny.query?.jobsTable?.findFirst === "function") {
        const job = await dbAny.query.jobsTable.findFirst({
          where: (j: Record<string, unknown>, ops: { eq: (a: unknown, b: unknown) => unknown }) =>
            ops.eq(j.id, id),
        });
        return job ?? null;
      }

      const [job] = await this.db
        .select()
        .from(jobsTable)
        .where(eq(jobsTable.id, id))
        .limit(1);
      return job ?? null;
    } catch (error) {
      logger.error("AdminJobsService.getJobById error", { id, error: String(error) });
      throw mapDbError(error);
    }
  }

  async createJob(data: InsertJob, actorId?: string, ipAddress?: string): Promise<Job> {
    if (!data.title || !data.slug) {
      throw new AppError("VALIDATION", CAREER_ERRORS.JOB_TITLE_AND_SLUG_REQUIRED);
    }

    try {
      const [created] = await this.db.insert(jobsTable).values(data).returning();

      try {
        await this.db.insert(auditLogsTable).values({
          actorId,
          action: CAREER_AUDIT_ACTIONS.JOB_CREATE,
          entityType: "job",
          entityId: created.id,
          afterState: created as unknown as Record<string, unknown>,
          ipAddress,
        });
      } catch (auditErr) {
        logger.warn("AdminJobsService.createJob audit log failed", { error: String(auditErr) });
      }

      try {
        await this.db.insert(versionsTable).values({
          entityType: "job",
          entityId: created.id,
          snapshot: created as unknown as Record<string, unknown>,
          changedBy: actorId,
        });
      } catch (verErr) {
        logger.warn("AdminJobsService.createJob version snapshot failed", { error: String(verErr) });
      }

      return created;
    } catch (error) {
      throw mapDbError(error);
    }
  }

  async updateJob(
    id: string,
    updates: Partial<InsertJob>,
    actorId?: string,
    ipAddress?: string,
  ): Promise<Job> {
    const existing = await this.getJobById(id);
    if (!existing) {
      throw new AppError("NOT_FOUND", CAREER_ERRORS.JOB_NOT_FOUND);
    }

    const nextVersionId = (existing.versionId || 1) + 1;

    try {
      const [updated] = await this.db
        .update(jobsTable)
        .set({
          ...updates,
          versionId: nextVersionId,
          updatedAt: new Date(),
        })
        .where(eq(jobsTable.id, id))
        .returning();

      try {
        await this.db.insert(auditLogsTable).values({
          actorId,
          action: CAREER_AUDIT_ACTIONS.JOB_UPDATE,
          entityType: "job",
          entityId: id,
          beforeState: existing as unknown as Record<string, unknown>,
          afterState: updated as unknown as Record<string, unknown>,
          ipAddress,
        });
      } catch (auditErr) {
        logger.warn("AdminJobsService.updateJob audit log failed", { error: String(auditErr) });
      }

      try {
        await this.db.insert(versionsTable).values({
          entityType: "job",
          entityId: id,
          snapshot: updated as unknown as Record<string, unknown>,
          changedBy: actorId,
        });
      } catch (verErr) {
        logger.warn("AdminJobsService.updateJob version snapshot failed", { error: String(verErr) });
      }

      this.revalidateJobCache(updated.slug);
      return updated;
    } catch (error) {
      throw mapDbError(error);
    }
  }

  async transitionStatus(
    jobId: string,
    targetStatus: JobStatus,
    actor: { userId: string; role: string },
    comment?: string,
    ipAddress?: string,
  ): Promise<Job> {
    const existing = await this.getJobById(jobId);
    if (!existing) {
      throw new AppError("NOT_FOUND", CAREER_ERRORS.JOB_NOT_FOUND);
    }

    if (existing.status === targetStatus) {
      return existing;
    }

    const currentStatus = existing.status;
    const role = (actor.role || "").toLowerCase();
    const isAdminOrOwner = role === "admin" || role === "owner";
    const isRecruiter = role === "recruiter" || role === "editor";

    if (!isAdminOrOwner && !isRecruiter) {
      throw new AppError("FORBIDDEN", CAREER_ERRORS.FORBIDDEN_ROLE_TRANSITION);
    }

    // Enforce 7-status state machine transitions
    switch (currentStatus) {
      case JobStatus.DRAFT:
        if (targetStatus === JobStatus.IN_REVIEW) {
          break;
        }
        if (targetStatus === JobStatus.PUBLISHED || targetStatus === JobStatus.OPEN) {
          if (!isAdminOrOwner) {
            throw new AppError("BAD_REQUEST", CAREER_ERRORS.RECRUITER_APPROVAL_REQUIRED);
          }
          break;
        }
        throw new AppError("BAD_REQUEST", `Illegal transition from ${currentStatus} to ${targetStatus}`);

      case JobStatus.IN_REVIEW:
        if (!isAdminOrOwner) {
          throw new AppError("FORBIDDEN", CAREER_ERRORS.FORBIDDEN_ROLE_APPROVE);
        }
        if (targetStatus === JobStatus.SCHEDULED) {
          if (!existing.publishAt) {
            throw new AppError("BAD_REQUEST", CAREER_ERRORS.CANNOT_SCHEDULE_WITHOUT_DATE);
          }
          break;
        }
        if (
          targetStatus === JobStatus.PUBLISHED ||
          targetStatus === JobStatus.OPEN ||
          targetStatus === JobStatus.DRAFT
        ) {
          break;
        }
        throw new AppError("BAD_REQUEST", `Illegal transition from ${currentStatus} to ${targetStatus}`);

      case JobStatus.SCHEDULED:
        if (
          targetStatus === JobStatus.PUBLISHED ||
          targetStatus === JobStatus.OPEN ||
          targetStatus === JobStatus.DRAFT
        ) {
          break;
        }
        throw new AppError("BAD_REQUEST", `Illegal transition from ${currentStatus} to ${targetStatus}`);

      case JobStatus.PUBLISHED:
      case JobStatus.OPEN:
        if (targetStatus === JobStatus.PAUSED || targetStatus === JobStatus.CLOSED) {
          break;
        }
        throw new AppError("BAD_REQUEST", `Illegal transition from ${currentStatus} to ${targetStatus}`);

      case JobStatus.PAUSED:
        if (
          targetStatus === JobStatus.PUBLISHED ||
          targetStatus === JobStatus.OPEN ||
          targetStatus === JobStatus.CLOSED
        ) {
          break;
        }
        throw new AppError("BAD_REQUEST", `Illegal transition from ${currentStatus} to ${targetStatus}`);

      case JobStatus.CLOSED:
        if (!isAdminOrOwner) {
          throw new AppError("FORBIDDEN", CAREER_ERRORS.FORBIDDEN_ROLE_REOPEN);
        }
        if (
          targetStatus === JobStatus.ARCHIVED ||
          targetStatus === JobStatus.DRAFT ||
          targetStatus === JobStatus.PUBLISHED ||
          targetStatus === JobStatus.OPEN
        ) {
          break;
        }
        throw new AppError("BAD_REQUEST", `Illegal transition from ${currentStatus} to ${targetStatus}`);

      case JobStatus.ARCHIVED:
      default:
        throw new AppError("BAD_REQUEST", `Illegal transition from ${currentStatus} to ${targetStatus}`);
    }

    // Build status-specific fields
    const updates: Partial<InsertJob> = {
      status: targetStatus,
    };

    if (targetStatus === JobStatus.PUBLISHED || targetStatus === JobStatus.OPEN) {
      updates.publishedAt = existing.publishedAt || new Date();
      updates.approvalStatus = JobApprovalStatus.APPROVED;
      updates.closedAt = null;
    } else if (targetStatus === JobStatus.SCHEDULED) {
      updates.approvalStatus = JobApprovalStatus.APPROVED;
    } else if (targetStatus === JobStatus.CLOSED) {
      updates.closedAt = new Date();
    } else if (targetStatus === JobStatus.DRAFT && currentStatus === JobStatus.IN_REVIEW) {
      updates.approvalStatus = JobApprovalStatus.RETURNED;
      if (comment) {
        updates.approvalComment = comment;
      }
    } else if (targetStatus === JobStatus.DRAFT && currentStatus === JobStatus.CLOSED) {
      updates.approvalStatus = JobApprovalStatus.PENDING;
      updates.closedAt = null;
    } else if (targetStatus === JobStatus.IN_REVIEW) {
      updates.approvalStatus = JobApprovalStatus.PENDING;
    }

    return this.updateJob(jobId, updates, actor.userId, ipAddress);
  }

  async publishJob(id: string, actorId?: string, ipAddress?: string): Promise<Job> {
    return this.updateJob(
      id,
      {
        status: JobStatus.OPEN,
      },
      actorId,
      ipAddress,
    );
  }

  async closeJob(id: string, actorId?: string, ipAddress?: string): Promise<Job> {
    return this.updateJob(
      id,
      {
        status: JobStatus.CLOSED,
      },
      actorId,
      ipAddress,
    );
  }

  async deleteJob(id: string, actorId?: string, ipAddress?: string): Promise<boolean> {
    const existing = await this.getJobById(id);
    if (!existing) {
      return false;
    }

    try {
      await this.db.delete(jobsTable).where(eq(jobsTable.id, id));

      try {
        await this.db.insert(auditLogsTable).values({
          actorId,
          action: CAREER_AUDIT_ACTIONS.JOB_DELETE,
          entityType: "job",
          entityId: id,
          beforeState: existing as unknown as Record<string, unknown>,
          ipAddress,
        });
      } catch (auditErr) {
        logger.warn("AdminJobsService.deleteJob audit log failed", { error: String(auditErr) });
      }

      this.revalidateJobCache(existing.slug);
      return true;
    } catch (error) {
      throw mapDbError(error);
    }
  }

  async approveJob(
    jobId: string,
    actorId?: string,
    comment?: string,
    ipAddress?: string,
  ): Promise<Job> {
    const existing = await this.getJobById(jobId);
    if (!existing) {
      throw new AppError("NOT_FOUND", CAREER_ERRORS.JOB_NOT_FOUND);
    }

    const isFuturePublish =
      existing.publishAt && new Date(existing.publishAt).getTime() > Date.now();
    const targetStatus = isFuturePublish ? JobStatus.SCHEDULED : JobStatus.PUBLISHED;
    const nextVersionId = (existing.versionId || 1) + 1;

    const updates = {
      status: targetStatus,
      approvalStatus: JobApprovalStatus.APPROVED,
      approvalComment: comment || null,
      publishedAt: targetStatus === JobStatus.PUBLISHED ? new Date() : null,
      versionId: nextVersionId,
      updatedAt: new Date(),
    };

    try {
      const [updated] = await this.db
        .update(jobsTable)
        .set(updates)
        .where(eq(jobsTable.id, jobId))
        .returning();

      try {
        await this.db.insert(auditLogsTable).values({
          actorId,
          action: CAREER_AUDIT_ACTIONS.JOB_APPROVE,
          entityType: "job",
          entityId: jobId,
          beforeState: existing as unknown as Record<string, unknown>,
          afterState: updated as unknown as Record<string, unknown>,
          ipAddress,
        });
      } catch (auditErr) {
        logger.warn("AdminJobsService.approveJob audit log failed", { error: String(auditErr) });
      }

      try {
        await this.db.insert(versionsTable).values({
          entityType: "job",
          entityId: jobId,
          snapshot: updated as unknown as Record<string, unknown>,
          changedBy: actorId,
        });
      } catch (verErr) {
        logger.warn("AdminJobsService.approveJob version snapshot failed", { error: String(verErr) });
      }

      this.revalidateJobCache(updated.slug);
      return updated;
    } catch (error) {
      throw mapDbError(error);
    }
  }

  async returnJob(
    jobId: string,
    comment: string,
    actorId?: string,
    ipAddress?: string,
  ): Promise<Job> {
    if (!comment || !comment.trim()) {
      throw new AppError("BAD_REQUEST", CAREER_ERRORS.RETURN_FEEDBACK_REQUIRED);
    }

    const existing = await this.getJobById(jobId);
    if (!existing) {
      throw new AppError("NOT_FOUND", CAREER_ERRORS.JOB_NOT_FOUND);
    }

    const nextVersionId = (existing.versionId || 1) + 1;
    const updates = {
      status: JobStatus.DRAFT,
      approvalStatus: JobApprovalStatus.RETURNED,
      approvalComment: comment.trim(),
      versionId: nextVersionId,
      updatedAt: new Date(),
    };

    try {
      const [updated] = await this.db
        .update(jobsTable)
        .set(updates)
        .where(eq(jobsTable.id, jobId))
        .returning();

      try {
        await this.db.insert(auditLogsTable).values({
          actorId,
          action: CAREER_AUDIT_ACTIONS.JOB_RETURN,
          entityType: "job",
          entityId: jobId,
          beforeState: existing as unknown as Record<string, unknown>,
          afterState: updated as unknown as Record<string, unknown>,
          ipAddress,
        });
      } catch (auditErr) {
        logger.warn("AdminJobsService.returnJob audit log failed", { error: String(auditErr) });
      }

      try {
        await this.db.insert(versionsTable).values({
          entityType: "job",
          entityId: jobId,
          snapshot: updated as unknown as Record<string, unknown>,
          changedBy: actorId,
        });
      } catch (verErr) {
        logger.warn("AdminJobsService.returnJob version snapshot failed", { error: String(verErr) });
      }

      this.revalidateJobCache(updated.slug);
      return updated;
    } catch (error) {
      throw mapDbError(error);
    }
  }

  async listVersions(jobId: string): Promise<ContentVersion[]> {
    try {
      const versions = await this.db
        .select()
        .from(versionsTable)
        .where(and(eq(versionsTable.entityType, "job"), eq(versionsTable.entityId, jobId)))
        .orderBy(desc(versionsTable.createdAt));
      return versions || [];
    } catch (error) {
      logger.error("AdminJobsService.listVersions error", { jobId, error: String(error) });
      throw mapDbError(error);
    }
  }

  async restoreVersion(
    jobId: string,
    versionId: string,
    actorId?: string,
    ipAddress?: string,
  ): Promise<Job> {
    const existing = await this.getJobById(jobId);
    if (!existing) {
      throw new AppError("NOT_FOUND", CAREER_ERRORS.JOB_NOT_FOUND);
    }

    const versions = await this.listVersions(jobId);
    const targetVersion = versions.find((v) => v.id === versionId);
    if (!targetVersion || !targetVersion.snapshot) {
      throw new AppError("NOT_FOUND", `Version "${versionId}" not found for job "${jobId}"`);
    }

    const snapshot = targetVersion.snapshot as Record<string, unknown>;
    const nextVersionId = (existing.versionId || 1) + 1;

    const { id: _id, createdAt: _c, updatedAt: _u, ...restSnapshot } = snapshot;
    const updates = {
      ...restSnapshot,
      versionId: nextVersionId,
      updatedAt: new Date(),
    };

    try {
      const [updated] = await this.db
        .update(jobsTable)
        .set(updates)
        .where(eq(jobsTable.id, jobId))
        .returning();

      try {
        await this.db.insert(auditLogsTable).values({
          actorId,
          action: CAREER_AUDIT_ACTIONS.JOB_RESTORE_VERSION,
          entityType: "job",
          entityId: jobId,
          beforeState: existing as unknown as Record<string, unknown>,
          afterState: updated as unknown as Record<string, unknown>,
          ipAddress,
        });
      } catch (auditErr) {
        logger.warn("AdminJobsService.restoreVersion audit log failed", { error: String(auditErr) });
      }

      try {
        await this.db.insert(versionsTable).values({
          entityType: "job",
          entityId: jobId,
          snapshot: updated as unknown as Record<string, unknown>,
          changedBy: actorId,
        });
      } catch (verErr) {
        logger.warn("AdminJobsService.restoreVersion version snapshot failed", { error: String(verErr) });
      }

      this.revalidateJobCache(updated.slug);
      return updated;
    } catch (error) {
      throw mapDbError(error);
    }
  }

  private revalidateJobCache(slug?: string): void {
    try {
      revalidateTag("jobs", "default");
      if (slug) {
        revalidateTag(`job:${slug}`, "default");
      }
    } catch {
      // Degrades safely outside Next.js request context
    }
  }
}
