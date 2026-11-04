import { pgTable, text, uuid, uniqueIndex } from "drizzle-orm/pg-core";
import { baseEntityFields } from "../base.schema";
import { sitesTable } from "./site.schema";

export const categoriesTable = pgTable(
  "ts_content_categories",
  {
    ...baseEntityFields,
    siteId: uuid("site_id")
      .notNull()
      .references(() => sitesTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
  },
  (table) => [uniqueIndex("ts_content_categories_site_slug_idx").on(table.siteId, table.slug)],
);

export type Category = typeof categoriesTable.$inferSelect;
export type InsertCategory = typeof categoriesTable.$inferInsert;
