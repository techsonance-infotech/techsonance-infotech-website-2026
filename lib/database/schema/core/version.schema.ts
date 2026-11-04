import { pgTable, text, uuid, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const versionsTable = pgTable('ts_content_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityType: text('entity_type').notNull(), // 'post' | 'job'
  entityId: uuid('entity_id').notNull(),
  snapshot: jsonb('snapshot').notNull(),
  changedBy: uuid('changed_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type ContentVersion = typeof versionsTable.$inferSelect;
export type InsertContentVersion = typeof versionsTable.$inferInsert;
