export const AI_ADMIN_ROUTES = {
  CREDENTIALS: "/admin/ai/credentials",
  PIPELINE: "/admin/blog/ai",
  USAGE: "/admin/blog/ai/usage",
} as const;

export const AI_JOBS_LIMITS = {
  TOPIC_MIN: 5,
  TOPIC_MAX: 300,
  CATEGORY_MAX: 100,
  DEFAULT_LIMIT: 30,
  MAX_LIMIT: 100,
} as const;

export const AI_JOBS_ERRORS = {
  UNAUTHORIZED: "You must be signed in to access AI generation jobs",
  FORBIDDEN_ORIGIN: "Forbidden origin",
  FORBIDDEN_ROLE:
    "Insufficient permissions. Only editors and admins can trigger AI generation jobs.",
  TOPIC_REQUIRED: "Topic text is required and must be between 5 and 300 characters.",
  JOB_NOT_FOUND: "AI generation job not found",
  TRIGGER_FAILED: "Failed to trigger AI generation job",
  LIST_FAILED: "Failed to list AI generation jobs",
} as const;

export const AI_JOBS_MESSAGES = {
  JOB_ENQUEUED: "Job enqueued and generation started in background",
} as const;

export const AI_TOPICS_LIMITS = {
  TITLE_MIN: 5,
  TITLE_MAX: 250,
  KEYWORD_MAX: 60,
  KEYWORDS_MAX_COUNT: 20,
  CATEGORY_MAX: 100,
  TARGET_AUDIENCE_MAX: 150,
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 100,
} as const;

export const AI_TOPICS_ERRORS = {
  UNAUTHORIZED: "You must be signed in to access AI topic clusters",
  FORBIDDEN_ORIGIN: "Forbidden origin",
  FORBIDDEN_ROLE: "Insufficient permissions. Only editors and admins can modify AI topic clusters.",
  TITLE_REQUIRED: "Topic title is required and must be between 5 and 250 characters.",
  TOPIC_NOT_FOUND: "AI topic not found",
  CREATE_FAILED: "Failed to create AI topic",
  UPDATE_FAILED: "Failed to update AI topic status",
  DELETE_FAILED: "Failed to delete AI topic",
  LIST_FAILED: "Failed to list AI topics",
  SUGGEST_FAILED: "Failed to generate AI topic suggestions",
  LAUNCH_FAILED: "Failed to launch autonomous generation for topic",
  INVALID_STATUS: "Valid status required: SUGGESTED, ACCEPTED, QUEUED, GENERATED, or REJECTED",
} as const;

export const AI_TOPICS_MESSAGES = {
  TOPIC_CREATED: "Topic added to backlog successfully.",
  STATUS_UPDATED: "Topic status updated successfully.",
  TOPIC_DELETED: "Topic removed successfully.",
  TOPICS_SUGGESTED: "AI topic suggestions generated and added to backlog.",
  TOPIC_LAUNCHED: "Autonomous generation job triggered successfully.",
} as const;

export const AI_USAGE_ERRORS = {
  UNAUTHORIZED: "You must be signed in to access AI telemetry and usage metrics",
  FORBIDDEN_ORIGIN: "Forbidden origin",
  LOAD_FAILED: "Failed to load AI telemetry usage metrics",
} as const;

export const AI_PROMPTS_LIMITS = {
  STEP_NAME_MIN: 1,
  STEP_NAME_MAX: 64,
  SYSTEM_PROMPT_MIN: 10,
  SYSTEM_PROMPT_MAX: 8000,
  USER_PROMPT_TEMPLATE_MIN: 5,
  USER_PROMPT_TEMPLATE_MAX: 4000,
  MODEL_PREFERENCE_MAX: 100,
  TEMPERATURE_MIN: 0,
  TEMPERATURE_MAX: 100,
} as const;

export const AI_PROMPTS_ERRORS = {
  UNAUTHORIZED: "You must be signed in to manage AI prompt templates",
  FORBIDDEN_ORIGIN: "Forbidden origin",
  FORBIDDEN_ROLE:
    "Insufficient permissions. Only editors and admins can modify AI prompt templates.",
  TEMPLATE_NOT_FOUND: "AI prompt template not found",
  LIST_FAILED: "Failed to list AI prompt templates",
  UPDATE_FAILED: "Failed to update AI prompt template",
  INVALID_ID: "Invalid template ID format. Expected a valid UUID.",
  VALIDATION_FAILED: "Prompt template validation failed",
} as const;

export const AI_PROMPTS_MESSAGES = {
  TEMPLATE_UPDATED: "Prompt template updated successfully.",
} as const;

export interface DefaultPromptTemplate {
  stepName: string;
  modelPreference: string;
  temperature: number;
  systemPrompt: string;
  userPromptTemplate: string;
}

export const DEFAULT_PROMPT_TEMPLATES: readonly DefaultPromptTemplate[] = [
  {
    stepName: "outline",
    modelPreference: "gemini-3.0-flash",
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
    modelPreference: "gemini-3.0-flash",
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
    modelPreference: "gemini-3.0-flash",
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
    modelPreference: "gemini-3.0-flash",
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
