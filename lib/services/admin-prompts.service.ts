import "server-only";
import { inject } from "@needle-di/core";
import { AdminPromptsRepository } from "@/lib/repositories/admin-prompts.repository";
import type { PromptTemplate } from "@/lib/database/schema/index.schema";
import { logger } from "../logger";
import { DEFAULT_PROMPT_TEMPLATES, type DefaultPromptTemplate } from "@/lib/constants/ai.constants";

export { DEFAULT_PROMPT_TEMPLATES, type DefaultPromptTemplate };

export class AdminPromptsService {
  constructor(
    private readonly promptsRepo: AdminPromptsRepository = inject(AdminPromptsRepository),
  ) {}

  async listTemplates(): Promise<PromptTemplate[]> {
    const templates = await this.promptsRepo.listActiveTemplates();

    if (templates.length === 0) {
      return this.seedDefaults();
    }

    // Ensure all default pipeline steps exist in the database
    const existingSteps = new Set(templates.map((t) => t.stepName));
    const missingDefaults = DEFAULT_PROMPT_TEMPLATES.filter(
      (def) => !existingSteps.has(def.stepName),
    );

    if (missingDefaults.length > 0) {
      const siteId = await this.promptsRepo.getDefaultSiteId();
      for (const def of missingDefaults) {
        try {
          const created = await this.promptsRepo.create({
            siteId,
            stepName: def.stepName,
            systemPrompt: def.systemPrompt,
            userPromptTemplate: def.userPromptTemplate,
            modelPreference: def.modelPreference,
            temperature: def.temperature,
            isActive: true,
            version: 1,
          });
          templates.push(created);
        } catch (err) {
          logger.warn(`Could not seed missing template for step: ${def.stepName}`, {
            error: err,
          });
        }
      }
    }

    return templates;
  }

  async getTemplateByStep(stepName: string): Promise<PromptTemplate | null> {
    const template = await this.promptsRepo.findByStep(stepName);

    if (!template) {
      const def = DEFAULT_PROMPT_TEMPLATES.find((d) => d.stepName === stepName);
      if (def) {
        const siteId = await this.promptsRepo.getDefaultSiteId();
        return this.promptsRepo.create({
          siteId,
          stepName: def.stepName,
          systemPrompt: def.systemPrompt,
          userPromptTemplate: def.userPromptTemplate,
          modelPreference: def.modelPreference,
          temperature: def.temperature,
          isActive: true,
          version: 1,
        });
      }
    }

    return template ?? null;
  }

  async updateTemplate(
    id: string,
    data: {
      systemPrompt?: string;
      userPromptTemplate?: string;
      modelPreference?: string;
      temperature?: number;
    },
  ): Promise<PromptTemplate | null> {
    return this.promptsRepo.update(id, data);
  }

  async seedDefaults(): Promise<PromptTemplate[]> {
    const siteId = await this.promptsRepo.getDefaultSiteId();
    const results = await Promise.allSettled(
      DEFAULT_PROMPT_TEMPLATES.map((def) =>
        this.promptsRepo.create({
          siteId,
          stepName: def.stepName,
          systemPrompt: def.systemPrompt,
          userPromptTemplate: def.userPromptTemplate,
          modelPreference: def.modelPreference,
          temperature: def.temperature,
          isActive: true,
          version: 1,
        }),
      ),
    );

    const inserted: PromptTemplate[] = [];
    results.forEach((res, idx) => {
      if (res.status === "fulfilled") {
        inserted.push(res.value);
      } else {
        logger.warn(
          `Could not seed default template for step: ${DEFAULT_PROMPT_TEMPLATES[idx]?.stepName}`,
          { error: String(res.reason) },
        );
      }
    });

    return inserted;
  }
}
