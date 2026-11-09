import "server-only";
import { inject } from "@needle-di/core";
import { and, count, desc, eq, or } from "drizzle-orm";
import { DRIZZLE_DB_TOKEN } from "@/lib/di/tokens";
import type { ContentVersion, Database, InsertContentAuditLog } from "@/lib/database/index";
import { withTransaction } from "@/lib/database/transaction";
import {
  jobsTable,
  auditLogsTable,
  versionsTable,
  sitesTable,
  usersTable,
  type Job,
  type InsertJob,
  type InsertContentVersion,
} from "@/lib/database/schema/index.schema";
import { JobStatus } from "@/lib/database/enum";
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
      if (!this.db.query?.sitesTable?.findFirst) {
        return "00000000-0000-0000-0000-000000000001";
      }
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
          ...(options.status ? { where: { status: options.status } } : {}),
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

  /**
   * Validates and returns a user ID if it exists in ts_admin_users; otherwise null.
   */
  async resolveValidUserId(userId?: string | null): Promise<string | null> {
    if (!userId || !userId.trim() || userId === "00000000-0000-0000-0000-000000000000") {
      return null;
    }
    try {
      if (!this.db.query?.usersTable?.findFirst) {
        return userId.trim();
      }
      const user = await this.db.query.usersTable.findFirst({
        where: { id: userId.trim() },
        columns: { id: true },
      });
      return user ? user.id : null;
    } catch {
      return null;
    }
  }

  /**
   * Validates and returns a site ID if it exists in ts_admin_sites; otherwise resolves the single site.
   */
  async resolveValidSiteId(siteId?: string | null): Promise<string> {
    if (
      siteId &&
      siteId.trim() &&
      siteId !== "00000000-0000-0000-0000-000000000000" &&
      siteId !== "00000000-0000-0000-0000-000000000001"
    ) {
      try {
        if (!this.db.query?.sitesTable?.findFirst) {
          return siteId.trim();
        }
        const site = await this.db.query.sitesTable.findFirst({
          where: { id: siteId.trim() },
          columns: { id: true },
        });
        if (site) return site.id;
      } catch {
        // Fallback to single site
      }
    }
    return this.getSingleSiteId();
  }

  async createJobWithAudit(
    data: InsertJob,
    auditData?: Partial<InsertContentAuditLog>,
    versionData?: Partial<InsertContentVersion>,
  ): Promise<Job> {
    try {
      const siteId = await this.resolveValidSiteId(data.siteId);
      const ownerId = await this.resolveValidUserId(data.ownerId);
      const hiringManagerId = await this.resolveValidUserId(data.hiringManagerId);

      const jobDataToInsert: InsertJob = {
        ...data,
        siteId,
        ownerId: ownerId ?? undefined,
        hiringManagerId: hiringManagerId ?? undefined,
      };

      const resolvedActorId = (await this.resolveValidUserId(auditData?.actorId)) ?? undefined;
      const resolvedChangedBy =
        (await this.resolveValidUserId(versionData?.changedBy)) ?? undefined;

      return await withTransaction(
        async (tx) => {
          const [created] = await tx.insert(jobsTable).values(jobDataToInsert).returning();

          if (auditData) {
            await tx.insert(auditLogsTable).values({
              action: auditData.action || "CREATE",
              entityType: auditData.entityType || "job",
              ...auditData,
              actorId: resolvedActorId,
              entityId: created.id,
              afterState: created as unknown as Record<string, unknown>,
            });
          }

          if (versionData) {
            await tx.insert(versionsTable).values({
              entityType: versionData.entityType || "job",
              ...versionData,
              changedBy: resolvedChangedBy,
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
      const sanitizedUpdates: Partial<InsertJob> = { ...updates };
      if (updates.siteId !== undefined) {
        sanitizedUpdates.siteId = await this.resolveValidSiteId(updates.siteId);
      }
      if (updates.ownerId !== undefined) {
        sanitizedUpdates.ownerId = (await this.resolveValidUserId(updates.ownerId)) ?? undefined;
      }
      if (updates.hiringManagerId !== undefined) {
        sanitizedUpdates.hiringManagerId =
          (await this.resolveValidUserId(updates.hiringManagerId)) ?? undefined;
      }

      const resolvedActorId = (await this.resolveValidUserId(auditData?.actorId)) ?? undefined;
      const resolvedChangedBy =
        (await this.resolveValidUserId(versionData?.changedBy)) ?? undefined;

      return await withTransaction(
        async (tx) => {
          const [updated] = await tx
            .update(jobsTable)
            .set({ ...sanitizedUpdates, updatedAt: new Date() })
            .where(eq(jobsTable.id, id))
            .returning();

          if (!updated) return null;

          if (auditData) {
            await tx.insert(auditLogsTable).values({
              action: auditData.action || "UPDATE",
              entityType: auditData.entityType || "job",
              ...auditData,
              actorId: resolvedActorId,
              entityId: id,
              afterState: updated as unknown as Record<string, unknown>,
            });
          }

          if (versionData) {
            await tx.insert(versionsTable).values({
              entityType: versionData.entityType || "job",
              ...versionData,
              changedBy: resolvedChangedBy,
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

  /**
   * Finds jobs scheduled to be published whose publishAt timestamp has arrived.
   */
  async findScheduledJobsToPublish(): Promise<Job[]> {
    try {
      const now = new Date();
      if (!this.db.query?.jobsTable?.findMany) return [];
      const scheduled = await this.db.query.jobsTable.findMany({
        where: { status: JobStatus.SCHEDULED },
      });
      return ((scheduled as Job[]) || []).filter(
        (j) => j.publishAt && new Date(j.publishAt).getTime() <= now.getTime(),
      );
    } catch (error) {
      throw mapDbError(error, { context: "AdminJobsRepository.findScheduledJobsToPublish" });
    }
  }

  /**
   * Finds published or open jobs whose closesAt deadline has passed.
   */
  async findOpenJobsToClose(): Promise<Job[]> {
    try {
      const now = new Date();
      const openJobs = await this.db
        .select()
        .from(jobsTable)
        .where(or(eq(jobsTable.status, JobStatus.PUBLISHED), eq(jobsTable.status, JobStatus.OPEN)));
      return ((openJobs as Job[]) || []).filter(
        (j) => j.closesAt && new Date(j.closesAt).getTime() <= now.getTime(),
      );
    } catch (error) {
      throw mapDbError(error, { context: "AdminJobsRepository.findOpenJobsToClose" });
    }
  }
}
