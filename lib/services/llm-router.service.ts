import "server-only";
import { inject } from "@needle-di/core";
import { LLMHealthService } from "./llm-health.service";
import { LLMProviderService } from "./llm-provider.service";
import { KeyBrokerService, type FailureKind } from "./ai/key-broker.service";
import { AllExhaustedError, QuotaError, type LLMChatRequest, type LLMProvider } from "../llm/types";
import { type AiProvider, type AiProviderId } from "@/lib/constants/enums/ai.enum";

export class LLMRouterService {
  constructor(
    private healthService: LLMHealthService = inject(LLMHealthService),
    private providerService: LLMProviderService = inject(LLMProviderService),
    private keyBroker: KeyBrokerService = inject(KeyBrokerService),
  ) {}

  async *routeChat(req: LLMChatRequest, customProviders?: LLMProvider[]): AsyncIterable<string> {
    const now = Date.now();
    const allProviders = customProviders || this.providerService.getProviders();

    // Filter for enabled and usable providers
    const usablePool: LLMProvider[] = [];
    for (const p of allProviders) {
      if (p.enabled() && (await this.healthService.isUsable(p.id, now))) {
        usablePool.push(p);
      }
    }

    if (usablePool.length === 0) {
      const earliest = await this.healthService.earliestRetryAt();
      throw new AllExhaustedError(earliest);
    }

    // Single pass through usable pool (no while loop, no recursion)
    for (const provider of usablePool) {
      let yieldedAnyToken = false;
      let activeProvider = provider;
      let credentialId: string | undefined;

      try {
        if (this.keyBroker) {
          const claimed = await this.keyBroker.claimKey(provider.id);
          if (claimed) {
            credentialId = claimed.credentialId;
            if (typeof provider.withApiKey === "function") {
              activeProvider = provider.withApiKey(claimed.key, claimed.model);
            }
          }
        }

        for await (const chunk of activeProvider.chat(req)) {
          yieldedAnyToken = true;
          yield chunk;
        }

        // Successful completion
        if (this.keyBroker) {
          await this.keyBroker.reportSuccess(credentialId);
        }
        await this.healthService.markOk(provider.id);
        return;
      } catch (err: unknown) {
        let failureKind: FailureKind = "PROVIDER_DOWN";
        let retryAfterSec: number | undefined;

        if (err instanceof QuotaError) {
          if (err.kind === "rate") failureKind = "RATE_LIMITED";
          else if (err.kind === "daily") failureKind = "QUOTA_EXHAUSTED";
          else if (err.kind === "auth") failureKind = "AUTH_FAILED";
          else failureKind = "PROVIDER_DOWN";
          retryAfterSec = err.retryAfterSec;
          await this.healthService.mark(provider.id, err);
        } else {
          await this.healthService.mark(provider.id, new QuotaError("server", 120, String(err)));
        }

        if (this.keyBroker) {
          await this.keyBroker.reportFailure(provider.id, credentialId, failureKind, {
            retryAfterSec,
            errorMessage: err instanceof Error ? err.message : String(err),
          });
        }

        // If tokens were already sent to client, DO NOT switch providers mid-stream
        if (yieldedAnyToken) {
          yield "\n\n... Would you like to connect directly with our engineering team for a free consultation?";
          return;
        }

        // Continue to next provider in loop
      }
    }

    // All attempted providers failed
    const earliest = await this.healthService.earliestRetryAt();
    throw new AllExhaustedError(earliest);
  }
}
