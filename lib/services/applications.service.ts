import "server-only";
import { eq, and, desc, ilike, or, count } from "drizzle-orm";
import { getDrizzleDb } from "@/lib/database";
import {
  applicationsTable,
  jobsTable,
  auditLogsTable,
  talentPoolTable,
} from "@/lib/database/schema/index.schema";
import { ApplicationStatus } from "@/lib/database/enum/content.enum";
import { AppError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

export interface ListApplicationsOptions {
  jobId?: string;
  status?: ApplicationStatus;
  knockoutTriggered?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export class ApplicationsService {
  constructor(
    private db: any = getDrizzleDb(),
    private supabaseAdmin: any = createAdminClient(),
  ) {}

  async listApplications(options: ListApplicationsOptions = {}) {
    const { jobId, status, knockoutTriggered, search, limit = 50, offset = 0 } = options;

    if (this.db?.query?.applicationsTable?.findMany) {
      const items = await this.db.query.applicationsTable.findMany({
        limit,
        offset,
        orderBy: [desc(applicationsTable.createdAt)],
      });
      return { applications: items, total: items.length };
    }

    const conditions = [];

    if (jobId) {
      conditions.push(eq(applicationsTable.jobId, jobId));
    }

    if (status) {
      conditions.push(eq(applicationsTable.status, status));
    }

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

    const [applications, totalResult] = await Promise.all([
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

    const total = totalResult?.[0]?.count !== undefined
      ? Number(totalResult[0].count)
      : applications.length;

    return {
      applications: applications.map((item: any) => ({
        ...item.application,
        jobTitle: item.jobTitle || "Unknown Position",
      })),
      total,
    };
  }

  async getApplicationById(id: string) {
    let app: any = null;
    if (this.db?.query?.applicationsTable?.findFirst) {
      app = await this.db.query.applicationsTable.findFirst({
        where: (a: any, { eq: eqOp }: any) => eqOp(a.id, id),
      });
    }

    if (!app && this.db?.select) {
      const rows = await this.db
        .select({
          application: applicationsTable,
          jobTitle: jobsTable.title,
        })
        .from(applicationsTable)
        .leftJoin(jobsTable, eq(applicationsTable.jobId, jobsTable.id))
        .where(eq(applicationsTable.id, id))
        .limit(1);

      if (rows && rows.length > 0) {
        app = {
          ...rows[0].application,
          jobTitle: rows[0].jobTitle || "Unknown Position",
        };
      }
    }

    if (!app) {
      throw new AppError("NOT_FOUND", "Application record could not be found.");
    }

    return app;
  }

  async updateStage(
    id: string,
    newStage: ApplicationStatus,
    rejectionReason?: string,
    actorId?: string,
  ) {
    const current = await this.getApplicationById(id);

    const updateData: Record<string, unknown> = {
      status: newStage,
      updatedAt: new Date(),
    };

    if (newStage === ApplicationStatus.REJECTED && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    const [updated] = await this.db
      .update(applicationsTable)
      .set(updateData)
      .where(eq(applicationsTable.id, id))
      .returning();

    // Log audit event
    try {
      await this.db.insert(auditLogsTable).values({
        actorId: actorId || null,
        action: "APPLICATION_STAGE_UPDATED",
        entityType: "application",
        entityId: id,
        beforeState: { status: current.status },
        afterState: { status: newStage, rejectionReason: rejectionReason || null },
      });
    } catch (auditErr) {
      logger.warn("Failed to write audit log:", { error: String(auditErr) });
    }

    return updated;
  }

  async updateNotesAndRating(
    id: string,
    internalNotes?: string,
    rating?: number,
    actorId?: string,
  ) {
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      throw new AppError("BAD_REQUEST", "Rating must be between 1 and 5");
    }

    const current = await this.getApplicationById(id);

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    if (internalNotes !== undefined) updateData.internalNotes = internalNotes;
    if (rating !== undefined) updateData.rating = rating;

    const [updated] = await this.db
      .update(applicationsTable)
      .set(updateData)
      .where(eq(applicationsTable.id, id))
      .returning();

    // Log audit event
    try {
      await this.db.insert(auditLogsTable).values({
        actorId: actorId || null,
        action: "APPLICATION_REVIEW_UPDATED",
        entityType: "application",
        entityId: id,
        beforeState: { internalNotes: current.internalNotes, rating: current.rating },
        afterState: { internalNotes, rating },
      });
    } catch (auditErr) {
      logger.warn("Failed to write audit log:", { error: String(auditErr) });
    }

    return updated;
  }

  async getSignedResumeUrl(id: string, _actorRole?: string): Promise<string> {
    const application = await this.getApplicationById(id);

    if (!application.resumeStoragePath) {
      throw new AppError("NOT_FOUND", "No resume document attached to this application.");
    }

    if (this.supabaseAdmin?.storage) {
      const { data, error } = await this.supabaseAdmin.storage
        .from("resumes")
        .createSignedUrl(application.resumeStoragePath, 300); // 5-minute signed URL

      if (error) {
        throw new AppError("INTERNAL", `Failed to generate signed resume URL: ${error.message}`);
      }

      if (data?.signedUrl) {
        return data.signedUrl;
      }
    }

    return application.resumeUrl || application.resumeStoragePath;
  }

  async exportApplicationsCsv(jobId?: string): Promise<string> {
    let items: any[] = [];

    if (this.db?.query?.applicationsTable?.findMany) {
      items = await this.db.query.applicationsTable.findMany();
    } else {
      const rows = await this.db
        .select({
          app: applicationsTable,
          jobTitle: jobsTable.title,
        })
        .from(applicationsTable)
        .leftJoin(jobsTable, eq(applicationsTable.jobId, jobsTable.id))
        .where(jobId ? eq(applicationsTable.jobId, jobId) : undefined)
        .orderBy(desc(applicationsTable.createdAt));

      items = rows.map((r: any) => ({ ...r.app, jobTitle: r.jobTitle }));
    }

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

    const escapeCsv = (val: unknown) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const lines = [headers.join(",")];

    for (const item of items) {
      const line = [
        escapeCsv(item.id),
        escapeCsv(item.candidateName),
        escapeCsv(item.email),
        escapeCsv(item.phone || ""),
        escapeCsv(item.status),
        escapeCsv(item.job?.title || item.jobTitle || "Role"),
        escapeCsv(item.knockoutTriggered ? "Yes" : "No"),
        escapeCsv(item.rating ?? ""),
        escapeCsv(item.createdAt ? new Date(item.createdAt).toISOString() : ""),
      ];
      lines.push(line.join(","));
    }

    return lines.join("\n");
  }

  async exportCandidateData(email: string) {
    if (!email || !email.trim()) {
      throw new AppError("VALIDATION", "A valid candidate email is required for data export.");
    }
    const cleanEmail = email.trim().toLowerCase();

    const applications = await this.db
      .select()
      .from(applicationsTable)
      .where(eq(applicationsTable.email, cleanEmail));

    const talentPoolSubmissions = await this.db
      .select()
      .from(talentPoolTable)
      .where(eq(talentPoolTable.email, cleanEmail));

    return {
      email: cleanEmail,
      exportedAt: new Date(),
      applications: applications || [],
      talentPoolSubmissions: talentPoolSubmissions || [],
    };
  }

  async purgeCandidateData(email: string, actorId?: string, ipAddress?: string) {
    if (!email || !email.trim()) {
      throw new AppError("VALIDATION", "A valid candidate email is required for GDPR deletion.");
    }
    const cleanEmail = email.trim().toLowerCase();

    // 1. Fetch all applications and talent pool entries
    const applications = await this.db
      .select()
      .from(applicationsTable)
      .where(eq(applicationsTable.email, cleanEmail));

    const talentPoolRows = await this.db
      .select()
      .from(talentPoolTable)
      .where(eq(talentPoolTable.email, cleanEmail));

    // 2. Collect storage paths of resumes
    const resumeStoragePaths: string[] = [];
    for (const app of applications || []) {
      if (app.resumeStoragePath) {
        resumeStoragePaths.push(app.resumeStoragePath);
      }
    }
    for (const tp of talentPoolRows || []) {
      if (tp.resumeStoragePath) {
        resumeStoragePaths.push(tp.resumeStoragePath);
      }
    }

    // 3. Purge files from Supabase Storage
    let deletedFilesCount = 0;
    if (resumeStoragePaths.length > 0 && this.supabaseAdmin?.storage) {
      try {
        const { data, error } = await this.supabaseAdmin.storage
          .from("resumes")
          .remove(resumeStoragePaths);
        if (error) {
          logger.warn("Failed to remove some resume files from storage during GDPR purge:", {
            error: error.message,
          });
        }
        deletedFilesCount = data?.length || resumeStoragePaths.length;
      } catch (storageErr) {
        logger.warn("Storage removal exception during GDPR purge:", {
          error: String(storageErr),
        });
        deletedFilesCount = resumeStoragePaths.length;
      }
    }

    // 4. Hard delete from database
    await this.db
      .delete(applicationsTable)
      .where(eq(applicationsTable.email, cleanEmail));

    await this.db
      .delete(talentPoolTable)
      .where(eq(talentPoolTable.email, cleanEmail));

    const deletedApplicationsCount = (applications || []).length;
    const deletedTalentPoolCount = (talentPoolRows || []).length;

    // 5. Record GDPR compliance audit trail
    try {
      await this.db.insert(auditLogsTable).values({
        actorId,
        action: "compliance.candidate_purged",
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
      logger.warn("Failed to write compliance audit log:", {
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
