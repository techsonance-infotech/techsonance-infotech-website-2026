import { AiProviderId } from "@/lib/constants/enums/ai.enum";
import {
  OpenAICompatibleProvider,
  type OpenAICompatibleOptions,
} from "./openai-compatible";

export interface GroqProviderOptions
  extends Omit<OpenAICompatibleOptions, "id" | "baseUrl"> {
  id?: string;
  baseUrl?: string;
}

/**
 * Dedicated Groq LLM Provider.
 * Connects to Groq's high-speed inference engine via its OpenAI-compatible endpoint.
 * Supports Llama 3.3, OpenAI OSS (e.g. openai/gpt-oss-120b), Qwen 3.8, etc.
 */
export class GroqProvider extends OpenAICompatibleProvider {
  constructor(options: GroqProviderOptions) {
    super({
      id: options.id || AiProviderId.GROQ,
      name: options.name || "Groq",
      baseUrl: options.baseUrl || "https://api.groq.com/openai/v1",
      apiKey: options.apiKey,
      model: options.model || "openai/gpt-oss-120b",
      extraHeaders: options.extraHeaders,
    });
  }

  override withApiKey(apiKey: string, modelOverride?: string): GroqProvider {
    return new GroqProvider({
      id: String(this.id),
      name: this.name,
      apiKey,
      model: modelOverride && modelOverride.trim() ? modelOverride.trim() : this.model,
    });
  }
}
