import "server-only";
import { inject } from "@needle-di/core";
import { eq, and, desc, ilike, or, count } from "drizzle-orm";
import { DRIZZLE_DB_TOKEN } from "@/lib/di/tokens";
import type { Database } from "@/lib/database/index";
import {
  applicationsTable,
  jobsTable,
  talentPoolTable,
  eeocResponsesTable,
  sitesTable,
  type Application,
  type InsertApplication,
  type Job,
  type InsertEEOCResponse,
  type EEOCResponse,
  type InsertTalentPoolCandidate,
  type TalentPoolCandidate,
} from "@/lib/database/schema/index.schema";
import type { ApplicationStatus } from "@/lib/database/enum/content.enum";
import { mapDbError } from "@/lib/dbErrors";
import { logger } from "@/lib/logger";
import {
  NIL_SITE_ID,
  DEFAULT_APPLICATIONS_PAGE_SIZE,
} from "@/lib/constants/careers.constants";

// ─── Query option types ───────────────────────────────────────────────────────

export interface ListApplicationsQueryOptions {
  jobId?: string;
  status?: ApplicationStatus;
  knockoutTriggered?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ListApplicationsResult {
  applications: Array<Application & { jobTitle: string }>;
  total: number;
}

// ─── Repository ───────────────────────────────────────────────────────────────

export class CareerApplicationsRepository {
  constructor(private db: Database = inject(DRIZZLE_DB_TOKEN)) {}

  /**
   * Returns the first site ID in the DB, or creates the default agency site
   * if none exists, ensuring foreign key references to ts_admin_sites succeed.
   */
  async getDefaultSiteId(): Promise<string | undefined> {
    try {
      const [found] = await this.db
        .select({ id: sitesTable.id })
        .from(sitesTable)
        .limit(1);
      if (found?.id) return found.id;

      // If sites table is empty, auto-provision the default agency site

      const [created] = await this.db
        .insert(sitesTable)
        .values({
          name: "TechSonance Agency",
          slug: "techsonance-agency",
          domain: "techsonance.co.in",
        })
        .onConflictDoNothing()
        .returning({ id: sitesTable.id });
      if (created?.id) return created.id;

      const [fallback] = await this.db
        .select({ id: sitesTable.id })
        .from(sitesTable)
        .limit(1);
      if (fallback?.id) return fallback.id;

      return NIL_SITE_ID;
    } catch (err) {
      throw mapDbError(err);
    }
  }

  /**
   * Finds a job by UUID or slug. Returns null when not found (caller decides
   * whether absence is an error).
   */
  async findJobById(jobId: string): Promise<Job | null> {
    if (!jobId || !jobId.trim()) return null;

    try {
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          jobId,
        );

      const dbAny = this.db as unknown as {
        query?: {
          jobsTable?: {
            findFirst: (opts?: unknown) => Promise<Job | null>;
          };
        };
      };
      if (typeof dbAny.query?.jobsTable?.findFirst === "function") {
        const res = await dbAny.query.jobsTable.findFirst({
          where: (
            jobs: Record<string, unknown>,
            ops: {
              eq: (a: unknown, b: unknown) => unknown;
              or: (a: unknown, b: unknown) => unknown;
            },
          ) =>
            isUuid
              ? ops.or(ops.eq(jobs.id, jobId), ops.eq(jobs.slug, jobId))
              : ops.eq(jobs.slug, jobId),
        });
        return res ?? null;
      }

      const condition = isUuid
        ? or(eq(jobsTable.id, jobId), eq(jobsTable.slug, jobId))
        : eq(jobsTable.slug, jobId);

      const [found] = await this.db
        .select()
        .from(jobsTable)
        .where(condition)
        .limit(1);
      return found ?? null;
    } catch (err) {
      throw mapDbError(err);
    }
  }

  /**
   * Checks for a duplicate application from the same email on the same job.
   * Returns null when no duplicate exists (caller decides the semantics).
   */
  async findExistingApplication(
    jobId: string,
    email: string,
  ): Promise<Application | null> {
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const dbAny = this.db as unknown as {
        query?: {
          applicationsTable?: {
            findFirst: (opts?: unknown) => Promise<Application | null>;
          };
        };
      };
      if (typeof dbAny.query?.applicationsTable?.findFirst === "function") {
        const res = await dbAny.query.applicationsTable.findFirst({
          where: (
            apps: Record<string, unknown>,
            ops: {
              eq: (a: unknown, b: unknown) => unknown;
              and: (a: unknown, b: unknown) => unknown;
            },
          ) =>
            ops.and(
              ops.eq(apps.jobId, jobId),
              ops.eq(apps.email, normalizedEmail),
            ),
        });
        return res ?? null;
      }

      const [found] = await this.db
        .select()
        .from(applicationsTable)
        .where(
          and(
            eq(applicationsTable.jobId, jobId),
            eq(applicationsTable.email, normalizedEmail),
          ),
        )
        .limit(1);
      return found ?? null;
    } catch (err) {
      throw mapDbError(err);
    }
  }

  /**
   * Inserts a new application record. Caller is responsible for validating
   * the payload before this call (rule 12 §2 point 2).
   */
  async insertApplication(data: InsertApplication): Promise<Application> {
    if (!data.jobId || !data.email || !data.candidateName) {
      throw mapDbError(
        new Error(
          "insertApplication: jobId, email, and candidateName are required",
        ),
      );
    }
    try {
      const [created] = await this.db
        .insert(applicationsTable)
        .values(data)
        .returning();
      return created;
    } catch (err) {
      throw mapDbError(err);
    }
  }

  /**
   * Inserts a voluntary anonymous EEOC response.
   * Returns null when the insert fails (voluntary data — caller logs & continues).
   */
  async insertEEOCResponse(
    data: InsertEEOCResponse,
  ): Promise<EEOCResponse | null> {
    try {
      const [created] = await this.db
        .insert(eeocResponsesTable)
        .values(data)
        .returning();
      return created ?? null;
    } catch (err) {
      logger.warn("CareerApplicationsRepository.insertEEOCResponse failed", {
        error: String(err),
      });
      return null;
    }
  }

  /**
   * Inserts a talent-pool candidate record.
   * Returns null on failure (caller decides recovery path).
   */
  async insertTalentPoolCandidate(
    data: InsertTalentPoolCandidate,
  ): Promise<TalentPoolCandidate | null> {
    try {
      const [created] = await this.db
        .insert(talentPoolTable)
        .values(data)
        .returning();
      return created ?? null;
    } catch (err) {
      throw mapDbError(err);
    }
  }

  /**
   * Increments `applyCount` on a job row.
   * Non-critical: failure is logged at warn and does not bubble up.
   */
  async incrementJobApplyCount(jobId: string): Promise<void> {
    try {
      const { sql } = await import("drizzle-orm");
      await this.db
        .update(jobsTable)
        .set({ applyCount: sql`${jobsTable.applyCount} + 1` })
        .where(eq(jobsTable.id, jobId));
    } catch (err) {
      logger.warn(
        "CareerApplicationsRepository.incrementJobApplyCount failed",
        {
          jobId,
          error: String(err),
        },
      );
    }
  }

  /**
   * Lists applications with optional filters, joined with job title.
   */
  async listApplications(
    options: ListApplicationsQueryOptions = {},
  ): Promise<ListApplicationsResult> {
    const {
      jobId,
      status,
      knockoutTriggered,
      search,
      limit = DEFAULT_APPLICATIONS_PAGE_SIZE,
      offset = 0,
    } = options;

    const conditions = [];
    if (jobId) conditions.push(eq(applicationsTable.jobId, jobId));
    if (status) conditions.push(eq(applicationsTable.status, status));
    if (knockoutTriggered !== undefined) {
      conditions.push(
        eq(applicationsTable.knockoutTriggered, knockoutTriggered),
      );
    }
    if (search && search.trim()) {
      const pattern = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(applicationsTable.candidateName, pattern),
          ilike(applicationsTable.email, pattern),
        ),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    try {
      const [rows, totalResult] = await Promise.all([
        this.db
          .select({
            application: applicationsTable,
            jobTitle: jobsTable.title,
          })
          .from(applicationsTable)
          .leftJoin(jobsTable, eq(applicationsTable.jobId, jobsTable.id))
          .where(whereClause)
          .orderBy(desc(applicationsTable.createdAt))
          .limit(limit)
          .offset(offset),
        this.db
          .select({ count: count() })
          .from(applicationsTable)
          .where(whereClause),
      ]);

      const total =
        totalResult?.[0]?.count !== undefined
          ? Number(totalResult[0].count)
          : rows.length;

      return {
        applications: rows.map((item) => ({
          ...item.application,
          jobTitle: item.jobTitle ?? "Unknown Position",
        })),
        total,
      };
    } catch (err) {
      throw mapDbError(err);
    }
  }

  /**
   * Finds a single application by ID, joined with job title.
   * Returns null when not found (caller decides whether absence is an error).
   */
  async findApplicationById(
    id: string,
  ): Promise<(Application & { jobTitle: string }) | null> {
    try {
      const rows = await this.db
        .select({
          application: applicationsTable,
          jobTitle: jobsTable.title,
        })
        .from(applicationsTable)
        .leftJoin(jobsTable, eq(applicationsTable.jobId, jobsTable.id))
        .where(eq(applicationsTable.id, id))
        .limit(1);

      if (!rows || rows.length === 0) return null;

      return {
        ...rows[0].application,
        jobTitle: rows[0].jobTitle ?? "Unknown Position",
      };
    } catch (err) {
      throw mapDbError(err);
    }
  }
}
