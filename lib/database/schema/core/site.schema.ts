import { pgTable, text, uuid, uniqueIndex } from 'drizzle-orm/pg-core';
import { baseEntityFields } from '../base.schema';

export const sitesTable = pgTable('ts_admin_sites', {
  ...baseEntityFields,
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  domain: text('domain'),
});

export const membershipsTable = pgTable(
  'ts_admin_memberships',
  {
    ...baseEntityFields,
    userId: uuid('user_id').notNull(),
    siteId: uuid('site_id')
      .notNull()
      .references(() => sitesTable.id, { onDelete: 'cascade' }),
    role: text('role').notNull(), // 'owner' | 'admin' | 'editor' | 'author' | 'viewer'
  },
  (table) => [uniqueIndex('ts_admin_memberships_user_site_idx').on(table.userId, table.siteId)]
);

export type Site = typeof sitesTable.$inferSelect;
export type InsertSite = typeof sitesTable.$inferInsert;

export type Membership = typeof membershipsTable.$inferSelect;
export type InsertMembership = typeof membershipsTable.$inferInsert;
