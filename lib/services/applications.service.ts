import "server-only";
import { inject } from "@needle-di/core";
import { AdminApplicationsRepository } from "@/lib/repositories/admin-applications.repository";
import type { Application } from "@/lib/database/schema/index.schema";
import { ApplicationStatus } from "@/lib/database/enum/content.enum";
import { AppError } from "@/lib/errors";
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

export class ApplicationsService {
  constructor(
    private repository: AdminApplicationsRepository = inject(AdminApplicationsRepository),
    private supabaseAdmin: SupabaseClient | null = createAdminClient(),
  ) {}

  async listApplications(options: ListApplicationsOptions = {}): Promise<ListApplicationsResult> {
    const res = await this.repository.listApplications({
      jobId: options.jobId,
      status: options.status,
      knockoutTriggered: options.knockoutTriggered,
      search: options.search,
      limit: options.limit ?? DEFAULT_APPLICATIONS_PAGE_SIZE,
      offset: options.offset ?? 0,
    });

    return {
      applications: res.applications.map((item) => ({
        ...item.application,
        jobTitle: item.jobTitle ?? "Unknown Position",
      })),
      total: res.total,
    };
  }

  async listTalentPool(options: { search?: string; limit?: number; offset?: number } = {}) {
    return await this.repository.listTalentPool(options);
  }

  async getApplicationById(id: string): Promise<Application & { jobTitle: string }> {
    if (!id || !id.trim()) {
      throw new AppError("NOT_FOUND", CAREER_ERRORS.APPLICATION_NOT_FOUND);
    }

    const row = await this.repository.findApplicationById(id);
    if (!row || !row.application) {
      throw new AppError("NOT_FOUND", CAREER_ERRORS.APPLICATION_NOT_FOUND);
    }

    return {
      ...row.application,
      jobTitle: row.jobTitle ?? "Unknown Position",
    };
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

    const auditData = {
      actorId: actorId ?? null,
      action: CAREER_AUDIT_ACTIONS.APPLICATION_STAGE_UPDATED,
      entityType: "application",
      entityId: id,
      beforeState: { status: current.status },
      afterState: { status: newStage, rejectionReason: rejectionReason ?? null },
    };

    const updated = await this.repository.updateStageWithAudit(id, updateData, auditData);
    if (!updated) {
      throw new AppError("NOT_FOUND", CAREER_ERRORS.APPLICATION_NOT_FOUND);
    }

    return updated;
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

    const auditData = {
      actorId: actorId ?? null,
      action: CAREER_AUDIT_ACTIONS.APPLICATION_REVIEW_UPDATED,
      entityType: "application",
      entityId: id,
      beforeState: {
        internalNotes: (current as Record<string, unknown>).internalNotes,
        rating: (current as Record<string, unknown>).rating,
      },
      afterState: { internalNotes, rating },
    };

    const updated = await this.repository.updateReviewWithAudit(id, updateData, auditData);
    if (!updated) {
      throw new AppError("NOT_FOUND", CAREER_ERRORS.APPLICATION_NOT_FOUND);
    }

    return updated;
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
          throw new AppError("INTERNAL", `${CAREER_ERRORS.SIGNED_URL_FAILED}: ${error.message}`);
        }

        if (data?.signedUrl) {
          return data.signedUrl;
        }
      } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError("INTERNAL", `${CAREER_ERRORS.SIGNED_URL_FAILED}: ${String(err)}`);
      }
    }

    return (
      ((application as Record<string, unknown>).resumeUrl as string | undefined) ??
      ((application as Record<string, unknown>).resumeStoragePath as string)
    );
  }

  async exportApplicationsCsv(jobId?: string): Promise<string> {
    const { csvData } = await this.generateApplicationsCsv(jobId);
    return csvData;
  }

  async generateApplicationsCsv(
    jobId?: string,
    actorId?: string,
  ): Promise<{
    csvData: string;
    filename: string;
    rowCount: number;
    storagePath?: string;
  }> {
    const rows = await this.repository.listAllForExport(jobId);

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
      const rec = item.application as unknown as Record<string, unknown>;
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

    const csvData = lines.join("\n");
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = jobId
      ? `applications-${jobId}-${timestamp}.csv`
      : `applications-all-${timestamp}.csv`;

    let storagePath: string | undefined;

    if (this.supabaseAdmin?.storage) {
      try {
        const path = `exports/${filename}`;
        const buffer = Buffer.from(csvData, "utf-8");
        const { error } = await this.supabaseAdmin.storage
          .from(RESUME_BUCKET)
          .upload(path, buffer, {
            contentType: "text/csv; charset=utf-8",
            upsert: true,
          });

        if (!error) {
          storagePath = path;
          logger.info("Applications CSV export archived to storage bucket", {
            storagePath,
            rowCount: rows.length,
            actorId,
          });
        } else {
          logger.warn("Failed to archive CSV export to storage bucket", { error: error.message });
        }
      } catch (uploadErr) {
        logger.warn("Exception uploading CSV export to storage bucket", {
          error: String(uploadErr),
        });
      }
    }

    return {
      csvData,
      filename,
      rowCount: rows.length,
      ...(storagePath ? { storagePath } : {}),
    };
  }

  async exportCandidateData(email: string) {
    if (!email || !email.trim()) {
      throw new AppError("VALIDATION", CAREER_ERRORS.CANDIDATE_EMAIL_REQUIRED);
    }
    const cleanEmail = email.trim().toLowerCase();

    const { applications, talentPool } = await this.repository.findCandidateRecords(cleanEmail);

    return {
      email: cleanEmail,
      exportedAt: new Date(),
      applications: applications ?? [],
      talentPoolSubmissions: talentPool ?? [],
    };
  }

  async purgeCandidateData(email: string, actorId?: string, ipAddress?: string) {
    if (!email || !email.trim()) {
      throw new AppError("VALIDATION", CAREER_ERRORS.CANDIDATE_EMAIL_REQUIRED_GDPR);
    }
    const cleanEmail = email.trim().toLowerCase();

    // 1. Fetch candidate records to locate storage files
    const { applications, talentPool } = await this.repository.findCandidateRecords(cleanEmail);

    // 2. Collect resume storage paths
    const resumeStoragePaths: string[] = [];
    for (const app of applications) {
      const path = (app as Record<string, unknown>).resumeStoragePath;
      if (typeof path === "string" && path) resumeStoragePaths.push(path);
    }
    for (const tp of talentPool) {
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
          logger.warn("ApplicationsService.purgeCandidateData: failed to remove some files", {
            error: error.message,
          });
        }
        deletedFilesCount = data?.length ?? resumeStoragePaths.length;
      } catch (storageErr) {
        logger.warn("ApplicationsService.purgeCandidateData: storage exception", {
          error: String(storageErr),
        });
        deletedFilesCount = resumeStoragePaths.length;
      }
    }

    // 4. Purge from database with audit log
    const auditData = {
      actorId,
      action: CAREER_AUDIT_ACTIONS.CANDIDATE_PURGED,
      entityType: "candidate",
      entityId: cleanEmail,
      ipAddress,
      afterState: {
        email: cleanEmail,
        deletedApplicationsCount: applications.length,
        deletedTalentPoolCount: talentPool.length,
        deletedFilesCount,
        purgedAt: new Date().toISOString(),
      },
    };

    const { deletedApplicationsCount, deletedTalentPoolCount } =
      await this.repository.purgeCandidateRecords(cleanEmail, auditData);

    return {
      success: true,
      email: cleanEmail,
      deletedApplicationsCount,
      deletedTalentPoolCount,
      deletedFilesCount,
    };
  }
}
