// ─── LLM Types & Error Definitions ──────────────────────────────────────────

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMChatRequest {
  messages: LLMMessage[];
  maxTokens?: number;
  temperature?: number;
  signal?: AbortSignal;
}

export type QuotaErrorKind = "rate" | "daily" | "auth" | "server" | "timeout";

export class QuotaError extends Error {
  constructor(
    public kind: QuotaErrorKind,
    public retryAfterSec?: number,
    message?: string
  ) {
    super(message || `LLM Provider Error: ${kind}`);
    this.name = "QuotaError";
  }
}

export class AllExhaustedError extends Error {
  constructor(public earliestRetryAt?: number, message?: string) {
    super(
      message ||
        `All LLM providers are currently exhausted. Earliest retry at: ${
          earliestRetryAt ? new Date(earliestRetryAt).toISOString() : "unknown"
        }`
    );
    this.name = "AllExhaustedError";
  }
}

export interface LLMProvider {
  id: string;
  name: string;
  enabled: () => boolean;
  chat(req: LLMChatRequest): AsyncIterable<string>;
}
