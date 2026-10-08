import { BOT_CONFIG } from "../../config";
import { QuotaError, type LLMChatRequest, type LLMProvider } from "../types";

export interface OpenAICompatibleOptions {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  extraHeaders?: Record<string, string>;
}

export class OpenAICompatibleProvider implements LLMProvider {
  public id: string;
  public name: string;
  private baseUrl: string;
  private apiKey: string;
  private model: string;
  private extraHeaders?: Record<string, string>;

  constructor(options: OpenAICompatibleOptions) {
    this.id = options.id;
    this.name = options.name;
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.apiKey = options.apiKey;
    this.model = options.model;
    this.extraHeaders = options.extraHeaders;
  }

  enabled(): boolean {
    return !!this.apiKey && this.apiKey.trim().length > 0;
  }

  async *chat(req: LLMChatRequest): AsyncIterable<string> {
    if (!this.enabled()) {
      throw new QuotaError("auth", undefined, `Provider ${this.id} is not configured with an API key.`);
    }

    const controller = new AbortController();
    const externalSignal = req.signal;

    if (externalSignal) {
      externalSignal.addEventListener("abort", () => controller.abort());
    }

    // First-token timeout timer (8s)
    let hasReceivedFirstToken = false;
    const timeoutTimer = setTimeout(() => {
      if (!hasReceivedFirstToken) {
        controller.abort(new QuotaError("timeout", 120, `Provider ${this.id} timed out waiting for first token.`));
      }
    }, BOT_CONFIG.thresholds.firstTokenTimeoutMs);

    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          ...this.extraHeaders,
        },
        body: JSON.stringify({
          model: this.model,
          messages: req.messages,
          stream: true,
          max_tokens: req.maxTokens || BOT_CONFIG.thresholds.maxTokens,
          temperature: req.temperature ?? BOT_CONFIG.thresholds.temperature,
        }),
        signal: controller.signal,
      });
    } catch (err: unknown) {
      clearTimeout(timeoutTimer);
      if (err instanceof QuotaError) throw err;
      if (err instanceof Error && err.name === "AbortError") {
        throw new QuotaError("timeout", 120, `Request to ${this.id} was aborted or timed out.`);
      }
      throw new QuotaError("server", 120, `Network error communicating with ${this.id}: ${String(err)}`);
    }

    if (!res.ok) {
      clearTimeout(timeoutTimer);
      const status = res.status;
      const retryAfterHeader = res.headers.get("retry-after");
      const retrySec = retryAfterHeader ? parseInt(retryAfterHeader, 10) || 60 : undefined;
      const bodyText = await res.text().catch(() => "");

      if (status === 429) {
        if (/quota|credit|exhausted|daily/i.test(bodyText)) {
          throw new QuotaError("daily", undefined, `Daily quota exceeded for ${this.id}`);
        }
        throw new QuotaError("rate", retrySec, `Rate limit reached for ${this.id}`);
      }
      if (status === 402) {
        throw new QuotaError("daily", undefined, `Credit exhausted for ${this.id}`);
      }
      if (status === 401 || status === 403) {
        throw new QuotaError("auth", undefined, `Authentication failed for ${this.id}`);
      }
      if (status >= 500) {
        throw new QuotaError("server", 120, `Server error ${status} from ${this.id}`);
      }
      throw new QuotaError("server", 60, `Unexpected HTTP ${status} from ${this.id}: ${bodyText.slice(0, 100)}`);
    }

    if (!res.body) {
      clearTimeout(timeoutTimer);
      throw new QuotaError("server", 60, `Empty response body from ${this.id}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(":") || trimmed === "data: [DONE]") continue;

          if (trimmed.startsWith("data: ")) {
            const jsonStr = trimmed.slice(6).trim();
            try {
              const data = JSON.parse(jsonStr);
              const deltaContent = data.choices?.[0]?.delta?.content;
              if (deltaContent) {
                if (!hasReceivedFirstToken) {
                  hasReceivedFirstToken = true;
                  clearTimeout(timeoutTimer);
                }
                yield deltaContent;
              }
            } catch {
              // Ignore partial JSON chunk line
            }
          }
        }
      }
    } finally {
      clearTimeout(timeoutTimer);
      reader.releaseLock();
    }
  }
}
