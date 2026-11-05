import "server-only";
import { inject } from "@needle-di/core";
import { and, desc, eq } from "drizzle-orm";
import { DRIZZLE_DB_TOKEN } from "@/lib/di/tokens";
import type { Database } from "@/lib/database/index";
import {
  promptTemplatesTable,
  sitesTable,
  type PromptTemplate,
  type InsertPromptTemplate,
} from "@/lib/database/schema/index.schema";
import { mapDbError } from "@/lib/dbErrors";

export class AdminPromptsRepository {
  constructor(private db: Database = inject(DRIZZLE_DB_TOKEN)) {}

  async getDefaultSiteId(): Promise<string> {
    try {
      const existing = await this.db.query.sitesTable.findFirst();
      if (existing) return existing.id;

      const [created] = await this.db
        .insert(sitesTable)
        .values({
          name: "TechSonance Infotech LLP",
          slug: "techsonance-infotech-llp",
          domain: "techsonance.co.in",
        })
        .returning();

      return created.id;
    } catch (err) {
      throw mapDbError(err, {
        context: "AdminPromptsRepository.getDefaultSiteId",
      });
    }
  }

  async listActiveTemplates(): Promise<PromptTemplate[]> {
    try {
      return await this.db
        .select()
        .from(promptTemplatesTable)
        .where(eq(promptTemplatesTable.isActive, true))
        .orderBy(desc(promptTemplatesTable.stepName));
    } catch (err) {
      throw mapDbError(err, {
        context: "AdminPromptsRepository.listActiveTemplates",
      });
    }
  }

  async findByStep(stepName: string): Promise<PromptTemplate | null> {
    if (!stepName || !stepName.trim()) return null;

    try {
      const [template] = await this.db
        .select()
        .from(promptTemplatesTable)
        .where(
          and(eq(promptTemplatesTable.stepName, stepName), eq(promptTemplatesTable.isActive, true)),
        )
        .limit(1);

      return template ?? null;
    } catch (err) {
      throw mapDbError(err, {
        context: "AdminPromptsRepository.findByStep",
      });
    }
  }

  async create(data: InsertPromptTemplate): Promise<PromptTemplate> {
    try {
      const [created] = await this.db.insert(promptTemplatesTable).values(data).returning();
      return created;
    } catch (err) {
      throw mapDbError(err, {
        context: "AdminPromptsRepository.create",
      });
    }
  }

  async update(id: string, patch: Partial<InsertPromptTemplate>): Promise<PromptTemplate | null> {
    if (!id || !id.trim()) return null;

    try {
      const [updated] = await this.db
        .update(promptTemplatesTable)
        .set({
          ...patch,
          updatedAt: new Date(),
        })
        .where(eq(promptTemplatesTable.id, id))
        .returning();

      return updated ?? null;
    } catch (err) {
      throw mapDbError(err, {
        context: "AdminPromptsRepository.update",
        id,
      });
    }
  }
}
