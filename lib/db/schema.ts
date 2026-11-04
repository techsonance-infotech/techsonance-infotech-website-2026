import {
  pgTable,
  uuid,
  text,
  integer,
  jsonb,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { defineRelations } from "drizzle-orm";

// ─── 1. Multi-Site & Tenancy ─────────────────────────────────────────────────
export const tsAdminSites = pgTable("ts_admin_sites", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  domain: text("domain"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── 2. RBAC & Memberships ───────────────────────────────────────────────────
export const tsAdminMemberships = pgTable(
  "ts_admin_memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => tsAdminSites.id, { onDelete: "cascade" }),
    role: text("role").notNull(), // 'owner' | 'admin' | 'editor' | 'author' | 'viewer'
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("ts_admin_memberships_user_site_idx").on(table.userId, table.siteId)]
);

// ─── 3. Blog Authors ─────────────────────────────────────────────────────────
export const tsContentAuthors = pgTable("ts_content_authors", {
  id: uuid("id").primaryKey().defaultRandom(),
  siteId: uuid("site_id")
    .notNull()
    .references(() => tsAdminSites.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  role: text("role"),
  avatar: text("avatar"),
  bio: text("bio"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── 4. Blog Categories ──────────────────────────────────────────────────────
export const tsContentCategories = pgTable(
  "ts_content_categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => tsAdminSites.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("ts_content_categories_site_slug_idx").on(table.siteId, table.slug)]
);

// ─── 5. Blog Posts ───────────────────────────────────────────────────────────
export const tsContentPosts = pgTable(
  "ts_content_posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => tsAdminSites.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    excerpt: text("excerpt"),
    content: text("content").notNull(),
    categoryId: uuid("category_id").references(() => tsContentCategories.id, {
      onDelete: "set null",
    }),
    heroImage: text("hero_image"),
    tags: text("tags").array().notNull().default([]),
    authorIds: uuid("author_ids").array().notNull().default([]),
    readTime: text("read_time"),
    faqs: jsonb("faqs").notNull().default([]),
    seo: jsonb("seo").notNull().default({}),
    status: text("status").notNull().default("DRAFT"), // 'DRAFT' | 'IN_REVIEW' | 'PUBLISHED' | 'ARCHIVED'
    versionId: integer("version_id").notNull().default(1),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdBy: uuid("created_by"),
    updatedBy: uuid("updated_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("ts_content_posts_site_slug_idx").on(table.siteId, table.slug)]
);

// ─── 6. Careers: Jobs ────────────────────────────────────────────────────────
export const tsContentJobs = pgTable(
  "ts_content_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => tsAdminSites.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    department: text("department").notNull(),
    location: text("location").notNull(),
    type: text("type").notNull(), // 'Full Time' | 'Internship' | 'Contract' | 'Partner'
    experienceLevel: text("experience_level"),
    description: text("description").notNull(),
    responsibilities: text("responsibilities").array().notNull().default([]),
    requirements: text("requirements").array().notNull().default([]),
    benefits: text("benefits").array().notNull().default([]),
    closesAt: timestamp("closes_at", { withTimezone: true }),
    status: text("status").notNull().default("DRAFT"), // 'DRAFT' | 'OPEN' | 'CLOSED' | 'ARCHIVED'
    versionId: integer("version_id").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("ts_content_jobs_site_slug_idx").on(table.siteId, table.slug)]
);

// ─── 7. Careers: Applications ────────────────────────────────────────────────
export const tsContentApplications = pgTable("ts_content_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  siteId: uuid("site_id")
    .notNull()
    .references(() => tsAdminSites.id, { onDelete: "cascade" }),
  jobId: uuid("job_id")
    .notNull()
    .references(() => tsContentJobs.id, { onDelete: "cascade" }),
  candidateName: text("candidate_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  portfolioUrl: text("portfolio_url"),
  githubUrl: text("github_url"),
  resumeUrl: text("resume_url"),
  coverLetter: text("cover_letter"),
  status: text("status").notNull().default("NEW"), // 'NEW' | 'REVIEWING' | 'SHORTLISTED' | 'INTERVIEW' | 'OFFERED' | 'REJECTED'
  internalNotes: text("internal_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── 8. Content Versions ─────────────────────────────────────────────────────
export const tsContentVersions = pgTable("ts_content_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityType: text("entity_type").notNull(), // 'post' | 'job'
  entityId: uuid("entity_id").notNull(),
  snapshot: jsonb("snapshot").notNull(),
  changedBy: uuid("changed_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── 9. Content Audit Log ────────────────────────────────────────────────────
export const tsContentAuditLog = pgTable("ts_content_audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: uuid("actor_id"),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  beforeState: jsonb("before_state"),
  afterState: jsonb("after_state"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Drizzle Relations (v1 RC defineRelations) ──────────────────────────────
export const contentRelations = defineRelations(
  {
    tsAdminSites,
    tsAdminMemberships,
    tsContentAuthors,
    tsContentCategories,
    tsContentPosts,
    tsContentJobs,
    tsContentApplications,
  },
  (r) => ({
    tsAdminSites: {
      memberships: r.many.tsAdminMemberships(),
      authors: r.many.tsContentAuthors(),
      categories: r.many.tsContentCategories(),
      posts: r.many.tsContentPosts(),
      jobs: r.many.tsContentJobs(),
      applications: r.many.tsContentApplications(),
    },
    tsAdminMemberships: {
      site: r.one.tsAdminSites({
        from: r.tsAdminMemberships.siteId,
        to: r.tsAdminSites.id,
      }),
    },
    tsContentAuthors: {
      site: r.one.tsAdminSites({
        from: r.tsContentAuthors.siteId,
        to: r.tsAdminSites.id,
      }),
    },
    tsContentCategories: {
      site: r.one.tsAdminSites({
        from: r.tsContentCategories.siteId,
        to: r.tsAdminSites.id,
      }),
      posts: r.many.tsContentPosts(),
    },
    tsContentPosts: {
      site: r.one.tsAdminSites({
        from: r.tsContentPosts.siteId,
        to: r.tsAdminSites.id,
      }),
      category: r.one.tsContentCategories({
        from: r.tsContentPosts.categoryId,
        to: r.tsContentCategories.id,
      }),
    },
    tsContentJobs: {
      site: r.one.tsAdminSites({
        from: r.tsContentJobs.siteId,
        to: r.tsAdminSites.id,
      }),
      applications: r.many.tsContentApplications(),
    },
    tsContentApplications: {
      site: r.one.tsAdminSites({
        from: r.tsContentApplications.siteId,
        to: r.tsAdminSites.id,
      }),
      job: r.one.tsContentJobs({
        from: r.tsContentApplications.jobId,
        to: r.tsContentJobs.id,
      }),
    },
  })
);

// ─── Type Inferences ─────────────────────────────────────────────────────────
export type AdminSite = typeof tsAdminSites.$inferSelect;
export type InsertAdminSite = typeof tsAdminSites.$inferInsert;

export type ContentAuthor = typeof tsContentAuthors.$inferSelect;
export type InsertContentAuthor = typeof tsContentAuthors.$inferInsert;

export type ContentCategory = typeof tsContentCategories.$inferSelect;
export type InsertContentCategory = typeof tsContentCategories.$inferInsert;

export type ContentPost = typeof tsContentPosts.$inferSelect;
export type InsertContentPost = typeof tsContentPosts.$inferInsert;

export type ContentJob = typeof tsContentJobs.$inferSelect;
export type InsertContentJob = typeof tsContentJobs.$inferInsert;

export type ContentApplication = typeof tsContentApplications.$inferSelect;
export type InsertContentApplication = typeof tsContentApplications.$inferInsert;
