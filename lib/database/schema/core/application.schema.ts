import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { baseEntityFields } from "../base.schema";
import { sitesTable } from "./site.schema";
import { jobsTable } from "./job.schema";

export const applicationsTable = pgTable("ts_content_applications", {
  ...baseEntityFields,
  siteId: uuid("site_id")
    .notNull()
    .references(() => sitesTable.id, { onDelete: "cascade" }),
  jobId: uuid("job_id")
    .notNull()
    .references(() => jobsTable.id, { onDelete: "cascade" }),
  candidateName: text("candidate_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  portfolioUrl: text("portfolio_url"),
  githubUrl: text("github_url"),
  resumeUrl: text("resume_url"),
  coverLetter: text("cover_letter"),
  status: text("status").notNull().default("NEW"), // 'NEW' | 'REVIEWING' | 'SHORTLISTED' | 'INTERVIEW' | 'OFFERED' | 'REJECTED'
  internalNotes: text("internal_notes"),
});

export type Application = typeof applicationsTable.$inferSelect;
export type InsertApplication = typeof applicationsTable.$inferInsert;
