import "server-only";
import { inject } from "@needle-di/core";
import { desc, eq } from "drizzle-orm";
import { DRIZZLE_DB_TOKEN } from "@/lib/di/tokens";
import type { Database } from "@/lib/database/index";
import {
  generationJobsTable,
  jobStepsTable,
  sitesTable,
  type GenerationJob,
  type InsertGenerationJob,
  type JobStep,
  type InsertJobStep,
} from "@/lib/database/schema/index.schema";
import { mapDbError } from "@/lib/dbErrors";

export class GenerationJobsRepository {
  constructor(private db: Database = inject(DRIZZLE_DB_TOKEN)) {}

  /**
   * Lists recent AI generation jobs.
   */
  async listRecent(limit: number = 30): Promise<GenerationJob[]> {
    try {
      return await this.db
        .select()
        .from(generationJobsTable)
        .orderBy(desc(generationJobsTable.createdAt))
        .limit(limit);
    } catch (err) {
      throw mapDbError(err, {
        context: "GenerationJobsRepository.listRecent",
      });
    }
  }

  /**
   * Finds a generation job by ID.
   */
  async findById(id: string): Promise<GenerationJob | null> {
    if (!id || !id.trim()) return null;

    try {
      const [job] = await this.db
        .select()
        .from(generationJobsTable)
        .where(eq(generationJobsTable.id, id))
        .limit(1);

      return job ?? null;
    } catch (err) {
      throw mapDbError(err, {
        context: "GenerationJobsRepository.findById",
        id,
      });
    }
  }

  /**
   * Inserts a new generation job record.
   */
  async create(data: InsertGenerationJob): Promise<GenerationJob> {
    try {
      const [created] = await this.db.insert(generationJobsTable).values(data).returning();

      return created;
    } catch (err) {
      throw mapDbError(err, {
        context: "GenerationJobsRepository.create",
      });
    }
  }

  /**
   * Updates an existing generation job.
   * Mandatory where clause (rule 12 §2.6).
   */
  async update(id: string, patch: Partial<InsertGenerationJob>): Promise<GenerationJob | null> {
    if (!id || !id.trim()) return null;

    try {
      const [updated] = await this.db
        .update(generationJobsTable)
        .set({
          ...patch,
          updatedAt: new Date(),
        })
        .where(eq(generationJobsTable.id, id))
        .returning();

      return updated ?? null;
    } catch (err) {
      throw mapDbError(err, {
        context: "GenerationJobsRepository.update",
        id,
      });
    }
  }

  /**
   * Records a new job execution step.
   */
  async createStep(data: InsertJobStep): Promise<JobStep> {
    try {
      const [step] = await this.db.insert(jobStepsTable).values(data).returning();
      return step;
    } catch (err) {
      throw mapDbError(err, {
        context: "GenerationJobsRepository.createStep",
      });
    }
  }

  /**
   * Finds a cached job step by its idempotent step key.
   */
  async findStepByKey(stepKey: string): Promise<JobStep | null> {
    if (!stepKey || !stepKey.trim()) return null;

    try {
      const [step] = await this.db
        .select()
        .from(jobStepsTable)
        .where(eq(jobStepsTable.stepName, stepKey))
        .limit(1);

      return step ?? null;
    } catch (err) {
      throw mapDbError(err, {
        context: "GenerationJobsRepository.findStepByKey",
      });
    }
  }

  /**
   * Updates an existing job step.
   */
  async updateStep(id: string, patch: Partial<InsertJobStep>): Promise<void> {
    if (!id || !id.trim()) return;

    try {
      await this.db.update(jobStepsTable).set(patch).where(eq(jobStepsTable.id, id));
    } catch (err) {
      throw mapDbError(err, {
        context: "GenerationJobsRepository.updateStep",
        id,
      });
    }
  }

  /**
   * Finds a cached job step by its unique idempotency key.
   */
  async findStepByIdempotencyKey(idempotencyKey: string): Promise<JobStep | null> {
    if (!idempotencyKey || !idempotencyKey.trim()) return null;

    try {
      const [step] = await this.db
        .select()
        .from(jobStepsTable)
        .where(eq(jobStepsTable.idempotencyKey, idempotencyKey))
        .limit(1);

      return step ?? null;
    } catch (err) {
      throw mapDbError(err, {
        context: "GenerationJobsRepository.findStepByIdempotencyKey",
        id: idempotencyKey,
      });
    }
  }

  /**
   * Upserts a job step output with an idempotency key conflict target.
   */
  async upsertStep(
    jobId: string,
    stepName: string,
    idempotencyKey: string,
    outputData: unknown,
  ): Promise<void> {
    try {
      await this.db
        .insert(jobStepsTable)
        .values({
          jobId,
          stepName,
          idempotencyKey,
          status: "DONE",
          outputData: outputData as Record<string, unknown>,
        })
        .onConflictDoUpdate({
          target: jobStepsTable.idempotencyKey,
          set: {
            status: "DONE",
            outputData: outputData as Record<string, unknown>,
            updatedAt: new Date(),
          },
        });
    } catch (err) {
      throw mapDbError(err, {
        context: "GenerationJobsRepository.upsertStep",
        id: idempotencyKey,
      });
    }
  }

  /**
   * Resolves or provisions the default site ID.
   */
  async getOrCreateSiteId(requestedSiteId?: string): Promise<string> {
    if (requestedSiteId) return requestedSiteId;

    try {
      const existingSite = await this.db.query.sitesTable.findFirst();
      if (existingSite) return existingSite.id;

      const [newSite] = await this.db
        .insert(sitesTable)
        .values({
          name: "TechSonance Infotech LLP",
          slug: "techsonance-infotech-llp",
          domain: "techsonance.co.in",
        })
        .returning();

      return newSite.id;
    } catch (err) {
      throw mapDbError(err, {
        context: "GenerationJobsRepository.getOrCreateSiteId",
      });
    }
  }
}
