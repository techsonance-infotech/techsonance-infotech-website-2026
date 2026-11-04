import { getContainer } from "../../di/container";
import { LLMProviderService } from "../../services/llm-provider.service";
import type { LLMProvider } from "../types";

export function getProviders(): LLMProvider[] {
  return getContainer().get(LLMProviderService).getProviders();
}
