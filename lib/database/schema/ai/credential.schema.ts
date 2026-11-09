import {
  pgTable,
  text,
  uuid,
  integer,
  numeric,
  boolean,
  timestamp,
  customType,
} from "drizzle-orm/pg-core";
import { baseEntityFields } from "../base.schema";
import { AiCredentialStatusEnum } from "../enum.schema";
import { AiCredentialStatus } from "../../enum/ai.enum";
import { accountsTable } from "./account.schema";

export { AiCredentialStatus };

export const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
  toDriver(val: Buffer): Buffer {
    return val;
  },
  fromDriver(val: unknown): Buffer {
    if (Buffer.isBuffer(val)) return val;
    if (typeof val === "string") {
      return val.startsWith("\\x")
        ? Buffer.from(val.slice(2), "hex")
        : Buffer.from(val, "hex");
    }
    return Buffer.from((val as ArrayBuffer) || "");
  },
});

export const credentialsTable = pgTable("ts_ai_credentials", {
  ...baseEntityFields,
  accountId: uuid("account_id").references(() => accountsTable.id, {
    onDelete: "set null",
  }),
  provider: text("provider").notNull(),
  label: text("label").notNull(),
  ciphertext: bytea("ciphertext"),
  iv: bytea("iv"),
  authTag: bytea("auth_tag"),
  keyVersion: integer("key_version").notNull().default(1),
  fingerprint: text("fingerprint").notNull().unique(),
  last4: text("last4").notNull(),
  status: AiCredentialStatusEnum("status")
    .notNull()
    .default(AiCredentialStatus.ACTIVE),
  priority: integer("priority").notNull().default(100),
  cooldownUntil: timestamp("cooldown_until", { withTimezone: true }),
  quotaResetsAt: timestamp("quota_resets_at", { withTimezone: true }),
  dailyBudgetUsd: numeric("daily_budget_usd", { precision: 10, scale: 2 }),
  spentTodayUsd: numeric("spent_today_usd", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  consecutiveFailures: integer("consecutive_failures").notNull().default(0),
  lastErrorKind: text("last_error_kind"),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  isCanary: boolean("is_canary").notNull().default(false),
  rotatedAt: timestamp("rotated_at", { withTimezone: true }),
  createdBy: uuid("created_by"),
});

export type AiCredential = typeof credentialsTable.$inferSelect;
export type InsertAiCredential = typeof credentialsTable.$inferInsert;
