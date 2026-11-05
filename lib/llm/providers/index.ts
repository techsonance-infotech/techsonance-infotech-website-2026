import { getContainer } from "@/lib/di/container";
import { LLMProviderService } from "@/lib/services/llm-provider.service";
import type { LLMProvider } from "../types";

export function getProviders(): LLMProvider[] {
  return getContainer().get(LLMProviderService).getProviders();
}
