import "server-only";
import { eq, and, desc, ilike, or, count } from "drizzle-orm";
import { inject } from "@needle-di/core";
import { DRIZZLE_DB_TOKEN } from "@/lib/di/tokens";
import type { Database } from "@/lib/database/index";
import {
  applicationsTable,
  jobsTable,
  auditLogsTable,
  talentPoolTable,
  type Application,
} from "@/lib/database/schema/index.schema";
import { ApplicationStatus } from "@/lib/database/enum/content.enum";
import { AppError } from "@/lib/errors";
import { mapDbError } from "@/lib/dbErrors";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  CAREER_ERRORS,
  CAREER_AUDIT_ACTIONS,
  RESUME_BUCKET,
  RESUME_SIGNED_URL_TTL_SEC,
  DEFAULT_APPLICATIONS_PAGE_SIZE,
} from "@/lib/constants/careers.constants";

// ─── Option types ─────────────────────────────────────────────────────────────

export interface ListApplicationsOptions {
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

// ─── Service ──────────────────────────────────────────────────────────────────

export class ApplicationsService {
  constructor(
    private db: Database = inject(DRIZZLE_DB_TOKEN),
    private supabaseAdmin: SupabaseClient | null = createAdminClient(),
  ) {}

  async listApplications(
    options: ListApplicationsOptions = {},
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
      conditions.push(eq(applicationsTable.knockoutTriggered, knockoutTriggered));
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
      if (err instanceof AppError) throw err;
      throw mapDbError(err);
    }
  }

  async getApplicationById(id: string): Promise<Application & { jobTitle: string }> {
    if (!id || !id.trim()) {
      throw new AppError("NOT_FOUND", CAREER_ERRORS.APPLICATION_NOT_FOUND);
    }

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

      if (!rows || rows.length === 0 || !rows[0]?.application) {
        throw new AppError("NOT_FOUND", CAREER_ERRORS.APPLICATION_NOT_FOUND);
      }

      return {
        ...rows[0].application,
        jobTitle: rows[0].jobTitle ?? "Unknown Position",
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw mapDbError(err);
    }
  }

  async updateStage(
    id: string,
    newStage: ApplicationStatus,
    rejectionReason?: string,
    actorId?: string,
  ): Promise<Application> {
    const current = await this.getApplicationById(id);

    const updateData: Partial<Application> & { updatedAt: Date } = {
      status: newStage,
      updatedAt: new Date(),
    };

    if (newStage === ApplicationStatus.REJECTED && rejectionReason) {
      (updateData as Record<string, unknown>).rejectionReason = rejectionReason;
    }

    try {
      const [updated] = await this.db
        .update(applicationsTable)
        .set(updateData)
        .where(eq(applicationsTable.id, id))
        .returning();

      try {
        await this.db.insert(auditLogsTable).values({
          actorId: actorId ?? null,
          action: CAREER_AUDIT_ACTIONS.APPLICATION_STAGE_UPDATED,
          entityType: "application",
          entityId: id,
          beforeState: { status: current.status },
          afterState: { status: newStage, rejectionReason: rejectionReason ?? null },
        });
      } catch (auditErr) {
        logger.warn("ApplicationsService.updateStage: audit log failed", {
          error: String(auditErr),
        });
      }

      return updated;
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw mapDbError(err);
    }
  }

  async updateNotesAndRating(
    id: string,
    internalNotes?: string,
    rating?: number,
    actorId?: string,
  ): Promise<Application> {
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      throw new AppError("BAD_REQUEST", CAREER_ERRORS.RATING_OUT_OF_RANGE);
    }

    const current = await this.getApplicationById(id);

    const updateData: Partial<Application> & { updatedAt: Date } = {
      updatedAt: new Date(),
    };
    if (internalNotes !== undefined) {
      (updateData as Record<string, unknown>).internalNotes = internalNotes;
    }
    if (rating !== undefined) {
      (updateData as Record<string, unknown>).rating = rating;
    }

    try {
      const [updated] = await this.db
        .update(applicationsTable)
        .set(updateData)
        .where(eq(applicationsTable.id, id))
        .returning();

      try {
        await this.db.insert(auditLogsTable).values({
          actorId: actorId ?? null,
          action: CAREER_AUDIT_ACTIONS.APPLICATION_REVIEW_UPDATED,
          entityType: "application",
          entityId: id,
          beforeState: {
            internalNotes: (current as Record<string, unknown>).internalNotes,
            rating: (current as Record<string, unknown>).rating,
          },
          afterState: { internalNotes, rating },
        });
      } catch (auditErr) {
        logger.warn("ApplicationsService.updateNotesAndRating: audit log failed", {
          error: String(auditErr),
        });
      }

      return updated;
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw mapDbError(err);
    }
  }

  async getSignedResumeUrl(id: string, _actorRole?: string): Promise<string> {
    const application = await this.getApplicationById(id);

    if (!(application as Record<string, unknown>).resumeStoragePath) {
      throw new AppError("NOT_FOUND", CAREER_ERRORS.RESUME_NOT_ATTACHED);
    }

    if (this.supabaseAdmin?.storage) {
      try {
        const { data, error } = await this.supabaseAdmin.storage
          .from(RESUME_BUCKET)
          .createSignedUrl(
            (application as Record<string, unknown>).resumeStoragePath as string,
            RESUME_SIGNED_URL_TTL_SEC,
          );

        if (error) {
          throw new AppError(
            "INTERNAL",
            `${CAREER_ERRORS.SIGNED_URL_FAILED}: ${error.message}`,
          );
        }

        if (data?.signedUrl) {
          return data.signedUrl;
        }
      } catch (err) {
        if (err instanceof AppError) throw err;
        throw mapDbError(err);
      }
    }

    return (
      ((application as Record<string, unknown>).resumeUrl as string | undefined) ??
      ((application as Record<string, unknown>).resumeStoragePath as string)
    );
  }

  async exportApplicationsCsv(jobId?: string): Promise<string> {
    try {
      const rows = await this.db
        .select({
          app: applicationsTable,
          jobTitle: jobsTable.title,
        })
        .from(applicationsTable)
        .leftJoin(jobsTable, eq(applicationsTable.jobId, jobsTable.id))
        .where(jobId ? eq(applicationsTable.jobId, jobId) : undefined)
        .orderBy(desc(applicationsTable.createdAt));

      const headers = [
        "ID",
        "Candidate Name",
        "Email",
        "Phone",
        "Status",
        "Job Title",
        "Knockout Triggered",
        "Rating",
        "Created At",
      ];

      const escapeCsv = (val: unknown): string => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      const lines = [headers.join(",")];

      for (const item of rows) {
        const rec = item.app as unknown as Record<string, unknown>;
        const line = [
          escapeCsv(rec.id),
          escapeCsv(rec.candidateName),
          escapeCsv(rec.email),
          escapeCsv(rec.phone ?? ""),
          escapeCsv(rec.status),
          escapeCsv(item.jobTitle ?? "Role"),
          escapeCsv(rec.knockoutTriggered ? "Yes" : "No"),
          escapeCsv(rec.rating ?? ""),
          escapeCsv(rec.createdAt ? new Date(rec.createdAt as string).toISOString() : ""),
        ];
        lines.push(line.join(","));
      }

      return lines.join("\n");
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw mapDbError(err);
    }
  }

  async exportCandidateData(email: string) {
    if (!email || !email.trim()) {
      throw new AppError("VALIDATION", CAREER_ERRORS.CANDIDATE_EMAIL_REQUIRED);
    }
    const cleanEmail = email.trim().toLowerCase();

    try {
      const [applications, talentPoolSubmissions] = await Promise.all([
        this.db
          .select()
          .from(applicationsTable)
          .where(eq(applicationsTable.email, cleanEmail)),
        this.db
          .select()
          .from(talentPoolTable)
          .where(eq(talentPoolTable.email, cleanEmail)),
      ]);

      return {
        email: cleanEmail,
        exportedAt: new Date(),
        applications: applications ?? [],
        talentPoolSubmissions: talentPoolSubmissions ?? [],
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw mapDbError(err);
    }
  }

  async purgeCandidateData(
    email: string,
    actorId?: string,
    ipAddress?: string,
  ) {
    if (!email || !email.trim()) {
      throw new AppError("VALIDATION", CAREER_ERRORS.CANDIDATE_EMAIL_REQUIRED_GDPR);
    }
    const cleanEmail = email.trim().toLowerCase();

    // 1. Fetch all applications and talent pool entries
    let applications: Application[] = [];
    let talentPoolRows: unknown[] = [];

    try {
      [applications, talentPoolRows] = await Promise.all([
        this.db
          .select()
          .from(applicationsTable)
          .where(eq(applicationsTable.email, cleanEmail)),
        this.db
          .select()
          .from(talentPoolTable)
          .where(eq(talentPoolTable.email, cleanEmail)),
      ]);
    } catch (err) {
      throw mapDbError(err);
    }

    // 2. Collect resume storage paths
    const resumeStoragePaths: string[] = [];
    for (const app of applications) {
      const path = (app as Record<string, unknown>).resumeStoragePath;
      if (typeof path === "string" && path) resumeStoragePaths.push(path);
    }
    for (const tp of talentPoolRows) {
      const path = (tp as Record<string, unknown>).resumeStoragePath;
      if (typeof path === "string" && path) resumeStoragePaths.push(path);
    }

    // 3. Purge resume files from Supabase Storage
    let deletedFilesCount = 0;
    if (resumeStoragePaths.length > 0 && this.supabaseAdmin?.storage) {
      try {
        const { data, error } = await this.supabaseAdmin.storage
          .from(RESUME_BUCKET)
          .remove(resumeStoragePaths);
        if (error) {
          logger.warn(
            "ApplicationsService.purgeCandidateData: failed to remove some files",
            { error: error.message },
          );
        }
        deletedFilesCount = data?.length ?? resumeStoragePaths.length;
      } catch (storageErr) {
        logger.warn("ApplicationsService.purgeCandidateData: storage exception", {
          error: String(storageErr),
        });
        deletedFilesCount = resumeStoragePaths.length;
      }
    }

    // 4. Hard delete from database
    try {
      await Promise.all([
        this.db
          .delete(applicationsTable)
          .where(eq(applicationsTable.email, cleanEmail)),
        this.db
          .delete(talentPoolTable)
          .where(eq(talentPoolTable.email, cleanEmail)),
      ]);
    } catch (err) {
      throw mapDbError(err);
    }

    const deletedApplicationsCount = applications.length;
    const deletedTalentPoolCount = talentPoolRows.length;

    // 5. Record GDPR compliance audit trail
    try {
      await this.db.insert(auditLogsTable).values({
        actorId,
        action: CAREER_AUDIT_ACTIONS.CANDIDATE_PURGED,
        entityType: "candidate",
        entityId: cleanEmail,
        ipAddress,
        afterState: {
          email: cleanEmail,
          deletedApplicationsCount,
          deletedTalentPoolCount,
          deletedFilesCount,
          purgedAt: new Date().toISOString(),
        },
      });
    } catch (auditErr) {
      logger.warn("ApplicationsService.purgeCandidateData: audit log failed", {
        error: String(auditErr),
      });
    }

    return {
      success: true,
      email: cleanEmail,
      deletedApplicationsCount,
      deletedTalentPoolCount,
      deletedFilesCount,
    };
  }
}
