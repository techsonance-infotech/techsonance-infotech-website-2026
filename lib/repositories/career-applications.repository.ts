import "server-only";
import { inject } from "@needle-di/core";
import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm";
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
import { CAREER_ERRORS } from "@/lib/constants/careers.constants";

export class CareerApplicationsRepository {
  constructor(private db: Database = inject(DRIZZLE_DB_TOKEN)) {}

  /**
   * Returns the first site ID in the DB, or undefined if no site exists.
   */
  async getDefaultSiteId(): Promise<string | undefined> {
    try {
      const found = await this.db.query.sitesTable.findFirst({
        columns: { id: true },
      });
      return found?.id;
    } catch (err) {
      throw mapDbError(err, {
        context: "CareerApplicationsRepository.getDefaultSiteId",
      });
    }
  }

  /**
   * Finds a job by ID or slug using Drizzle RQB v2 object syntax.
   * Returns null when not found.
   */
  async findJobById(jobId: string): Promise<Job | null> {
    if (!jobId || !jobId.trim()) return null;

    try {
      const byId = await this.db.query.jobsTable.findFirst({
        where: { id: jobId },
      });
      if (byId) return byId as Job;

      const bySlug = await this.db.query.jobsTable.findFirst({
        where: { slug: jobId },
      });

      return (bySlug as Job) ?? null;
    } catch (err) {
      throw mapDbError(err, {
        context: "CareerApplicationsRepository.findJobById",
        id: jobId,
      });
    }
  }

  /**
   * Checks for a duplicate application from the same email on the same job.
   * Uses Drizzle RQB v2 object syntax (`where: { jobId, email }`).
   */
  async findExistingApplication(jobId: string, email: string): Promise<Application | null> {
    if (!jobId || !jobId.trim() || !email || !email.trim()) return null;

    const normalizedEmail = email.trim().toLowerCase();

    try {
      const res = await this.db.query.applicationsTable.findFirst({
        where: {
          jobId,
          email: normalizedEmail,
        },
      });

      return (res as Application) ?? null;
    } catch (err) {
      throw mapDbError(err, {
        context: "CareerApplicationsRepository.findExistingApplication",
        id: jobId,
      });
    }
  }

  /**
   * Inserts a new application record.
   * Validates required fields before writing (rule 12 §2.2).
   */
  async insertApplication(data: InsertApplication): Promise<Application> {
    if (!data.jobId || !data.jobId.trim()) {
      throw mapDbError(new Error(CAREER_ERRORS.JOB_ID_REQUIRED), {
        context: "CareerApplicationsRepository.insertApplication",
      });
    }
    if (!data.email || !data.email.trim()) {
      throw mapDbError(new Error(CAREER_ERRORS.EMAIL_REQUIRED), {
        context: "CareerApplicationsRepository.insertApplication",
      });
    }
    if (!data.candidateName || !data.candidateName.trim()) {
      throw mapDbError(new Error(CAREER_ERRORS.CANDIDATE_NAME_REQUIRED), {
        context: "CareerApplicationsRepository.insertApplication",
      });
    }

    try {
      const [created] = await this.db.insert(applicationsTable).values(data).returning();

      if (!created) {
        throw mapDbError(new Error(CAREER_ERRORS.APPLICATION_NOT_FOUND), {
          context: "CareerApplicationsRepository.insertApplication",
        });
      }

      return created;
    } catch (err) {
      throw mapDbError(err, {
        context: "CareerApplicationsRepository.insertApplication",
      });
    }
  }

  /**
   * Inserts a voluntary anonymous EEOC response.
   */
  async insertEEOCResponse(data: InsertEEOCResponse): Promise<EEOCResponse> {
    if (!data.jobId || !data.jobId.trim()) {
      throw mapDbError(new Error(CAREER_ERRORS.JOB_ID_REQUIRED), {
        context: "CareerApplicationsRepository.insertEEOCResponse",
      });
    }

    try {
      const [created] = await this.db.insert(eeocResponsesTable).values(data).returning();

      if (!created) {
        throw mapDbError(new Error(CAREER_ERRORS.FAILED_UPDATE_APPLICATION), {
          context: "CareerApplicationsRepository.insertEEOCResponse",
        });
      }

      return created;
    } catch (err) {
      throw mapDbError(err, {
        context: "CareerApplicationsRepository.insertEEOCResponse",
      });
    }
  }

  /**
   * Inserts a talent-pool candidate record.
   */
  async insertTalentPoolCandidate(data: InsertTalentPoolCandidate): Promise<TalentPoolCandidate> {
    const candidateName =
      data.name || (data as unknown as { candidateName?: string }).candidateName;
    if (!candidateName || !candidateName.trim()) {
      throw mapDbError(new Error(CAREER_ERRORS.FULL_NAME_REQUIRED), {
        context: "CareerApplicationsRepository.insertTalentPoolCandidate",
      });
    }
    if (!data.email || !data.email.trim()) {
      throw mapDbError(new Error(CAREER_ERRORS.TALENT_EMAIL_INVALID), {
        context: "CareerApplicationsRepository.insertTalentPoolCandidate",
      });
    }

    try {
      const [created] = await this.db.insert(talentPoolTable).values(data).returning();

      if (!created) {
        throw mapDbError(new Error(CAREER_ERRORS.TALENT_INSERT_FAILED), {
          context: "CareerApplicationsRepository.insertTalentPoolCandidate",
        });
      }

      return created;
    } catch (err) {
      throw mapDbError(err, {
        context: "CareerApplicationsRepository.insertTalentPoolCandidate",
      });
    }
  }

  /**
   * Increments applyCount on a job row.
   * `where` clause is mandatory (rule 12 §2.6).
   */
  async incrementJobApplyCount(jobId: string): Promise<void> {
    if (!jobId || !jobId.trim()) {
      throw mapDbError(new Error(CAREER_ERRORS.JOB_ID_REQUIRED), {
        context: "CareerApplicationsRepository.incrementJobApplyCount",
      });
    }

    try {
      await this.db
        .update(jobsTable)
        .set({ applyCount: sql`${jobsTable.applyCount} + 1` })
        .where(eq(jobsTable.id, jobId));
    } catch (err) {
      throw mapDbError(err, {
        context: "CareerApplicationsRepository.incrementJobApplyCount",
        id: jobId,
      });
    }
  }
}
