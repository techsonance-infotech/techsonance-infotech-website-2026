import "server-only";
import { inject } from "@needle-di/core";
import { and, count, desc, eq, ilike } from "drizzle-orm";
import { DRIZZLE_DB_TOKEN } from "@/lib/di/tokens";
import type { ContentVersion, Database, InsertContentAuditLog } from "@/lib/database/index";
import { withTransaction } from "@/lib/database/transaction";
import {
  jobsTable,
  auditLogsTable,
  versionsTable,
  type Job,
  type InsertJob,
  type InsertContentVersion,
} from "@/lib/database/schema/index.schema";
import type { JobStatus } from "@/lib/database/enum";
import { mapDbError } from "@/lib/dbErrors";

export interface ListAdminJobsOptions {
  siteId?: string;
  status?: JobStatus;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ListAdminJobsResult {
  jobs: Job[];
  total: number;
}

export class AdminJobsRepository {
  constructor(private db: Database = inject(DRIZZLE_DB_TOKEN)) {}

  /**
   * Lists jobs using Drizzle RQB v2 object syntax.
   * Returns row types directly per rule 12 §2.7.
   */
  async listJobs(options: ListAdminJobsOptions = {}): Promise<ListAdminJobsResult> {
    const limit = options.limit ?? 20;
    const offset = options.offset ?? 0;

    try {
      const where: { siteId?: string; status?: JobStatus } = {};
      if (options.siteId) where.siteId = options.siteId;
      if (options.status) where.status = options.status;

      const hasObjWhere = Object.keys(where).length > 0;

      const [jobs, totalResult] = await Promise.all([
        this.db.query.jobsTable.findMany({
          limit,
          offset,
          orderBy: { createdAt: "desc" },
          where: hasObjWhere ? where : undefined,
        }),
        this.db
          .select({ cnt: count() })
          .from(jobsTable)
          .where(
            hasObjWhere
              ? and(
                  where.siteId ? eq(jobsTable.siteId, where.siteId) : undefined,
                  where.status ? eq(jobsTable.status, where.status) : undefined,
                )
              : undefined,
          ),
      ]);

      const cnt = (totalResult as Array<{ cnt: number }>)[0]?.cnt;
      return {
        jobs: jobs as Job[],
        total: cnt !== undefined ? Number(cnt) : jobs.length,
      };
    } catch (error) {
      throw mapDbError(error, {
        context: "AdminJobsRepository.listJobs",
      });
    }
  }

  /**
   * Finds a job by ID using Drizzle RQB v2 object syntax.
   * Returns row type or null.
   */
  async findJobById(id: string): Promise<Job | null> {
    if (!id || !id.trim()) return null;

    try {
      const job = await this.db.query.jobsTable.findFirst({
        where: { id },
      });

      return (job as Job) ?? null;
    } catch (error) {
      throw mapDbError(error, {
        context: "AdminJobsRepository.findJobById",
        id,
      });
    }
  }

  /**
   * Finds a job by unique slug using Drizzle RQB v2 object syntax.
   */
  async findJobBySlug(slug: string): Promise<Job | null> {
    if (!slug || !slug.trim()) return null;

    try {
      const job = await this.db.query.jobsTable.findFirst({
        where: { slug: slug.trim() },
      });

      return (job as Job) ?? null;
    } catch (error) {
      throw mapDbError(error, {
        context: "AdminJobsRepository.findJobBySlug",
      });
    }
  }

  /**
   * Inserts a new job and captures initial audit log + version snapshot atomically.
   */
  async createJobWithAudit(
    data: InsertJob,
    auditData?: Partial<InsertContentAuditLog>,
    versionData?: Partial<InsertContentVersion>,
  ): Promise<Job> {
    try {
      return await withTransaction(
        async (tx) => {
          const [created] = await tx.insert(jobsTable).values(data).returning();

          if (auditData) {
            await tx.insert(auditLogsTable).values({
              action: auditData.action || "CREATE",
              entityType: auditData.entityType || "job",
              ...auditData,
              entityId: created.id,
              afterState: created as unknown as Record<string, unknown>,
            });
          }

          if (versionData) {
            await tx.insert(versionsTable).values({
              entityType: versionData.entityType || "job",
              ...versionData,
              entityId: created.id,
              snapshot: created as unknown as Record<string, unknown>,
            });
          }

          return created;
        },
        { database: this.db },
      );
    } catch (error) {
      throw mapDbError(error, {
        context: "AdminJobsRepository.createJobWithAudit",
      });
    }
  }

  /**
   * Updates a job and captures audit log + version snapshot atomically.
   * Mandatory where clause (rule 12 §2.6).
   */
  async updateJobWithAudit(
    id: string,
    updates: Partial<InsertJob>,
    auditData?: Partial<InsertContentAuditLog>,
    versionData?: Partial<InsertContentVersion>,
  ): Promise<Job | null> {
    try {
      return await withTransaction(
        async (tx) => {
          const [updated] = await tx
            .update(jobsTable)
            .set({
              ...updates,
              updatedAt: new Date(),
            })
            .where(eq(jobsTable.id, id))
            .returning();

          if (!updated) return null;

          if (auditData) {
            await tx.insert(auditLogsTable).values({
              action: auditData.action || "UPDATE",
              entityType: auditData.entityType || "job",
              ...auditData,
              entityId: id,
              afterState: updated as unknown as Record<string, unknown>,
            });
          }

          if (versionData) {
            await tx.insert(versionsTable).values({
              entityType: versionData.entityType || "job",
              ...versionData,
              entityId: id,
              snapshot: updated as unknown as Record<string, unknown>,
            });
          }

          return updated;
        },
        { database: this.db },
      );
    } catch (error) {
      throw mapDbError(error, {
        context: "AdminJobsRepository.updateJobWithAudit",
        id,
      });
    }
  }

  /**
   * Lists version snapshots for a given job ID.
   */
  async listJobVersions(jobId: string): Promise<ContentVersion[]> {
    if (!jobId || !jobId.trim()) return [];

    try {
      return await this.db
        .select()
        .from(versionsTable)
        .where(and(eq(versionsTable.entityType, "job"), eq(versionsTable.entityId, jobId)))
        .orderBy(desc(versionsTable.createdAt));
    } catch (error) {
      throw mapDbError(error, {
        context: "AdminJobsRepository.listJobVersions",
        id: jobId,
      });
    }
  }

  /**
   * Deletes a job by ID with an audit trail entry.
   */
  async deleteJobWithAudit(
    id: string,
    auditData?: Partial<InsertContentAuditLog>,
  ): Promise<boolean> {
    try {
      return await withTransaction(
        async (tx) => {
          const [deleted] = await tx.delete(jobsTable).where(eq(jobsTable.id, id)).returning();

          if (!deleted) return false;

          if (auditData) {
            await tx.insert(auditLogsTable).values({
              action: auditData.action || "DELETE",
              entityType: auditData.entityType || "job",
              entityId: id,
              ...auditData,
            });
          }

          return true;
        },
        { database: this.db },
      );
    } catch (error) {
      throw mapDbError(error, {
        context: "AdminJobsRepository.deleteJobWithAudit",
        id,
      });
    }
  }
}
