import {
  pgTable,
  text,
  uuid,
  integer,
  boolean,
  jsonb,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { baseEntityFields } from "../base.schema";
import { sitesTable } from "./site.schema";
import { categoriesTable } from "./category.schema";

export const postsTable = pgTable(
  "ts_content_posts",
  {
    ...baseEntityFields,
    siteId: uuid("site_id")
      .notNull()
      .references(() => sitesTable.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    excerpt: text("excerpt"),
    content: text("content").notNull(),
    categoryId: uuid("category_id").references(() => categoriesTable.id, {
      onDelete: "set null",
    }),
    heroImage: text("hero_image"),
    thumbnailMissing: boolean("thumbnail_missing").notNull().default(false),
    thumbnailProvider: text("thumbnail_provider"),
    thumbnailPrompt: text("thumbnail_prompt"),
    thumbnailAlt: text("thumbnail_alt"),
    aiGenerated: boolean("ai_generated").notNull().default(false),
    aiJobId: uuid("ai_job_id"),
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
  },
  (table) => [uniqueIndex("ts_content_posts_site_slug_idx").on(table.siteId, table.slug)],
);

export type Post = typeof postsTable.$inferSelect;
export type InsertPost = typeof postsTable.$inferInsert;
