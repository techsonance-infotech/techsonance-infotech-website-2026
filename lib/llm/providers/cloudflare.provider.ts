import { AiProviderId } from "@/lib/constants/enums/ai.enum";
import { OpenAICompatibleProvider, type OpenAICompatibleOptions } from "./openai-compatible";

export interface CloudflareProviderOptions
  extends Omit<OpenAICompatibleOptions, "id" | "baseUrl"> {
  id?: string;
  baseUrl?: string;
  accountId?: string;
}

/**
 * Dedicated Cloudflare Workers AI LLM Provider.
 * Connects to Cloudflare Workers AI OpenAI-compatible chat completions endpoint:
 * https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/v1/chat/completions
 * Supports Llama 3.3 70B, Llama 3.1 8B, DeepSeek R1 Distill, Qwen 2.5, etc.
 * Supports credentials formatted as "accountId:apiToken" or JSON.
 */
export class CloudflareProvider extends OpenAICompatibleProvider {
  protected accountId?: string;

  constructor(options: CloudflareProviderOptions) {
    let parsedAccountId = options.accountId;
    let effectiveToken = options.apiKey;

    // Support combined "accountId:apiToken" or JSON payload
    if (options.apiKey && options.apiKey.includes(":")) {
      const parts = options.apiKey.split(":");
      parsedAccountId = parts[0]?.trim();
      effectiveToken = parts.slice(1).join(":").trim();
    } else if (options.apiKey && options.apiKey.startsWith("{")) {
      try {
        const parsed = JSON.parse(options.apiKey) as {
          accountId?: string;
          apiToken?: string;
          CF_ACCOUNT_ID?: string;
          CF_API_TOKEN?: string;
        };
        parsedAccountId = parsed.accountId || parsed.CF_ACCOUNT_ID;
        effectiveToken = (parsed.apiToken || parsed.CF_API_TOKEN || "").trim();
      } catch {
        // Fall back to raw options
      }
    }

    const accountId = parsedAccountId || "placeholder-account";
    const baseUrl =
      options.baseUrl ||
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1`;

    super({
      id: options.id || AiProviderId.CLOUDFLARE,
      name: options.name || "Cloudflare Workers AI",
      baseUrl,
      apiKey: effectiveToken,
      model: options.model || "@cf/meta/llama-3.1-8b-instruct",
      extraHeaders: options.extraHeaders,
    });

    this.accountId = parsedAccountId;
  }

  override withApiKey(apiKey: string, modelOverride?: string): CloudflareProvider {
    return new CloudflareProvider({
      id: String(this.id),
      name: this.name,
      apiKey,
      accountId: this.accountId,
      model: modelOverride && modelOverride.trim() ? modelOverride.trim() : this.model,
    });
  }

  override enabled(): boolean {
    return (
      !!this.apiKey &&
      this.apiKey.trim().length > 0 &&
      !!this.accountId &&
      this.accountId.trim().length > 0 &&
      this.accountId !== "placeholder-account"
    );
  }
}
