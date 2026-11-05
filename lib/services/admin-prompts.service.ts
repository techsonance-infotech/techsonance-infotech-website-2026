import "server-only";
import { inject } from "@needle-di/core";
import { AdminPromptsRepository } from "@/lib/repositories/admin-prompts.repository";
import type { PromptTemplate } from "@/lib/database/schema/index.schema";
import { logger } from "../logger";

export const DEFAULT_PROMPT_TEMPLATES = [
  {
    stepName: "outline",
    modelPreference: "gemini-2.5-flash",
    temperature: 70,
    systemPrompt: `You are a Principal Software Architect and Technical Writer at TechSonance Infotech.
Generate an in-depth, structured outline for an enterprise engineering article.
You MUST output ONLY a valid JSON object matching this schema:
{
  "headings": ["Introduction: ...", "Core Concept 1", "Implementation & Code Walkthrough", "Benchmarking & Performance", "Conclusion & Next Steps"],
  "keyPoints": {
    "Heading Name": ["Point 1", "Point 2", "Point 3"]
  }
}
Do not enclose in markdown code blocks if possible, or use standard \`\`\`json.`,
    userPromptTemplate: `Topic: "{{topic}}"
Category: {{category}}
Target Audience: {{targetAudience}}
Generate 4-6 focused technical headings with actionable key points.`,
  },
  {
    stepName: "section",
    modelPreference: "gemini-2.5-flash",
    temperature: 70,
    systemPrompt: `You are a Senior Staff Engineer writing an authoritative engineering blog for TechSonance Infotech.
Write thorough, highly practical, technically deep content.
Include realistic TypeScript/Next.js/Postgres code snippets where appropriate.
Avoid superficial fluff or cliché introductory phrases. Maintain an authoritative yet accessible voice.`,
    userPromptTemplate: `Article Topic: "{{topic}}"
Current Section: "## {{heading}}"
Key Points to Cover:
{{keyPoints}}

Write the full section markdown now.`,
  },
  {
    stepName: "meta",
    modelPreference: "gemini-2.5-flash",
    temperature: 60,
    systemPrompt: `You are an SEO Strategist & Editor at TechSonance Infotech.
Analyze the article topic and generate production metadata.
Respond ONLY with a valid JSON object:
{
  "title": "Clear, authoritative title (50-60 chars)",
  "slug": "url-friendly-kebab-case-slug",
  "excerpt": "Punchy 150-160 char summary for preview cards",
  "tags": ["Tag1", "Tag2", "Tag3"],
  "readTime": "6 min read",
  "seoTitle": "SEO title with agency branding | TechSonance",
  "seoDescription": "Meta description optimized for click-through and search engines",
  "imagePrompt": "Editorial high-tech 3D banner description for FLUX.1 / Pollinations image generation"
}`,
    userPromptTemplate: `Topic: "{{topic}}"
Category: {{category}}
Summary of Headings: {{headings}}
Generate the metadata JSON.`,
  },
  {
    stepName: "image",
    modelPreference: "flux-schnell",
    temperature: 80,
    systemPrompt: `Expert prompt engineer for FLUX.1-schnell and Pollinations generative models.`,
    userPromptTemplate: `High quality 3D digital render, enterprise tech illustration of {{topic}}, vibrant tech neon blue and emerald lighting, isometric futuristic glass cubes, server nodes, hyperrealistic, octane render, 8k --ar 16:9`,
  },
  {
    stepName: "critic",
    modelPreference: "gemini-2.5-flash",
    temperature: 50,
    systemPrompt: `You are the Executive Editor at TechSonance Infotech reviewing automated content.
Evaluate technical accuracy, code quality, readability, and brand voice.
Score from 1 to 10 and return suggestions.`,
    userPromptTemplate: `Article Title: "{{title}}"
Word Count: {{wordCount}}
Content:
{{content}}

Evaluate quality and output score.`,
  },
];

export class AdminPromptsService {
  constructor(
    private readonly promptsRepo: AdminPromptsRepository = inject(AdminPromptsRepository),
  ) {}

  async listTemplates(): Promise<PromptTemplate[]> {
    const templates = await this.promptsRepo.listActiveTemplates();

    if (templates.length === 0) {
      return this.seedDefaults();
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
    const inserted: PromptTemplate[] = [];

    for (const def of DEFAULT_PROMPT_TEMPLATES) {
      try {
        const row = await this.promptsRepo.create({
          siteId,
          stepName: def.stepName,
          systemPrompt: def.systemPrompt,
          userPromptTemplate: def.userPromptTemplate,
          modelPreference: def.modelPreference,
          temperature: def.temperature,
          isActive: true,
          version: 1,
        });
        inserted.push(row);
      } catch (err) {
        logger.warn(`Could not seed default template for step: ${def.stepName}`, {
          error: String(err),
        });
      }
    }

    return inserted;
  }
}
