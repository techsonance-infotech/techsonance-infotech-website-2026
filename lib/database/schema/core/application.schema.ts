import {
  pgTable,
  text,
  uuid,
  integer,
  timestamp,
  boolean,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { baseEntityFields } from "../base.schema";
import { sitesTable } from "./site.schema";
import { jobsTable } from "./job.schema";
import { ApplicationStatus } from "../../enum/content.enum";
import { ApplicationStatusEnum } from "../enum.schema";

export const applicationsTable = pgTable(
  "ts_content_applications",
  {
    ...baseEntityFields,
    siteId: uuid("site_id")
      .notNull()
      .references(() => sitesTable.id, { onDelete: "cascade" }),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobsTable.id, { onDelete: "cascade" }),
    jobVersionId: integer("job_version_id").notNull().default(1), // Snapshot version applied to
    candidateName: text("candidate_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    currentLocation: text("current_location"),
    portfolioUrl: text("portfolio_url"),
    githubUrl: text("github_url"),
    linkedinUrl: text("linkedin_url"),
    resumeStoragePath: text("resume_storage_path").notNull().default(""), // Private path in Supabase bucket
    resumeFileName: text("resume_file_name").notNull().default(""),
    resumeMimeType: text("resume_mime_type").notNull().default("application/pdf"),
    resumeUrl: text("resume_url"),
    coverLetter: text("cover_letter"),
    noticePeriodWeeks: integer("notice_period_weeks"),

    // Screening Answers & Knockout detection
    screeningAnswers: jsonb("screening_answers").notNull().default([]),
    // [{ questionId: string, question: string, answer: any, isKnockout: boolean }]
    knockoutTriggered: boolean("knockout_triggered").notNull().default(false),

    // Source tracking
    source: text("source").default("direct"), // 'direct' | 'linkedin' | 'referral' | etc.

    // Pipeline & Internal Review
    status: ApplicationStatusEnum("status").notNull().default(ApplicationStatus.NEW),
    rejectionReason: text("rejection_reason"),
    internalNotes: text("internal_notes"),
    rating: integer("rating"), // 1 to 5 stars

    // Compliance & Consent
    privacyConsent: boolean("privacy_consent").notNull().default(true),
    privacyConsentDate: timestamp("privacy_consent_date", { withTimezone: true })
      .notNull()
      .defaultNow(),
    privacyNoticeVersion: text("privacy_notice_version").notNull().default("2026-v1"),
    talentPoolConsent: boolean("talent_pool_consent").notNull().default(false),
  },
  (table) => [
    uniqueIndex("ts_content_app_job_email_uq").on(table.jobId, table.email),
    index("ts_content_app_status_idx").on(table.status),
  ],
);

export type Application = typeof applicationsTable.$inferSelect;
export type InsertApplication = typeof applicationsTable.$inferInsert;
