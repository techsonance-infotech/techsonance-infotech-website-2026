import { AiProviderId } from "@/lib/constants/enums/ai.enum";
import {
  OpenAICompatibleProvider,
  type OpenAICompatibleOptions,
} from "./openai-compatible";

export interface GeminiProviderOptions
  extends Omit<OpenAICompatibleOptions, "id" | "baseUrl"> {
  id?: string;
  baseUrl?: string;
}

/**
 * Dedicated Google Gemini LLM Provider.
 * Connects to Google's official Gemini OpenAI-compatible REST endpoint.
 * Supports gemini-3.0-flash, gemini-3.0-flash-lite, gemini-3.0-pro, etc.
 */
export class GeminiProvider extends OpenAICompatibleProvider {
  constructor(options: GeminiProviderOptions) {
    super({
      id: options.id || AiProviderId.GEMINI,
      name: options.name || "Google Gemini",
      baseUrl:
        options.baseUrl ||
        "https://generativelanguage.googleapis.com/v1beta/openai",
      apiKey: options.apiKey,
      model: options.model || "gemini-3.5-flash-lite",
      extraHeaders: options.extraHeaders,
    });
  }

  override withApiKey(apiKey: string, modelOverride?: string): GeminiProvider {
    return new GeminiProvider({
      id: String(this.id),
      name: this.name,
      apiKey,
      model: modelOverride && modelOverride.trim() ? modelOverride.trim() : this.model,
    });
  }
}
