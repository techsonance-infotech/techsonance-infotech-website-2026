import { pgTable, text, uuid, timestamp, index } from "drizzle-orm/pg-core";
import { baseEntityFields } from "../base.schema";
import { sitesTable } from "./site.schema";
import { JobExperienceLevel } from "../../enum/content.enum";
import { JobExperienceLevelEnum } from "../enum.schema";

export const talentPoolTable = pgTable(
  "ts_content_talent_pool",
  {
    ...baseEntityFields,
    siteId: uuid("site_id")
      .notNull()
      .references(() => sitesTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    skills: text("skills").array().notNull().default([]),
    preferredRole: text("preferred_role"),
    experienceLevel: JobExperienceLevelEnum("experience_level").default(JobExperienceLevel.MID),
    portfolioUrl: text("portfolio_url"),
    resumeStoragePath: text("resume_storage_path"),
    notes: text("notes"),
    consentDate: timestamp("consent_date", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("ts_content_talent_pool_email_idx").on(table.email),
    index("ts_content_talent_pool_site_idx").on(table.siteId),
  ],
);

export type TalentPoolCandidate = typeof talentPoolTable.$inferSelect;
export type InsertTalentPoolCandidate = typeof talentPoolTable.$inferInsert;
