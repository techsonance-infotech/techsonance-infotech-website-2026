import "server-only";
import { inject } from "@needle-di/core";
import { LLMRouterService } from "./llm-router.service";
import type { LLMChatRequest } from "../llm/types";

export interface OutlineResult {
  headings: string[];
  keyPoints: Record<string, string[]>;
}

export interface MetadataResult {
  title: string;
  slug: string;
  excerpt: string;
  tags: string[];
  readTime: string;
  seoTitle: string;
  seoDescription: string;
  imagePrompt: string;
}

export interface ValidationResult {
  valid: boolean;
  wordCount: number;
  errors: string[];
}

export class AIWriterService {
  constructor(private llmRouter: LLMRouterService = inject(LLMRouterService)) {}

  private async completePrompt(systemPrompt: string, userPrompt: string): Promise<string> {
    const req: LLMChatRequest = {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      maxTokens: 2500,
    };

    let result = "";
    try {
      for await (const chunk of this.llmRouter.routeChat(req)) {
        result += chunk;
      }
    } catch (error) {
      console.error("AIWriterService completion error:", error);
      throw error;
    }

    return result.trim();
  }

  /**
   * Step 1: Generate structured outline
   */
  async generateOutline(
    topic: string,
    options: { category?: string; targetAudience?: string } = {},
  ): Promise<OutlineResult> {
    const systemPrompt = `You are a Principal Software Architect and Technical Writer at TechSonance Infotech.
Generate an in-depth, structured outline for an enterprise engineering article.
You MUST output ONLY a valid JSON object matching this schema:
{
  "headings": ["Introduction: ...", "Core Concept 1", "Implementation & Code Walkthrough", "Benchmarking & Performance", "Conclusion & Next Steps"],
  "keyPoints": {
    "Heading Name": ["Point 1", "Point 2", "Point 3"]
  }
}
Do not enclose in markdown code blocks if possible, or use standard \`\`\`json.`;

    const userPrompt = `Topic: "${topic}"
Category: ${options.category || "Engineering"}
Target Audience: ${options.targetAudience || "Tech Leads, Staff Engineers, and CTOs"}
Generate 4-6 focused technical headings with actionable key points.`;

    const responseText = await this.completePrompt(systemPrompt, userPrompt);
    
    // Parse JSON safely
    try {
      const cleanJson = responseText
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();
      const parsed = JSON.parse(cleanJson);
      if (Array.isArray(parsed.headings) && parsed.headings.length > 0) {
        return {
          headings: parsed.headings,
          keyPoints: parsed.keyPoints || {},
        };
      }
    } catch {
      // Fallback outline if LLM outputs irregular text
    }

    return {
      headings: [
        `Architecture & Foundations of ${topic}`,
        `Key Technical Considerations & Trade-offs`,
        `Production Implementation Patterns`,
        `Real-world Performance & Best Practices`,
      ],
      keyPoints: {},
    };
  }

  /**
   * Step 2: Generate deep section markdown
   */
  async generateSection(
    heading: string,
    context: {
      topic: string;
      outline: string[];
      keyPoints?: string[];
      previousSectionsSummary?: string;
    },
  ): Promise<string> {
    const systemPrompt = `You are an elite Staff Software Engineer writing for the TechSonance engineering blog.
Write a comprehensive, authoritative, practical section in clean GitHub Flavored Markdown.
Tone: Authoritative, pragmatic, clear, educational.
Strict Rules:
- Output ONLY the section markdown.
- Do NOT repeat the main article title.
- Start with "## ${heading}".
- Include concrete technical examples, architecture insights, and code snippets where relevant.
- Do NOT fabricate fake quotes, fake company names, or invented statistics.
- Never write generic fluff. Explain the 'why' and architectural trade-offs.`;

    const userPrompt = `Article Topic: "${context.topic}"
Current Section Heading: "${heading}"
Key Points to Cover: ${context.keyPoints?.join(", ") || "Provide depth and implementation details."}
Context of Previous Sections: ${context.previousSectionsSummary || "Beginning of the article."}

Write the full markdown for this section now.`;

    return await this.completePrompt(systemPrompt, userPrompt);
  }

  /**
   * Step 3: Extract & refine metadata, SEO tags, and image prompt
   */
  async generateMetadata(fullDraft: string, topic: string): Promise<MetadataResult> {
    const systemPrompt = `You are an SEO Strategist and Creative Director for TechSonance Infotech.
Analyze the article draft and generate publication metadata.
You MUST output ONLY a valid JSON object matching this schema:
{
  "title": "Compelling Title (under 60 chars)",
  "slug": "url-friendly-slug-with-hyphens",
  "excerpt": "Engaging summary under 160 characters for social cards and previews.",
  "tags": ["Tag1", "Tag2", "Tag3", "Tag4"],
  "readTime": "5 min read",
  "seoTitle": "SEO Title | TechSonance",
  "seoDescription": "Search-optimized description under 155 chars.",
  "imagePrompt": "A single descriptive prompt for an AI image generator representing the core theme (abstract tech illustration, no text)."
}`;

    const userPrompt = `Topic: "${topic}"
Article Draft Preview:
${fullDraft.slice(0, 3000)}

Generate the publication metadata JSON.`;

    const responseText = await this.completePrompt(systemPrompt, userPrompt);

    try {
      const cleanJson = responseText
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();
      const parsed = JSON.parse(cleanJson);
      return {
        title: parsed.title || topic,
        slug:
          (parsed.slug || topic)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "") || "post-" + Date.now(),
        excerpt: parsed.excerpt || `Technical exploration of ${topic} by TechSonance.`,
        tags: Array.isArray(parsed.tags) ? parsed.tags : ["Engineering", "Architecture"],
        readTime: parsed.readTime || "6 min read",
        seoTitle: parsed.seoTitle || `${parsed.title || topic} | TechSonance`,
        seoDescription: parsed.seoDescription || parsed.excerpt || topic,
        imagePrompt: parsed.imagePrompt || `Modern isometric vector graphic of ${topic}`,
      };
    } catch {
      const safeSlug = topic
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      return {
        title: topic,
        slug: safeSlug || "tech-post-" + Date.now(),
        excerpt: `In-depth technical guide to ${topic} for engineering teams.`,
        tags: ["Engineering", "Web Architecture"],
        readTime: "5 min read",
        seoTitle: `${topic} | TechSonance`,
        seoDescription: `Comprehensive technical guide covering ${topic}.`,
        imagePrompt: `Minimalist cloud software architecture diagram representing ${topic}`,
      };
    }
  }

  /**
   * Step 4: Quality & Validation Checks
   */
  validateArticle(article: { title: string; content: string; slug: string }): ValidationResult {
    const errors: string[] = [];

    if (!article.title || article.title.length < 5) {
      errors.push("Title is missing or too short.");
    }

    if (!article.slug || article.slug.length < 3) {
      errors.push("Slug is missing or invalid.");
    }

    const words = article.content.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    if (wordCount < 300) {
      errors.push(`Content is too short (${wordCount} words; minimum required is 300).`);
    }

    // Check for banned / placeholder terms
    const bannedPatterns = [/lorem ipsum/i, /placeholder text/i, /todo: /i, /as an ai language model/i];
    for (const pattern of bannedPatterns) {
      if (pattern.test(article.content)) {
        errors.push(`Found disallowed boilerplate pattern: ${pattern.toString()}`);
      }
    }

    return {
      valid: errors.length === 0,
      wordCount,
      errors,
    };
  }
}
