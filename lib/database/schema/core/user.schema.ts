import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { baseEntityFields } from "../base.schema";

export const usersTable = pgTable("ts_admin_users", {
  ...baseEntityFields,
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("admin"), // 'owner' | 'admin' | 'editor' | 'author' | 'viewer'
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
});

export type AdminUser = typeof usersTable.$inferSelect;
export type InsertAdminUser = typeof usersTable.$inferInsert;
