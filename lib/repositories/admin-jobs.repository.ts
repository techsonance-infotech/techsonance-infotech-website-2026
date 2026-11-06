import "server-only";
import { inject } from "@needle-di/core";
import { and, count, desc, eq } from "drizzle-orm";
import { DRIZZLE_DB_TOKEN } from "@/lib/di/tokens";
import type { ContentVersion, Database, InsertContentAuditLog } from "@/lib/database/index";
import { withTransaction } from "@/lib/database/transaction";
import {
  jobsTable,
  auditLogsTable,
  versionsTable,
  sitesTable,
  type Job,
  type InsertJob,
  type InsertContentVersion,
} from "@/lib/database/schema/index.schema";
import type { JobStatus } from "@/lib/database/enum";
import { mapDbError } from "@/lib/dbErrors";

export interface ListAdminJobsOptions {
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
   * Resolves the single site ID for the project in ts_admin_sites.
   */
  async getSingleSiteId(): Promise<string> {
    try {
      const existing = await this.db.query.sitesTable.findFirst({
        columns: { id: true },
      });
      if (existing) return existing.id;

      const [created] = await this.db
        .insert(sitesTable)
        .values({
          name: "TechSonance Infotech",
          slug: "techsonance-main",
          domain: "techsonance.co.in",
        })
        .returning();

      return created.id;
    } catch (err) {
      throw mapDbError(err, { context: "AdminJobsRepository.getSingleSiteId" });
    }
  }

  async listJobs(options: ListAdminJobsOptions = {}): Promise<ListAdminJobsResult> {
    const limit = options.limit ?? 20;
    const offset = options.offset ?? 0;

    try {
      const [jobs, totalResult] = await Promise.all([
        this.db.query.jobsTable.findMany({
          limit,
          offset,
          orderBy: { createdAt: "desc" },
          where: options.status ? { status: options.status } : undefined,
        }),
        this.db
          .select({ cnt: count() })
          .from(jobsTable)
          .where(options.status ? eq(jobsTable.status, options.status) : undefined),
      ]);

      const cnt = (totalResult as Array<{ cnt: number }>)[0]?.cnt;
      return {
        jobs: jobs as Job[],
        total: cnt !== undefined ? Number(cnt) : jobs.length,
      };
    } catch (error) {
      throw mapDbError(error, { context: "AdminJobsRepository.listJobs" });
    }
  }

  async findJobById(id: string): Promise<Job | null> {
    if (!id || !id.trim()) return null;
    try {
      const job = await this.db.query.jobsTable.findFirst({ where: { id } });
      return (job as Job) ?? null;
    } catch (error) {
      throw mapDbError(error, { context: "AdminJobsRepository.findJobById", id });
    }
  }

  async findJobBySlug(slug: string): Promise<Job | null> {
    if (!slug || !slug.trim()) return null;
    try {
      const job = await this.db.query.jobsTable.findFirst({ where: { slug: slug.trim() } });
      return (job as Job) ?? null;
    } catch (error) {
      throw mapDbError(error, { context: "AdminJobsRepository.findJobBySlug" });
    }
  }

  async createJobWithAudit(
    data: InsertJob,
    auditData?: Partial<InsertContentAuditLog>,
    versionData?: Partial<InsertContentVersion>,
  ): Promise<Job> {
    try {
      const siteId =
        data.siteId &&
        data.siteId !== "00000000-0000-0000-0000-000000000000" &&
        data.siteId !== "00000000-0000-0000-0000-000000000001"
          ? data.siteId
          : await this.getSingleSiteId();

      const jobDataToInsert: InsertJob = {
        ...data,
        siteId,
      };

      return await withTransaction(
        async (tx) => {
          const [created] = await tx.insert(jobsTable).values(jobDataToInsert).returning();

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
      throw mapDbError(error, { context: "AdminJobsRepository.createJobWithAudit" });
    }
  }

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
            .set({ ...updates, updatedAt: new Date() })
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
      throw mapDbError(error, { context: "AdminJobsRepository.updateJobWithAudit", id });
    }
  }

  async listJobVersions(jobId: string): Promise<ContentVersion[]> {
    if (!jobId || !jobId.trim()) return [];
    try {
      return await this.db
        .select()
        .from(versionsTable)
        .where(and(eq(versionsTable.entityType, "job"), eq(versionsTable.entityId, jobId)))
        .orderBy(desc(versionsTable.createdAt));
    } catch (error) {
      throw mapDbError(error, { context: "AdminJobsRepository.listJobVersions", id: jobId });
    }
  }

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
      throw mapDbError(error, { context: "AdminJobsRepository.deleteJobWithAudit", id });
    }
  }
}
