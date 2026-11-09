import { pgTable, text, numeric, uuid } from "drizzle-orm/pg-core";
import { baseEntityFields } from "../base.schema";
import { AiAccountBillingModeEnum } from "../enum.schema";
import { AiAccountBillingMode } from "../../enum/ai.enum";

export { AiAccountBillingMode };

export const accountsTable = pgTable("ts_ai_accounts", {
  ...baseEntityFields,
  provider: text("provider").notNull(),
  accountEmail: text("account_email").notNull(),
  displayName: text("display_name").notNull(),
  billingMode: AiAccountBillingModeEnum("billing_mode")
    .notNull()
    .default(AiAccountBillingMode.PREPAID),
  monthlyBudgetUsd: numeric("monthly_budget_usd", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdBy: uuid("created_by"),
});

export type AiAccount = typeof accountsTable.$inferSelect;
export type InsertAiAccount = typeof accountsTable.$inferInsert;
