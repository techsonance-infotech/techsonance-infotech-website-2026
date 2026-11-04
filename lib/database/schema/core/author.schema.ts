import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { baseEntityFields } from "../base.schema";
import { sitesTable } from "./site.schema";

export const authorsTable = pgTable("ts_content_authors", {
  ...baseEntityFields,
  siteId: uuid("site_id")
    .notNull()
    .references(() => sitesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  role: text("role"),
  avatar: text("avatar"),
  bio: text("bio"),
});

export type Author = typeof authorsTable.$inferSelect;
export type InsertAuthor = typeof authorsTable.$inferInsert;
