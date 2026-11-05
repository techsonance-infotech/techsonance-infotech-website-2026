import "server-only";
import { inject } from "@needle-di/core";
import { eq, desc, and } from "drizzle-orm";
import { DRIZZLE_DB_TOKEN } from "@/lib/di/tokens";
import type { Database } from "@/lib/database";
import {
  promptTemplatesTable,
  sitesTable,
  type PromptTemplate,
} from "@/lib/database/schema/index.schema";
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
  constructor(private readonly db: Database = inject(DRIZZLE_DB_TOKEN)) {}

  private async getDefaultSiteId(): Promise<string> {
    const existing = await this.db.query.sitesTable.findFirst();
    if (existing) return existing.id;

    const [created] = await this.db
      .insert(sitesTable)
      .values({
        name: "TechSonance Agency",
        slug: "techsonance-agency",
        domain: "techsonance.co.in",
      })
      .returning();

    return created.id;
  }

  async listTemplates(): Promise<PromptTemplate[]> {
    const templates = await this.db
      .select()
      .from(promptTemplatesTable)
      .where(eq(promptTemplatesTable.isActive, true))
      .orderBy(desc(promptTemplatesTable.stepName));

    if (templates.length === 0) {
      return this.seedDefaults();
    }

    return templates;
  }

  async getTemplateByStep(stepName: string): Promise<PromptTemplate | null> {
    const [template] = await this.db
      .select()
      .from(promptTemplatesTable)
      .where(
        and(eq(promptTemplatesTable.stepName, stepName), eq(promptTemplatesTable.isActive, true)),
      )
      .limit(1);

    if (!template) {
      // Look up default
      const def = DEFAULT_PROMPT_TEMPLATES.find((d) => d.stepName === stepName);
      if (def) {
        const siteId = await this.getDefaultSiteId();
        const [inserted] = await this.db
          .insert(promptTemplatesTable)
          .values({
            siteId,
            stepName: def.stepName,
            systemPrompt: def.systemPrompt,
            userPromptTemplate: def.userPromptTemplate,
            modelPreference: def.modelPreference,
            temperature: def.temperature,
            version: 1,
            isActive: true,
          })
          .returning();
        return inserted;
      }
      return null;
    }

    return template;
  }

  async updateTemplate(
    stepName: string,
    data: {
      systemPrompt: string;
      userPromptTemplate: string;
      modelPreference?: string;
      temperature?: number;
    },
  ): Promise<PromptTemplate> {
    const siteId = await this.getDefaultSiteId();
    const existing = await this.getTemplateByStep(stepName);

    if (existing) {
      const [updated] = await this.db
        .update(promptTemplatesTable)
        .set({
          systemPrompt: data.systemPrompt,
          userPromptTemplate: data.userPromptTemplate,
          modelPreference: data.modelPreference ?? existing.modelPreference,
          temperature: data.temperature ?? existing.temperature,
          version: existing.version + 1,
          updatedAt: new Date(),
        })
        .where(eq(promptTemplatesTable.id, existing.id))
        .returning();

      return updated;
    }

    const [inserted] = await this.db
      .insert(promptTemplatesTable)
      .values({
        siteId,
        stepName,
        systemPrompt: data.systemPrompt,
        userPromptTemplate: data.userPromptTemplate,
        modelPreference: data.modelPreference ?? "gemini-2.5-flash",
        temperature: data.temperature ?? 70,
        version: 1,
        isActive: true,
      })
      .returning();

    return inserted;
  }

  async seedDefaults(): Promise<PromptTemplate[]> {
    const siteId = await this.getDefaultSiteId();
    const seeded: PromptTemplate[] = [];

    for (const def of DEFAULT_PROMPT_TEMPLATES) {
      const [existing] = await this.db
        .select()
        .from(promptTemplatesTable)
        .where(eq(promptTemplatesTable.stepName, def.stepName))
        .limit(1);

      if (!existing) {
        const [inserted] = await this.db
          .insert(promptTemplatesTable)
          .values({
            siteId,
            stepName: def.stepName,
            systemPrompt: def.systemPrompt,
            userPromptTemplate: def.userPromptTemplate,
            modelPreference: def.modelPreference,
            temperature: def.temperature,
            version: 1,
            isActive: true,
          })
          .returning();
        seeded.push(inserted);
      } else {
        seeded.push(existing);
      }
    }

    return seeded;
  }
}
