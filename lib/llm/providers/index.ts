import { getContainer } from "@/lib/di/container";
import { LLMProviderService } from "@/lib/services/llm-provider.service";
import type { LLMProvider } from "../types";

export * from "./openai-compatible";
export * from "./groq.provider";
export * from "./gemini.provider";

export function getProviders(): LLMProvider[] {
  return getContainer().get(LLMProviderService).getProviders();
}
