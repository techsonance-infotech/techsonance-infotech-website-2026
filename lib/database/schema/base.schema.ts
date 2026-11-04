import { sql } from "drizzle-orm";
import { timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Standard createdAt timestamp column
 */
export const baseCreatedAt = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
};

/**
 * Standard updatedAt timestamp column with auto-update
 */
export const baseUpdatedAt = {
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull()
    .$onUpdate(() => new Date()),
};

/**
 * Standard timestamps (createdAt + updatedAt)
 */
export const baseTimestamps = {
  ...baseCreatedAt,
  ...baseUpdatedAt,
};

/**
 * Soft-deletion timestamp column
 */
export const baseSoftDelete = {
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
};

/**
 * Full audit fields (UUID id + createdAt + updatedAt + deletedAt)
 */
export const baseAuditFields = {
  id: uuid("id").primaryKey().defaultRandom(),
  ...baseTimestamps,
  ...baseSoftDelete,
};

/**
 * Common fields for UUID-keyed entities with createdAt + updatedAt (no soft delete)
 */
export const baseEntityFields = {
  id: uuid("id").primaryKey().defaultRandom(),
  ...baseTimestamps,
};
