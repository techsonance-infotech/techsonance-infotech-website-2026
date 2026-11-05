import "server-only";
import { inject } from "@needle-di/core";
import { eq, and, ilike, count, desc } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { DRIZZLE_DB_TOKEN } from "../di/tokens";
import type { Database } from "../database/index";
import { jobsTable, type Job, type InsertJob } from "../database/schema/core/job.schema";
import { JobStatus, JobApprovalStatus } from "../database/enum";
import { auditLogsTable } from "../database/schema/core/audit.schema";
import { versionsTable } from "../database/schema/core/version.schema";

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
    try {
      const limit = options.limit ?? 20;
      const offset = options.offset ?? 0;

      if ((this.db as any).query?.jobsTable?.findMany) {
        const [jobs, totalResult] = await Promise.all([
          (this.db as any).query.jobsTable.findMany({
            limit,
            offset,
          }),
          this.db.select({ cnt: count() }).from(jobsTable),
        ]);
        return {
          jobs: jobs as Job[],
          total: totalResult[0]?.cnt ?? 0,
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
      console.error("AdminJobsService.listJobs error:", error);
      return { jobs: [], total: 0 };
    }
  }

  async getJobById(id: string): Promise<Job | null> {
    try {
      if ((this.db as any).query?.jobsTable?.findFirst) {
        const job = await (this.db as any).query.jobsTable.findFirst({
          where: { id },
        });
        return (job as Job) || null;
      }
      const [job] = await this.db.select().from(jobsTable).where(eq(jobsTable.id, id)).limit(1);
      return job || null;
    } catch (error) {
      console.error("AdminJobsService.getJobById error:", error);
      return null;
    }
  }

  async createJob(data: InsertJob, actorId?: string, ipAddress?: string): Promise<Job> {
    const [created] = await this.db.insert(jobsTable).values(data).returning();

    await this.db.insert(auditLogsTable).values({
      actorId,
      action: "job.create",
      entityType: "job",
      entityId: created.id,
      afterState: created as unknown as Record<string, unknown>,
      ipAddress,
    });

    await this.db.insert(versionsTable).values({
      entityType: "job",
      entityId: created.id,
      snapshot: created as unknown as Record<string, unknown>,
      changedBy: actorId,
    });

    return created;
  }

  async updateJob(
    id: string,
    updates: Partial<InsertJob>,
    actorId?: string,
    ipAddress?: string,
  ): Promise<Job> {
    const existing = await this.getJobById(id);
    if (!existing) {
      throw new Error(`Job with id "${id}" not found`);
    }

    const nextVersionId = (existing.versionId || 1) + 1;

    const [updated] = await this.db
      .update(jobsTable)
      .set({
        ...updates,
        versionId: nextVersionId,
        updatedAt: new Date(),
      })
      .where(eq(jobsTable.id, id))
      .returning();

    await this.db.insert(auditLogsTable).values({
      actorId,
      action: "job.update",
      entityType: "job",
      entityId: id,
      beforeState: existing as unknown as Record<string, unknown>,
      afterState: updated as unknown as Record<string, unknown>,
      ipAddress,
    });

    await this.db.insert(versionsTable).values({
      entityType: "job",
      entityId: id,
      snapshot: updated as unknown as Record<string, unknown>,
      changedBy: actorId,
    });

    this.revalidateJobCache(updated.slug);
    return updated;
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
      throw new Error(`Job with id "${jobId}" not found`);
    }

    if (existing.status === targetStatus) {
      return existing;
    }

    const currentStatus = existing.status;
    const role = (actor.role || "").toLowerCase();
    const isAdminOrOwner = role === "admin" || role === "owner";
    const isRecruiter = role === "recruiter" || role === "editor";

    if (!isAdminOrOwner && !isRecruiter) {
      throw new Error(`Forbidden: Role "${actor.role}" cannot transition job status`);
    }

    // Enforce 7-status state machine transitions
    switch (currentStatus) {
      case JobStatus.DRAFT:
        if (targetStatus === JobStatus.IN_REVIEW) {
          break;
        }
        if (targetStatus === JobStatus.PUBLISHED || targetStatus === JobStatus.OPEN) {
          if (!isAdminOrOwner) {
            throw new Error(
              "Approval required: Recruiters must submit role to IN_REVIEW for approval before publishing",
            );
          }
          break;
        }
        throw new Error(`Illegal transition from ${currentStatus} to ${targetStatus}`);

      case JobStatus.IN_REVIEW:
        if (!isAdminOrOwner) {
          throw new Error("Forbidden: Only Admins can approve or return roles under review");
        }
        if (targetStatus === JobStatus.SCHEDULED) {
          if (!existing.publishAt) {
            throw new Error("Cannot schedule job without a publishAt date");
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
        throw new Error(`Illegal transition from ${currentStatus} to ${targetStatus}`);

      case JobStatus.SCHEDULED:
        if (
          targetStatus === JobStatus.PUBLISHED ||
          targetStatus === JobStatus.OPEN ||
          targetStatus === JobStatus.DRAFT
        ) {
          break;
        }
        throw new Error(`Illegal transition from ${currentStatus} to ${targetStatus}`);

      case JobStatus.PUBLISHED:
      case JobStatus.OPEN:
        if (targetStatus === JobStatus.PAUSED || targetStatus === JobStatus.CLOSED) {
          break;
        }
        throw new Error(`Illegal transition from ${currentStatus} to ${targetStatus}`);

      case JobStatus.PAUSED:
        if (
          targetStatus === JobStatus.PUBLISHED ||
          targetStatus === JobStatus.OPEN ||
          targetStatus === JobStatus.CLOSED
        ) {
          break;
        }
        throw new Error(`Illegal transition from ${currentStatus} to ${targetStatus}`);

      case JobStatus.CLOSED:
        if (!isAdminOrOwner) {
          throw new Error("Forbidden: Only Admins can re-open or archive closed roles");
        }
        if (
          targetStatus === JobStatus.ARCHIVED ||
          targetStatus === JobStatus.DRAFT ||
          targetStatus === JobStatus.PUBLISHED ||
          targetStatus === JobStatus.OPEN
        ) {
          break;
        }
        throw new Error(`Illegal transition from ${currentStatus} to ${targetStatus}`);

      case JobStatus.ARCHIVED:
      default:
        throw new Error(`Illegal transition from ${currentStatus} to ${targetStatus}`);
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

    await this.db.delete(jobsTable).where(eq(jobsTable.id, id));

    await this.db.insert(auditLogsTable).values({
      actorId,
      action: "job.delete",
      entityType: "job",
      entityId: id,
      beforeState: existing as unknown as Record<string, unknown>,
      ipAddress,
    });

    this.revalidateJobCache(existing.slug);
    return true;
  }

  async approveJob(
    jobId: string,
    actorId?: string,
    comment?: string,
    ipAddress?: string,
  ): Promise<Job> {
    const existing = await this.getJobById(jobId);
    if (!existing) {
      throw new Error(`Job with id "${jobId}" not found`);
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

    let updated: Job;
    if ((this.db as any).update) {
      const [res] = await this.db
        .update(jobsTable)
        .set(updates)
        .where(eq(jobsTable.id, jobId))
        .returning();
      updated = res || ({ ...existing, ...updates } as Job);
    } else {
      updated = { ...existing, ...updates } as Job;
    }

    await this.db.insert(auditLogsTable).values({
      actorId,
      action: "job.approve",
      entityType: "job",
      entityId: jobId,
      beforeState: existing as unknown as Record<string, unknown>,
      afterState: updated as unknown as Record<string, unknown>,
      ipAddress,
    });

    await this.db.insert(versionsTable).values({
      entityType: "job",
      entityId: jobId,
      snapshot: updated as unknown as Record<string, unknown>,
      changedBy: actorId,
    });

    this.revalidateJobCache(updated.slug);
    return updated;
  }

  async returnJob(
    jobId: string,
    comment: string,
    actorId?: string,
    ipAddress?: string,
  ): Promise<Job> {
    if (!comment || !comment.trim()) {
      throw new Error("Approval comment is required when returning a role to draft");
    }

    const existing = await this.getJobById(jobId);
    if (!existing) {
      throw new Error(`Job with id "${jobId}" not found`);
    }

    const nextVersionId = (existing.versionId || 1) + 1;
    const updates = {
      status: JobStatus.DRAFT,
      approvalStatus: JobApprovalStatus.RETURNED,
      approvalComment: comment.trim(),
      versionId: nextVersionId,
      updatedAt: new Date(),
    };

    let updated: Job;
    if ((this.db as any).update) {
      const [res] = await this.db
        .update(jobsTable)
        .set(updates)
        .where(eq(jobsTable.id, jobId))
        .returning();
      updated = res || ({ ...existing, ...updates } as Job);
    } else {
      updated = { ...existing, ...updates } as Job;
    }

    await this.db.insert(auditLogsTable).values({
      actorId,
      action: "job.return",
      entityType: "job",
      entityId: jobId,
      beforeState: existing as unknown as Record<string, unknown>,
      afterState: updated as unknown as Record<string, unknown>,
      ipAddress,
    });

    await this.db.insert(versionsTable).values({
      entityType: "job",
      entityId: jobId,
      snapshot: updated as unknown as Record<string, unknown>,
      changedBy: actorId,
    });

    this.revalidateJobCache(updated.slug);
    return updated;
  }

  async listVersions(jobId: string): Promise<any[]> {
    try {
      const versions = await this.db
        .select()
        .from(versionsTable)
        .where(and(eq(versionsTable.entityType, "job"), eq(versionsTable.entityId, jobId)))
        .orderBy(desc(versionsTable.createdAt));
      return versions || [];
    } catch (error) {
      console.error("AdminJobsService.listVersions error:", error);
      return [];
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
      throw new Error(`Job with id "${jobId}" not found`);
    }

    const versions = await this.listVersions(jobId);
    const targetVersion = versions.find((v: any) => v.id === versionId);
    if (!targetVersion || !targetVersion.snapshot) {
      throw new Error(`Version "${versionId}" not found for job "${jobId}"`);
    }

    const snapshot = targetVersion.snapshot as Record<string, any>;
    const nextVersionId = (existing.versionId || 1) + 1;

    const { id: _id, createdAt: _c, updatedAt: _u, ...restSnapshot } = snapshot;
    const updates = {
      ...restSnapshot,
      versionId: nextVersionId,
      updatedAt: new Date(),
    };

    let updated: Job;
    if ((this.db as any).update) {
      const [res] = await this.db
        .update(jobsTable)
        .set(updates)
        .where(eq(jobsTable.id, jobId))
        .returning();
      updated = res || ({ ...existing, ...updates } as Job);
    } else {
      updated = { ...existing, ...updates } as Job;
    }

    await this.db.insert(auditLogsTable).values({
      actorId,
      action: "job.restore_version",
      entityType: "job",
      entityId: jobId,
      beforeState: existing as unknown as Record<string, unknown>,
      afterState: updated as unknown as Record<string, unknown>,
      ipAddress,
    });

    await this.db.insert(versionsTable).values({
      entityType: "job",
      entityId: jobId,
      snapshot: updated as unknown as Record<string, unknown>,
      changedBy: actorId,
    });

    this.revalidateJobCache(updated.slug);
    return updated;
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
