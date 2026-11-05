import {
  pgTable,
  text,
  uuid,
  integer,
  timestamp,
  boolean,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { baseEntityFields } from "../base.schema";
import { sitesTable } from "./site.schema";
import { usersTable } from "./user.schema";
import {
  JobStatus,
  JobType,
  JobWorkMode,
  JobVisaSupport,
  JobExperienceLevel,
  JobSalaryPeriod,
  JobApplicationMethod,
  JobCoverLetterRequirement,
  JobApprovalStatus,
  JobVisibility,
} from "../../enum/content.enum";
import {
  JobStatusEnum,
  JobTypeEnum,
  JobWorkModeEnum,
  JobVisaSupportEnum,
  JobExperienceLevelEnum,
  JobSalaryPeriodEnum,
  JobApplicationMethodEnum,
  JobCoverLetterRequirementEnum,
  JobApprovalStatusEnum,
  JobVisibilityEnum,
} from "../enum.schema";

export const jobsTable = pgTable(
  "ts_content_jobs",
  {
    ...baseEntityFields,
    siteId: uuid("site_id")
      .notNull()
      .references(() => sitesTable.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    referenceCode: text("reference_code"), // e.g. "ENG-2026-04"
    department: text("department").notNull(),
    openingsCount: integer("openings_count").notNull().default(1),
    ownerId: uuid("owner_id").references(() => usersTable.id), // Recruiter responsible
    hiringManagerId: uuid("hiring_manager_id").references(() => usersTable.id), // Read-only reviewer
    summary: text("summary").notNull().default(""), // Short snippet for cards and meta description

    // Work Mode & Strict Single-Location Rule
    workMode: JobWorkModeEnum("work_mode").notNull().default(JobWorkMode.HYBRID),
    location: text("location").notNull(), // e.g. "Bhubaneswar, India" or "Remote"
    remoteEligibility: text("remote_eligibility"), // e.g. "India, APAC, or Worldwide"
    visaSupport: JobVisaSupportEnum("visa_support").default(JobVisaSupport.NO),

    // Engagement & Content
    type: JobTypeEnum("type").notNull().default(JobType.FULL_TIME),
    experienceLevel: JobExperienceLevelEnum("experience_level").default(JobExperienceLevel.MID),
    description: text("description").notNull(), // Rich text / markdown
    responsibilities: text("responsibilities").array().notNull().default([]),
    requirements: text("requirements").array().notNull().default([]),
    preferredQualifications: text("preferred_qualifications").array().notNull().default([]),
    skills: text("skills").array().notNull().default([]),
    benefits: text("benefits").array().notNull().default([]),
    aboutTeam: text("about_team"),
    hiringProcess: jsonb("hiring_process").default([]), // [{ step: "01", title: "...", desc: "..." }]
    equalOpportunityStatement: text("equal_opportunity_statement"),

    // Compensation
    salaryMin: integer("salary_min"),
    salaryMax: integer("salary_max"),
    salaryCurrency: text("salary_currency").default("INR"),
    salaryPeriod: JobSalaryPeriodEnum("salary_period").default(JobSalaryPeriod.YEAR),
    showSalaryPublicly: boolean("show_salary_publicly").notNull().default(false),
    compensationNotes: text("compensation_notes"), // Equity, performance bonus

    // Application Configuration
    applicationMethod: JobApplicationMethodEnum("application_method")
      .notNull()
      .default(JobApplicationMethod.BUILTIN),
    externalApplyUrl: text("external_apply_url"),
    resumeRequired: boolean("resume_required").notNull().default(true),
    coverLetterRequirement: JobCoverLetterRequirementEnum("cover_letter_requirement")
      .notNull()
      .default(JobCoverLetterRequirement.OPTIONAL),
    screeningQuestions: jsonb("screening_questions").notNull().default([]),
    // [{ id: string, question: string, type: 'short_text'|'long_text'|'boolean'|'choice', options?: string[], required: boolean, knockoutAnswer?: string|boolean }]

    // Publishing, Status & Scheduling
    status: JobStatusEnum("status").notNull().default(JobStatus.DRAFT),
    approvalStatus: JobApprovalStatusEnum("approval_status").default(JobApprovalStatus.PENDING),
    approvalComment: text("approval_comment"),
    publishAt: timestamp("publish_at", { withTimezone: true }),
    closesAt: timestamp("closes_at", { withTimezone: true }),
    visibility: JobVisibilityEnum("visibility").notNull().default(JobVisibility.PUBLIC),
    featured: boolean("featured").notNull().default(false),

    // SEO & Social
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    ogImage: text("og_image"),

    // Telemetry & Versioning
    versionId: integer("version_id").notNull().default(1),
    viewCount: integer("view_count").notNull().default(0),
    applyCount: integer("apply_count").notNull().default(0),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("ts_content_jobs_site_slug_idx").on(table.siteId, table.slug),
    index("ts_content_jobs_status_idx").on(table.status),
    index("ts_content_jobs_dept_idx").on(table.department),
  ],
);

export type Job = typeof jobsTable.$inferSelect;
export type InsertJob = typeof jobsTable.$inferInsert;
