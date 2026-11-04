import {
  pgTable,
  text,
  uuid,
  integer,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { baseEntityFields } from '../base.schema';
import { sitesTable } from './site.schema';

export const jobsTable = pgTable(
  'ts_content_jobs',
  {
    ...baseEntityFields,
    siteId: uuid('site_id')
      .notNull()
      .references(() => sitesTable.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    department: text('department').notNull(),
    location: text('location').notNull(),
    type: text('type').notNull(), // 'Full Time' | 'Internship' | 'Contract' | 'Partner'
    experienceLevel: text('experience_level'),
    description: text('description').notNull(),
    responsibilities: text('responsibilities').array().notNull().default([]),
    requirements: text('requirements').array().notNull().default([]),
    benefits: text('benefits').array().notNull().default([]),
    closesAt: timestamp('closes_at', { withTimezone: true }),
    status: text('status').notNull().default('DRAFT'), // 'DRAFT' | 'OPEN' | 'CLOSED' | 'ARCHIVED'
    versionId: integer('version_id').notNull().default(1),
  },
  (table) => [uniqueIndex('ts_content_jobs_site_slug_idx').on(table.siteId, table.slug)]
);

export type Job = typeof jobsTable.$inferSelect;
export type InsertJob = typeof jobsTable.$inferInsert;
