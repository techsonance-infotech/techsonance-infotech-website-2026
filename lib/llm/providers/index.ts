import { BOT_CONFIG } from "../../config";
import { getEnv } from "../../env";
import type { LLMProvider } from "../types";
import { OpenAICompatibleProvider } from "./openai-compatible";

export function getProviders(): LLMProvider[] {
  let env;
  try {
    env = getEnv();
  } catch {
    env = {
      GROQ_API_KEY: process.env.GROQ_API_KEY,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
      CEREBRAS_API_KEY: process.env.CEREBRAS_API_KEY,
      MISTRAL_API_KEY: process.env.MISTRAL_API_KEY,
      CF_ACCOUNT_ID: process.env.CF_ACCOUNT_ID,
      CF_API_TOKEN: process.env.CF_API_TOKEN,
      GITHUB_MODELS_TOKEN: process.env.GITHUB_MODELS_TOKEN,
      LLM_PRIORITY: process.env.LLM_PRIORITY || "groq,gemini,cerebras,openrouter,mistral,cloudflare,github",
    };
  }

  const p = BOT_CONFIG.providers;
  const providerMap: Record<string, LLMProvider> = {};

  // 1. Groq
  providerMap.groq = new OpenAICompatibleProvider({
    id: p.groq.id,
    name: p.groq.name,
    baseUrl: p.groq.baseUrl,
    apiKey: env.GROQ_API_KEY || "",
    model: p.groq.model,
  });

  // 2. Google Gemini (OpenAI compatible endpoint)
  providerMap.gemini = new OpenAICompatibleProvider({
    id: p.gemini.id,
    name: p.gemini.name,
    baseUrl: p.gemini.baseUrl,
    apiKey: env.GEMINI_API_KEY || "",
    model: p.gemini.model,
  });

  // 3. Cerebras
  providerMap.cerebras = new OpenAICompatibleProvider({
    id: p.cerebras.id,
    name: p.cerebras.name,
    baseUrl: p.cerebras.baseUrl,
    apiKey: env.CEREBRAS_API_KEY || "",
    model: p.cerebras.model,
  });

  // 4. OpenRouter Free Tier
  providerMap.openrouter = new OpenAICompatibleProvider({
    id: p.openrouter.id,
    name: p.openrouter.name,
    baseUrl: p.openrouter.baseUrl,
    apiKey: env.OPENROUTER_API_KEY || "",
    model: p.openrouter.model,
    extraHeaders: {
      "HTTP-Referer": "https://techsonance.co.in",
      "X-Title": "TechSonance Assistant",
    },
  });

  // 5. Mistral AI
  providerMap.mistral = new OpenAICompatibleProvider({
    id: p.mistral.id,
    name: p.mistral.name,
    baseUrl: p.mistral.baseUrl,
    apiKey: env.MISTRAL_API_KEY || "",
    model: p.mistral.model,
  });

  // 6. Cloudflare Workers AI
  const cfBaseUrl = env.CF_ACCOUNT_ID
    ? p.cloudflare.baseUrlPattern.replace("{ACCOUNT_ID}", env.CF_ACCOUNT_ID)
    : "";
  providerMap.cloudflare = new OpenAICompatibleProvider({
    id: p.cloudflare.id,
    name: p.cloudflare.name,
    baseUrl: cfBaseUrl,
    apiKey: env.CF_API_TOKEN || "",
    model: p.cloudflare.model,
  });

  // 7. GitHub Models
  providerMap.github = new OpenAICompatibleProvider({
    id: p.github.id,
    name: p.github.name,
    baseUrl: p.github.baseUrl,
    apiKey: env.GITHUB_MODELS_TOKEN || "",
    model: p.github.model,
  });

  // Order according to LLM_PRIORITY
  const priorityList = (env.LLM_PRIORITY || "groq,gemini,cerebras,openrouter,mistral,cloudflare,github")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const orderedProviders: LLMProvider[] = [];
  for (const id of priorityList) {
    if (providerMap[id]) {
      orderedProviders.push(providerMap[id]);
    }
  }

  // Append any remainder
  for (const [id, provider] of Object.entries(providerMap)) {
    if (!priorityList.includes(id)) {
      orderedProviders.push(provider);
    }
  }

  return orderedProviders;
}
