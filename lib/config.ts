// ─── Chatbot & Agency Global Configuration ─────────────────────────────────────
// Single source of truth for bot behavior, agency details, thresholds, and providers.

export const BOT_CONFIG = {
  name: "Sonance AI",
  role: "AI Assistant at TechSonance Infotech LLP",
  companyName: "TechSonance Infotech LLP",
  location: "Surat, Gujarat, India",
  tagline: "Where Innovation Finds Its Resonance",
  address: "UG-15, Palladium Plaza, VIP Road, Vesu, Surat, Gujarat - 395007, India",
  email: "info@techsonance.co.in",
  careersEmail: "hr@techsonance.co.in",
  phone: "+91 9173101711",
  siteUrl: "https://www.techsonance.co.in",
  defaultDomain: "techsonance.co.in",

  // Refusal & fallback templates
  refusalText:
    "I can only help with questions about TechSonance and your project. Want me to book a free 30 minute consultation so our team can look at your idea?",
  faqOnlyMessage:
    "I am currently in direct-answer mode. Our full engineering team is available for a personalized discussion.",
  exhaustedMessage:
    "I am a bit busy right now, but our team can help you directly. Would you like to schedule a free 30 minute consultation?",

  // Thresholds & bounds
  thresholds: {
    faqDirectMinScore: 0.68, // Top FAQ match threshold for zero-token direct answer
    relevanceMinScore: 0.18, // Minimum BM25 retrieval score to be considered in-scope
    maxInputChars: 500,
    maxHistoryMessages: 8,
    maxTokens: 350,
    temperature: 0.3,
    firstTokenTimeoutMs: 8000,
    maxConsecutiveServerErrors: 3,
    serverErrorCooldownSec: 120,
    repeatedServerErrorCooldownSec: 900,
    authErrorProbeIntervalSec: 3600,
    defaultExhaustedHours: 6,
  },

  // Rate Limits
  rateLimits: {
    chat: {
      maxRequests: 20,
      windowSeconds: 600, // 10 minutes
    },
    booking: {
      maxRequests: 5,
      windowSeconds: 3600, // 1 hour
    },
  },

  // Booking & Slots configuration (in IST - UTC+5:30)
  slots: {
    timezone: "Asia/Kolkata",
    businessDays: [1, 2, 3, 4, 5, 6], // Monday to Saturday (0 = Sun, 1 = Mon, ..., 6 = Sat)
    startHourIST: 10, // 10:00 AM IST
    endHourIST: 19, // 7:00 PM IST
    slotDurationMinutes: 30,
    bufferMinutes: 15,
    minNoticeHours: 12,
    maxDaysAhead: 21,
    holidays: [
      "2026-01-26", // Republic Day
      "2026-03-14", // Holi / Dhuleti
      "2026-08-15", // Independence Day
      "2026-10-02", // Gandhi Jayanti
      "2026-11-08", // Diwali
      "2026-11-09", // Vikram Samvat New Year
      "2026-12-25", // Christmas
    ],
  },

  // Default quick replies shown on welcome and after answers
  quickReplies: [
    "Services",
    "Pricing & Budget",
    "Our Team",
    "Book Free Consultation",
  ],

  // LLM Providers Definition
  providers: {
    groq: {
      id: "groq",
      name: "Groq",
      baseUrl: "https://api.groq.com/openai/v1",
      model: "llama-3.3-70b-versatile",
      fallbackModel: "llama-3.1-8b-instant",
      apiKeyEnv: "GROQ_API_KEY",
    },
    gemini: {
      id: "gemini",
      name: "Google Gemini",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
      model: "gemini-2.5-flash",
      fallbackModel: "gemini-2.5-flash-lite",
      apiKeyEnv: "GEMINI_API_KEY",
    },
    cerebras: {
      id: "cerebras",
      name: "Cerebras",
      baseUrl: "https://api.cerebras.ai/v1",
      model: "llama-3.3-70b",
      fallbackModel: "llama3.1-8b",
      apiKeyEnv: "CEREBRAS_API_KEY",
    },
    openrouter: {
      id: "openrouter",
      name: "OpenRouter Free Tier",
      baseUrl: "https://openrouter.ai/api/v1",
      model: "meta-llama/llama-3.3-70b-instruct:free",
      fallbackModel: "google/gemini-2.0-flash-exp:free",
      apiKeyEnv: "OPENROUTER_API_KEY",
    },
    mistral: {
      id: "mistral",
      name: "Mistral AI",
      baseUrl: "https://api.mistral.ai/v1",
      model: "mistral-small-latest",
      fallbackModel: "open-mistral-7b",
      apiKeyEnv: "MISTRAL_API_KEY",
    },
    cloudflare: {
      id: "cloudflare",
      name: "Cloudflare Workers AI",
      baseUrlPattern: "https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/v1",
      model: "@cf/meta/llama-3.1-8b-instruct",
      accountIdEnv: "CF_ACCOUNT_ID",
      apiTokenEnv: "CF_API_TOKEN",
    },
    github: {
      id: "github",
      name: "GitHub Models",
      baseUrl: "https://models.inference.ai.azure.com",
      model: "gpt-4o-mini",
      apiKeyEnv: "GITHUB_MODELS_TOKEN",
    },
  },
} as const;

export type ProviderId = keyof typeof BOT_CONFIG.providers;
