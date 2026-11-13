import "server-only";
import { z } from "zod";

export const serverEnvSchema = z.object({
  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_JWT_SECRET: z.string().optional(),
  JWT_ACCESS_SECRET: z.string().optional(),
  BETTER_AUTH_SECRET: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  SUPABASE_DB_URL: z.string().optional(),

  // LLM Providers
  GROQ_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  CEREBRAS_API_KEY: z.string().optional(),
  MISTRAL_API_KEY: z.string().optional(),
  CF_ACCOUNT_ID: z.string().optional(),
  CF_API_TOKEN: z.string().optional(),
  GITHUB_MODELS_TOKEN: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  ENABLE_POLLINATIONS_FALLBACK: z.string().optional().default("false"),

  LLM_PRIORITY: z.string().default("groq,gemini,cerebras,openrouter,mistral,cloudflare,github"),
  EXHAUSTED_RETRY_HOURS: z.coerce.number().default(6),

  // Email Configuration
  ADMIN_EMAIL: z.string().optional(),
  FROM_EMAIL: z.string().optional(),
  SMTP_HOST: z.string().optional().default("smtp.gmail.com"),
  SMTP_PORT: z.coerce.number().optional().default(465),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASS: z.string().optional(),
  SMTP_SECURE: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),

  // Cron & Debug
  CRON_SECRET: z.string().optional(),
  DEBUG: z.string().optional(),

  // Site verification & Analytics
  NEXT_PUBLIC_SITE_URL: z.string().url().optional().default("http://localhost:3000"),
  NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION: z.string().optional(),
  NEXT_PUBLIC_BING_SITE_VERIFICATION: z.string().optional(),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),

  // Optional Redis
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Bot Protection
  TURNSTILE_SITE_KEY: z.string().optional(),
  TURNSTILE_SECRET: z.string().optional(),

  // Cache Revalidation
  REVALIDATE_SECRET: z.string().optional(),

  // QStash
  QSTASH_TOKEN: z.string().optional(),
  QSTASH_CURRENT_SIGNING_KEY: z.string().optional(),
  QSTASH_NEXT_SIGNING_KEY: z.string().optional(),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_URL: z.string().optional(),

  // AI Blog Settings
  AI_BLOG_SITE_ID: z.string().optional(),
  AI_BLOG_APPROVER_EMAIL: z.string().email().optional().default("info@techsonance.co.in"),
  AI_BLOG_APPROVAL_EXPIRY_HOURS: z.coerce.number().optional().default(72),
  AI_BLOG_DAILY_CAP: z.coerce.number().optional().default(1),
  AI_BLOG_WEEKLY_CAP: z.coerce.number().optional().default(3),

  // AI Vault & Credential Pipeline
  AI_KEK_V1: z.string().optional().default("k4q8V4/9h5vL4P8rW3Z8N9tK2eR6vU4X7yT1wQ3mB6E="),
  AI_KEK_V2: z.string().optional(),
  AI_FP_PEPPER: z.string().optional().default("dGVjaHNvbmFuY2UtYWktZnAtcGVwcGVyLTIwMjYtZGV2"),

  // App & Security
  ALLOWED_ORIGINS: z
    .string()
    .optional()
    .default("http://localhost:3000,https://www.techsonance.co.in,https://techsonance.co.in"),
  COMPANY_DOMAIN: z.string().optional().default("techsonance.co.in"),
  HEALTH_SECRET: z.string().optional(),
  CAL_WEBHOOK_SECRET: z.string().optional(),
  ALLOW_PLACEHOLDERS: z
    .string()
    .optional()
    .default(process.env.NODE_ENV === "production" ? "false" : "true")
    .transform((val) => val === "true" || val === "1"),
}).superRefine((data, ctx) => {
  if (process.env.NODE_ENV === "production") {
    const DEV_KEK = "k4q8V4/9h5vL4P8rW3Z8N9tK2eR6vU4X7yT1wQ3mB6E=";
    const DEV_PEPPER = "dGVjaHNvbmFuY2UtYWktZnAtcGVwcGVyLTIwMjYtZGV2";

    if (!data.AI_KEK_V1 || data.AI_KEK_V1 === DEV_KEK) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "AI_KEK_V1 must be set to a unique 32-byte base64 encryption key in production.",
        path: ["AI_KEK_V1"],
      });
    }

    if (!data.AI_FP_PEPPER || data.AI_FP_PEPPER === DEV_PEPPER) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "AI_FP_PEPPER must be set to a unique pepper string in production.",
        path: ["AI_FP_PEPPER"],
      });
    }

    const sessionSecret = data.JWT_ACCESS_SECRET || data.BETTER_AUTH_SECRET;
    const DEV_SECRET = "techsonance-studio-admin-secret-minimum-32-chars";
    if (!sessionSecret || sessionSecret.length < 32 || sessionSecret === DEV_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "JWT_ACCESS_SECRET or BETTER_AUTH_SECRET must be set to a secure key of at least 32 characters in production.",
        path: ["JWT_ACCESS_SECRET"],
      });
    }
  }
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let parsedServerEnv: ServerEnv | null = null;

export function resetServerEnv(): void {
  parsedServerEnv = null;
}

export function getServerEnv(): ServerEnv {
  if (parsedServerEnv) return parsedServerEnv;
  const result = serverEnvSchema.safeParse(process.env);
  if (!result.success) {
    console.error("❌ Invalid server environment configuration:", result.error.format());
    throw new Error("Invalid server environment configuration");
  }
  parsedServerEnv = result.data;
  return parsedServerEnv;
}
