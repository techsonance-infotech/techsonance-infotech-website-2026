import { pgTable, text, index, boolean, jsonb } from "drizzle-orm/pg-core";
import { baseEntityFields } from "../base.schema";
import {
  ContactInquiryType,
  ContactInquiryStatus,
} from "../../../constants/contact.constants";

export const contactInquiriesTable = pgTable(
  "ts_web_contact_inquiries",
  {
    ...baseEntityFields,
    type: text("type").notNull().default(ContactInquiryType.CONTACT_PAGE),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    countryCode: text("country_code"),
    company: text("company"),
    service: text("service"),
    interest: text("interest"),
    message: text("message").notNull(),
    ip: text("ip"),
    status: text("status").notNull().default(ContactInquiryStatus.NEW),
    emailDelivered: boolean("email_delivered").notNull().default(false),
    emailError: text("email_error"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  },
  (table) => [
    index("ts_web_contact_inquiries_email_idx").on(table.email),
    index("ts_web_contact_inquiries_created_at_idx").on(table.createdAt),
    index("ts_web_contact_inquiries_status_idx").on(table.status),
  ],
);

export type ContactInquiry = typeof contactInquiriesTable.$inferSelect;
export type InsertContactInquiry = typeof contactInquiriesTable.$inferInsert;
