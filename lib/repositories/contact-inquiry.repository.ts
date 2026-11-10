import "server-only";
import { inject } from "@needle-di/core";
import { desc, eq } from "drizzle-orm";
import { DRIZZLE_DB_TOKEN } from "@/lib/di/tokens";
import type { Database } from "@/lib/database/index";
import {
  contactInquiriesTable,
  type ContactInquiry,
  type InsertContactInquiry,
} from "@/lib/database/schema/index.schema";
import { mapDbError } from "@/lib/dbErrors";

export class ContactInquiryRepository {
  constructor(private db: Database = inject(DRIZZLE_DB_TOKEN)) {}

  /**
   * Persists a new contact inquiry or scoping request.
   */
  async createInquiry(data: InsertContactInquiry): Promise<ContactInquiry> {
    try {
      const [record] = await this.db
        .insert(contactInquiriesTable)
        .values(data)
        .returning();

      return record;
    } catch (err) {
      throw mapDbError(err, { context: "ContactInquiryRepository.createInquiry" });
    }
  }

  /**
   * Updates delivery status of the email notification for this inquiry.
   */
  async updateDeliveryStatus(id: string, delivered: boolean, error?: string): Promise<void> {
    try {
      await this.db
        .update(contactInquiriesTable)
        .set({
          emailDelivered: delivered,
          ...(error ? { emailError: error } : {}),
        })
        .where(eq(contactInquiriesTable.id, id));
    } catch (err) {
      throw mapDbError(err, { context: "ContactInquiryRepository.updateDeliveryStatus", id });
    }
  }

  /**
   * Lists latest inquiries for the admin dashboard.
   */
  async listInquiries(limit: number = 50): Promise<ContactInquiry[]> {
    try {
      return await this.db
        .select()
        .from(contactInquiriesTable)
        .orderBy(desc(contactInquiriesTable.createdAt))
        .limit(limit);
    } catch (err) {
      throw mapDbError(err, { context: "ContactInquiryRepository.listInquiries" });
    }
  }
}
