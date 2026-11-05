import { eq, and, desc, sql, ilike, or } from "drizzle-orm";
import { getDrizzleDb } from "@/lib/database";
import { applicationsTable, jobsTable, auditLogsTable } from "@/lib/database/schema/index.schema";
import { ApplicationStatus } from "@/lib/database/enum/content.enum";
import { AppError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";

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
    private db = getDrizzleDb(),
    private supabaseAdmin = createAdminClient(),
  ) {}

  async listApplications(options: ListApplicationsOptions = {}) {
    const { jobId, status, knockoutTriggered, search, limit = 50, offset = 0 } = options;

    if ((this.db as any).query?.applicationsTable?.findMany) {
      const items = await (this.db as any).query.applicationsTable.findMany({
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

    const applications = await this.db
      .select({
        application: applicationsTable,
        jobTitle: jobsTable.title,
      })
      .from(applicationsTable)
      .leftJoin(jobsTable, eq(applicationsTable.jobId, jobsTable.id))
      .where(whereClause)
      .orderBy(desc(applicationsTable.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      applications: applications.map((item) => ({
        ...item.application,
        jobTitle: item.jobTitle || "Unknown Position",
      })),
      total: applications.length,
    };
  }

  async getApplicationById(id: string) {
    let app: any = null;
    if ((this.db as any).query?.applicationsTable?.findFirst) {
      app = await (this.db as any).query.applicationsTable.findFirst({
        where: (a: any, { eq }: any) => eq(a.id, id),
      });
    }

    if (!app && this.db.select) {
      const [found] = await this.db
        .select()
        .from(applicationsTable)
        .where(eq(applicationsTable.id, id))
        .limit(1);
      app = found;
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
      console.warn("Failed to write audit log:", auditErr);
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

    await this.getApplicationById(id);

    const updateData: Record<string, unknown> = {};
    if (internalNotes !== undefined) updateData.internalNotes = internalNotes;
    if (rating !== undefined) updateData.rating = rating;

    const [updated] = await this.db
      .update(applicationsTable)
      .set(updateData)
      .where(eq(applicationsTable.id, id))
      .returning();

    return updated;
  }

  async getSignedResumeUrl(id: string) {
    const application = await this.getApplicationById(id);

    if (!application.resumeStoragePath) {
      throw new AppError("NOT_FOUND", "No resume document attached to this application.");
    }

    if (this.supabaseAdmin) {
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

    if ((this.db as any).query?.applicationsTable?.findMany) {
      items = await (this.db as any).query.applicationsTable.findMany();
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

      items = rows.map((r) => ({ ...r.app, jobTitle: r.jobTitle }));
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
}
