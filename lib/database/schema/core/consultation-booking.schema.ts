import { pgTable, text, index, unique, jsonb } from "drizzle-orm/pg-core";
import { baseEntityFields } from "../base.schema";

export const consultationBookingsTable = pgTable(
  "ts_web_consultation_bookings",
  {
    ...baseEntityFields,
    reference: text("reference").notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    company: text("company"),
    projectType: text("project_type").notNull(),
    budgetRange: text("budget_range").notNull(),
    timeline: text("timeline").notNull(),
    slotIso: text("slot_iso").notNull(),
    visitorTimezone: text("visitor_timezone").notNull().default("Asia/Kolkata"),
    message: text("message"),
    status: text("status").notNull().default("CONFIRMED"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  },
  (table) => [
    unique("ts_web_consultation_bookings_slot_uq").on(table.slotIso),
    unique("ts_web_consultation_bookings_reference_uq").on(table.reference),
    index("ts_web_consultation_bookings_email_idx").on(table.email),
    index("ts_web_consultation_bookings_created_at_idx").on(table.createdAt),
  ],
);

export type ConsultationBooking = typeof consultationBookingsTable.$inferSelect;
export type InsertConsultationBooking = typeof consultationBookingsTable.$inferInsert;
