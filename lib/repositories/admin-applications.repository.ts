import "server-only";
import { inject } from "@needle-di/core";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { DRIZZLE_DB_TOKEN } from "@/lib/di/tokens";
import type { Database } from "@/lib/database/index";
import { withTransaction } from "@/lib/database/transaction";
import {
  applicationsTable,
  jobsTable,
  auditLogsTable,
  talentPoolTable,
  type Application,
  type InsertAuditLog,
} from "@/lib/database/schema/index.schema";
import type { ApplicationStatus } from "@/lib/database/enum/content.enum";
import { mapDbError } from "@/lib/dbErrors";
import { DEFAULT_APPLICATIONS_PAGE_SIZE } from "@/lib/constants/careers.constants";

export interface ListAdminApplicationsOptions {
  jobId?: string;
  status?: ApplicationStatus;
  knockoutTriggered?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface AdminApplicationWithJobTitleRow {
  application: Application;
  jobTitle: string | null;
}

export interface ListAdminApplicationsResult {
  applications: AdminApplicationWithJobTitleRow[];
  total: number;
}

export class AdminApplicationsRepository {
  constructor(private db: Database = inject(DRIZZLE_DB_TOKEN)) {}

  /**
   * Lists applications with optional filters joined with job title.
   * Returns row types directly per rule 12 §2.7.
   */
  async listApplications(
    options: ListAdminApplicationsOptions = {},
  ): Promise<ListAdminApplicationsResult> {
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
        this.db.select({ count: count() }).from(applicationsTable).where(whereClause),
      ]);

      const countVal = totalResult[0]?.count;
      const total = countVal !== undefined ? Number(countVal) : rows.length;

      return {
        applications: rows,
        total,
      };
    } catch (err) {
      throw mapDbError(err, {
        context: "AdminApplicationsRepository.listApplications",
      });
    }
  }

  /**
   * Finds a single application by ID joined with job title.
   * Returns row type or null.
   */
  async findApplicationById(id: string): Promise<AdminApplicationWithJobTitleRow | null> {
    if (!id || !id.trim()) return null;

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

      return rows[0] ?? null;
    } catch (err) {
      throw mapDbError(err, {
        context: "AdminApplicationsRepository.findApplicationById",
        id,
      });
    }
  }

  /**
   * Updates application stage and records audit trail in an atomic transaction.
   */
  async updateStageWithAudit(
    id: string,
    updateData: Partial<Application>,
    auditData?: InsertAuditLog,
  ): Promise<Application | null> {
    try {
      return await withTransaction(
        async (tx) => {
          const [updated] = await tx
            .update(applicationsTable)
            .set(updateData)
            .where(eq(applicationsTable.id, id))
            .returning();

          if (!updated) return null;

          if (auditData) {
            await tx.insert(auditLogsTable).values(auditData);
          }

          return updated;
        },
        { database: this.db },
      );
    } catch (err) {
      throw mapDbError(err, {
        context: "AdminApplicationsRepository.updateStageWithAudit",
        id,
      });
    }
  }

  /**
   * Updates application review fields (notes, rating) and records audit trail.
   */
  async updateReviewWithAudit(
    id: string,
    updateData: Partial<Application>,
    auditData?: InsertAuditLog,
  ): Promise<Application | null> {
    try {
      return await withTransaction(
        async (tx) => {
          const [updated] = await tx
            .update(applicationsTable)
            .set(updateData)
            .where(eq(applicationsTable.id, id))
            .returning();

          if (!updated) return null;

          if (auditData) {
            await tx.insert(auditLogsTable).values(auditData);
          }

          return updated;
        },
        { database: this.db },
      );
    } catch (err) {
      throw mapDbError(err, {
        context: "AdminApplicationsRepository.updateReviewWithAudit",
        id,
      });
    }
  }

  /**
   * Fetches all applications for CSV export.
   */
  async listAllForExport(jobId?: string): Promise<AdminApplicationWithJobTitleRow[]> {
    try {
      return await this.db
        .select({
          application: applicationsTable,
          jobTitle: jobsTable.title,
        })
        .from(applicationsTable)
        .leftJoin(jobsTable, eq(applicationsTable.jobId, jobsTable.id))
        .where(jobId ? eq(applicationsTable.jobId, jobId) : undefined)
        .orderBy(desc(applicationsTable.createdAt));
    } catch (err) {
      throw mapDbError(err, {
        context: "AdminApplicationsRepository.listAllForExport",
      });
    }
  }

  /**
   * Retrieves all applications and talent pool records for an email (GDPR data export).
   */
  async findCandidateRecords(email: string) {
    try {
      const [applications, talentPool] = await Promise.all([
        this.db.select().from(applicationsTable).where(eq(applicationsTable.email, email)),
        this.db.select().from(talentPoolTable).where(eq(talentPoolTable.email, email)),
      ]);

      return { applications, talentPool };
    } catch (err) {
      throw mapDbError(err, {
        context: "AdminApplicationsRepository.findCandidateRecords",
      });
    }
  }

  /**
   * Deletes all applications and talent pool records for an email and records audit log (GDPR erasure).
   */
  async purgeCandidateRecords(
    email: string,
    auditData?: InsertAuditLog,
  ): Promise<{ deletedApplicationsCount: number; deletedTalentPoolCount: number }> {
    try {
      return await withTransaction(
        async (tx) => {
          const [deletedApps, deletedTalent] = await Promise.all([
            tx.delete(applicationsTable).where(eq(applicationsTable.email, email)).returning(),
            tx.delete(talentPoolTable).where(eq(talentPoolTable.email, email)).returning(),
          ]);

          if (auditData) {
            await tx.insert(auditLogsTable).values(auditData);
          }

          return {
            deletedApplicationsCount: deletedApps.length,
            deletedTalentPoolCount: deletedTalent.length,
          };
        },
        { database: this.db },
      );
    } catch (err) {
      throw mapDbError(err, {
        context: "AdminApplicationsRepository.purgeCandidateRecords",
      });
    }
  }
}
