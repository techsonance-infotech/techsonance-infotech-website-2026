import "server-only";
import { inject } from "@needle-di/core";
import { AiCredentialsRepository } from "@/lib/repositories/ai-credentials.repository";
import { LLMHealthService } from "../llm-health.service";
import { BOT_CONFIG_TOKEN, ENV_CONFIG_TOKEN } from "@/lib/di/tokens";
import type { BOT_CONFIG } from "@/lib/config";
import type { Env } from "@/lib/env";
import { open, DecryptionError } from "@/lib/crypto/vault";
import {
  AiCredentialStatus,
  AiProviderId,
  type AiProvider,
} from "@/lib/constants/enums/ai.enum";
import { QuotaError } from "@/lib/llm/types";
import { logger } from "@/lib/logger";

export type FailureKind =
  | "RATE_LIMITED"
  | "QUOTA_EXHAUSTED"
  | "AUTH_FAILED"
  | "PROVIDER_DOWN"
  | "BAD_REQUEST";

export interface ClaimedKey {
  key: string;
  credentialId?: string;
  isFallbackEnv: boolean;
  label?: string;
  model?: string;
}

export class KeyBrokerService {
  constructor(
    private repo: AiCredentialsRepository = inject(AiCredentialsRepository),
    private healthService: LLMHealthService = inject(LLMHealthService),
    private env: Env = inject(ENV_CONFIG_TOKEN),
    private config: typeof BOT_CONFIG = inject(BOT_CONFIG_TOKEN),
  ) {}

  /**
   * Claims a healthy credential for the given provider.
   * Prioritizes active encrypted keys in Postgres; falls back to environment variables
   * during migration if no database credentials exist.
   */
  async claimKey(providerId: AiProviderId | AiProvider | string): Promise<ClaimedKey | null> {
    try {
      const cred = await this.repo.claimNextActiveCredential(providerId);

      if (cred && cred.ciphertext && cred.iv && cred.authTag) {
        try {
          const plainKey = open(
            {
              ciphertext: cred.ciphertext,
              iv: cred.iv,
              authTag: cred.authTag,
              keyVersion: cred.keyVersion,
            },
            `${cred.id}:${cred.provider}`,
          );

          return {
            key: plainKey,
            credentialId: cred.id,
            isFallbackEnv: false,
            label: cred.label,
            model: cred.model ?? undefined,
          };
        } catch (decryptErr) {
          logger.error("KeyBrokerService: Decryption failed for credential, quarantining", {
            credentialId: cred.id,
            provider: cred.provider,
            error: decryptErr instanceof Error ? decryptErr.message : "Unknown",
          });

          await this.repo.wipeCompromisedCredential(cred.id);
          await this.repo.recordEvent(cred.id, "compromised", "system", {
            reason: "DECRYPTION_AUTH_TAG_FAILED",
          });
        }
      }
    } catch (err) {
      logger.warn("KeyBrokerService: Error claiming DB credential, falling back to env", {
        providerId,
        error: err instanceof Error ? err.message : "Unknown",
      });
    }

    // Hybrid Fallback: Load static key from environment variables
    if (providerId === "cloudflare" || providerId === AiProviderId.CLOUDFLARE) {
      const cfAcc = (this.env as Record<string, any>).CF_ACCOUNT_ID;
      const cfTok = (this.env as Record<string, any>).CF_API_TOKEN;
      if (typeof cfAcc === "string" && cfAcc.trim() && typeof cfTok === "string" && cfTok.trim()) {
        return {
          key: `${cfAcc.trim()}:${cfTok.trim()}`,
          isFallbackEnv: true,
          label: "Environment Static Key (Cloudflare)",
        };
      }
    }

    const providerConfig = (this.config.providers as Record<string, any>)[providerId];
    if (providerConfig?.apiKeyEnv) {
      const envKey = (this.env as Record<string, any>)[providerConfig.apiKeyEnv];
      if (typeof envKey === "string" && envKey.trim().length > 0) {
        return {
          key: envKey.trim(),
          isFallbackEnv: true,
          label: "Environment Static Key",
        };
      }
    }

    return null;
  }

  /**
   * Records successful usage and token spend.
   */
  async reportSuccess(credentialId?: string, costUsd: number = 0): Promise<void> {
    if (!credentialId) return;
    try {
      await this.repo.recordUsage(credentialId, costUsd);
    } catch (err) {
      logger.warn("KeyBrokerService: Failed to record usage in repository", {
        credentialId,
        error: err instanceof Error ? err.message : "Unknown",
      });
    }
  }

  /**
   * Normalizes provider errors and marks credential & health states.
   */
  async reportFailure(
    providerId: AiProviderId | AiProvider | string,
    credentialId: string | undefined,
    errorKind: FailureKind,
    details?: { retryAfterSec?: number; errorMessage?: string },
  ): Promise<void> {
    // 1. Act on database credential if present
    if (credentialId) {
      try {
        switch (errorKind) {
          case "AUTH_FAILED": {
            // Immediate auto-quarantine
            await this.repo.wipeCompromisedCredential(credentialId);
            await this.repo.recordEvent(credentialId, "compromised", "system", {
              reason: "AUTH_FAILED",
              error: details?.errorMessage,
            });
            break;
          }
          case "QUOTA_EXHAUSTED": {
            await this.repo.updateStatus(
              credentialId,
              AiCredentialStatus.EXHAUSTED,
              null,
              "QUOTA_EXHAUSTED",
            );
            await this.repo.recordEvent(credentialId, "exhausted", "system", {
              reason: "QUOTA_EXHAUSTED",
            });
            break;
          }
          case "RATE_LIMITED": {
            const retrySec =
              details?.retryAfterSec && details.retryAfterSec > 0 ? details.retryAfterSec : 60;
            const cooldownUntil = new Date(Date.now() + retrySec * 1000);
            await this.repo.updateStatus(
              credentialId,
              AiCredentialStatus.COOLING_DOWN,
              cooldownUntil,
              "RATE_LIMITED",
            );
            await this.repo.recordEvent(credentialId, "cooled", "system", {
              retryAfterSec: retrySec,
            });
            break;
          }
          default:
            break;
        }
      } catch (err) {
        logger.warn("KeyBrokerService: Failed to update credential error status", {
          credentialId,
          error: err instanceof Error ? err.message : "Unknown",
        });
      }
    }

    // 2. Synchronize with Redis health tracker
    try {
      switch (errorKind) {
        case "RATE_LIMITED":
          await this.healthService.mark(
            providerId,
            new QuotaError("rate", details?.retryAfterSec || 60, details?.errorMessage),
          );
          break;
        case "QUOTA_EXHAUSTED":
          await this.healthService.mark(
            providerId,
            new QuotaError("daily", undefined, details?.errorMessage),
          );
          break;
        case "AUTH_FAILED":
          await this.healthService.mark(
            providerId,
            new QuotaError("auth", undefined, details?.errorMessage),
          );
          break;
        case "PROVIDER_DOWN":
          await this.healthService.mark(
            providerId,
            new QuotaError("server", undefined, details?.errorMessage),
          );
          break;
        default:
          break;
      }
    } catch {
      // Non-blocking health service update
    }
  }
}
