import { pgTable, text, uuid, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const auditLogsTable = pgTable('ts_content_audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  actorId: uuid('actor_id'),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: uuid('entity_id').notNull(),
  beforeState: jsonb('before_state'),
  afterState: jsonb('after_state'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type ContentAuditLog = typeof auditLogsTable.$inferSelect;
export type InsertContentAuditLog = typeof auditLogsTable.$inferInsert;
