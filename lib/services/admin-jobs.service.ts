import "server-only";
import { inject } from "@needle-di/core";
import { eq, and, ilike, count } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { DRIZZLE_DB_TOKEN } from "../di/tokens";
import type { Database } from "../database/index";
import { jobsTable, type Job, type InsertJob } from "../database/schema/core/job.schema";
import { auditLogsTable } from "../database/schema/core/audit.schema";
import { versionsTable } from "../database/schema/core/version.schema";

export interface ListJobsOptions {
  siteId?: string;
  status?: string;
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

      const whereObj: { siteId?: string; status?: string } = {};
      if (options.siteId) whereObj.siteId = options.siteId;
      if (options.status) whereObj.status = options.status;

      const hasFilters = Object.keys(whereObj).length > 0;

      const findManyConfig: {
        orderBy: { createdAt: "desc" };
        limit: number;
        offset: number;
        where?: { siteId?: string; status?: string };
      } = {
        orderBy: { createdAt: "desc" },
        limit,
        offset,
      };

      if (hasFilters) {
        findManyConfig.where = whereObj;
      }

      const countConditions = [];
      if (options.siteId) {
        countConditions.push(eq(jobsTable.siteId, options.siteId));
      }
      if (options.status) {
        countConditions.push(eq(jobsTable.status, options.status));
      }
      if (options.search) {
        countConditions.push(ilike(jobsTable.title, `%${options.search}%`));
      }

      const countWhereClause =
        countConditions.length > 0 ? and(...countConditions) : undefined;

      const [jobs, totalResult] = await Promise.all([
        this.db.query.jobsTable.findMany(findManyConfig),
        countWhereClause
          ? this.db.select({ cnt: count() }).from(jobsTable).where(countWhereClause)
          : this.db.select({ cnt: count() }).from(jobsTable),
      ]);

      let filteredJobs = jobs as Job[];
      if (options.search) {
        const searchLower = options.search.toLowerCase();
        filteredJobs = filteredJobs.filter((j) =>
          j.title.toLowerCase().includes(searchLower),
        );
      }

      return {
        jobs: filteredJobs,
        total: totalResult[0]?.cnt ?? 0,
      };
    } catch (error) {
      console.error("AdminJobsService.listJobs error:", error);
      return { jobs: [], total: 0 };
    }
  }

  async getJobById(id: string): Promise<Job | null> {
    try {
      const job = await this.db.query.jobsTable.findFirst({
        where: { id },
      });
      return (job as Job) || null;
    } catch (error) {
      console.error("AdminJobsService.getJobById error:", error);
      return null;
    }
  }

  async createJob(
    data: InsertJob,
    actorId?: string,
    ipAddress?: string,
  ): Promise<Job> {
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

  async publishJob(
    id: string,
    actorId?: string,
    ipAddress?: string,
  ): Promise<Job> {
    return this.updateJob(
      id,
      {
        status: "OPEN",
      },
      actorId,
      ipAddress,
    );
  }

  async closeJob(
    id: string,
    actorId?: string,
    ipAddress?: string,
  ): Promise<Job> {
    return this.updateJob(
      id,
      {
        status: "CLOSED",
      },
      actorId,
      ipAddress,
    );
  }

  async deleteJob(
    id: string,
    actorId?: string,
    ipAddress?: string,
  ): Promise<boolean> {
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
