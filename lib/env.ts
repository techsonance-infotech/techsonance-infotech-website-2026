import { z } from "zod";

const envSchema = z.object({
  // LLM Providers (optional, but at least one should be active for full RAG mode)
  GROQ_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  CEREBRAS_API_KEY: z.string().optional(),
  MISTRAL_API_KEY: z.string().optional(),
  CF_ACCOUNT_ID: z.string().optional(),
  CF_API_TOKEN: z.string().optional(),
  GITHUB_MODELS_TOKEN: z.string().optional(),

  LLM_PRIORITY: z
    .string()
    .default("groq,gemini,cerebras,openrouter,mistral,cloudflare,github"),
  EXHAUSTED_RETRY_HOURS: z.coerce.number().default(6),

  // Email Configuration (SMTP or Resend)
  ADMIN_EMAIL: z.string().optional(),
  FROM_EMAIL: z.string().optional(),
  SMTP_HOST: z.string().optional().default("smtp.gmail.com"),
  SMTP_PORT: z.coerce.number().optional().default(465),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),

  // Optional Redis for shared health and distributed rate limiting
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Optional Bot Protection (Cloudflare Turnstile)
  TURNSTILE_SITE_KEY: z.string().optional(),
  TURNSTILE_SECRET: z.string().optional(),

  // App & Security
  NEXT_PUBLIC_SITE_URL: z.string().optional().default("http://localhost:3000"),
  ALLOWED_ORIGINS: z
    .string()
    .optional()
    .default("http://localhost:3000,https://www.techsonance.co.in,https://techsonance.co.in"),
  COMPANY_DOMAIN: z.string().optional().default("techsonance.co.in"),
  HEALTH_SECRET: z.string().optional(),
  ALLOW_PLACEHOLDERS: z
    .string()
    .optional()
    .default("true")
    .transform((val) => val === "true" || val === "1"),
});

export type Env = z.infer<typeof envSchema>;

let parsedEnv: Env | null = null;

export function getEnv(): Env {
  if (parsedEnv) return parsedEnv;

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("❌ Invalid environment variables configuration:");
    console.error(result.error.format());
    throw new Error("Invalid environment variables");
  }
  parsedEnv = result.data;
  return parsedEnv;
}
