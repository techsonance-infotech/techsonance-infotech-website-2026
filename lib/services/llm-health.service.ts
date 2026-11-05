import "server-only";
import { inject } from "@needle-di/core";
import { BOT_CONFIG_TOKEN, ENV_CONFIG_TOKEN } from "../di/tokens";
import type { BOT_CONFIG } from "../config";
import type { Env } from "../env";
import type { QuotaError } from "../llm/types";

export type HealthState = "HEALTHY" | "COOLDOWN" | "EXHAUSTED" | "DISABLED";

export interface ProviderHealthRecord {
  state: HealthState;
  nextTry: number;
  consecutiveServerErrors: number;
}

export class LLMHealthService {
  private inMemoryHealth = new Map<string, ProviderHealthRecord>();

  constructor(
    private env: Env = inject(ENV_CONFIG_TOKEN),
    private config: typeof BOT_CONFIG = inject(BOT_CONFIG_TOKEN),
  ) {}

  private getRedisConfig() {
    try {
      if (this.env.UPSTASH_REDIS_REST_URL && this.env.UPSTASH_REDIS_REST_TOKEN) {
        return {
          url: this.env.UPSTASH_REDIS_REST_URL,
          token: this.env.UPSTASH_REDIS_REST_TOKEN,
        };
      }
    } catch {
      // env not loaded or invalid
    }
    return null;
  }

  async getRecord(id: string): Promise<ProviderHealthRecord> {
    const redis = this.getRedisConfig();
    if (redis) {
      try {
        const res = await fetch(`${redis.url}/get/llm:health:${id}`, {
          headers: { Authorization: `Bearer ${redis.token}` },
        });
        if (res.ok) {
          const json = await res.json();
          if (json.result) {
            return JSON.parse(json.result);
          }
        }
      } catch {
        // Fallback to in-memory on redis connection error
      }
    }

    const rec = this.inMemoryHealth.get(id);
    if (!rec) {
      const defaultRec: ProviderHealthRecord = {
        state: "HEALTHY",
        nextTry: 0,
        consecutiveServerErrors: 0,
      };
      this.inMemoryHealth.set(id, defaultRec);
      return defaultRec;
    }
    return rec;
  }

  async setRecord(id: string, rec: ProviderHealthRecord, ttlSec?: number): Promise<void> {
    this.inMemoryHealth.set(id, rec);

    const redis = this.getRedisConfig();
    if (redis) {
      try {
        const val = JSON.stringify(rec);
        const ttl = ttlSec && ttlSec > 0 ? ttlSec : 3600;
        await fetch(`${redis.url}/set/llm:health:${id}/${encodeURIComponent(val)}?ex=${ttl}`, {
          headers: { Authorization: `Bearer ${redis.token}` },
        });
      } catch {
        // Ignore redis set failure in fallback mode
      }
    }
  }

  async isUsable(id: string, now = Date.now()): Promise<boolean> {
    const rec = await this.getRecord(id);
    if (rec.state === "HEALTHY") return true;
    if (now >= rec.nextTry) {
      // Lazy transition back to HEALTHY upon probe time expiry
      rec.state = "HEALTHY";
      await this.setRecord(id, rec);
      return true;
    }
    return false;
  }

  async markOk(id: string): Promise<void> {
    const rec = await this.getRecord(id);
    rec.state = "HEALTHY";
    rec.nextTry = 0;
    rec.consecutiveServerErrors = 0;
    await this.setRecord(id, rec);
  }

  async mark(id: string, error: QuotaError, now = Date.now()): Promise<void> {
    const rec = await this.getRecord(id);
    let ttl = 60;
    const thresholds = this.config.thresholds;

    switch (error.kind) {
      case "rate": {
        const retrySec = error.retryAfterSec && error.retryAfterSec > 0 ? error.retryAfterSec : 60;
        rec.state = "COOLDOWN";
        rec.nextTry = now + retrySec * 1000;
        ttl = retrySec;
        break;
      }
      case "daily": {
        const exhaustHours = thresholds.defaultExhaustedHours;
        const exhaustSec = exhaustHours * 3600;
        rec.state = "EXHAUSTED";
        rec.nextTry = now + exhaustSec * 1000;
        ttl = exhaustSec;
        break;
      }
      case "server":
      case "timeout": {
        rec.consecutiveServerErrors++;
        if (rec.consecutiveServerErrors >= thresholds.maxConsecutiveServerErrors) {
          const cd = thresholds.repeatedServerErrorCooldownSec; // 15 min
          rec.state = "COOLDOWN";
          rec.nextTry = now + cd * 1000;
          ttl = cd;
        } else {
          const cd = thresholds.serverErrorCooldownSec; // 2 min
          rec.state = "COOLDOWN";
          rec.nextTry = now + cd * 1000;
          ttl = cd;
        }
        break;
      }
      case "auth": {
        const cd = thresholds.authErrorProbeIntervalSec; // 1 hour
        rec.state = "DISABLED";
        rec.nextTry = now + cd * 1000;
        ttl = cd;
        break;
      }
    }

    await this.setRecord(id, rec, ttl);
  }

  async earliestRetryAt(): Promise<number | undefined> {
    let earliest: number | undefined = undefined;
    for (const [, rec] of this.inMemoryHealth) {
      if (rec.nextTry > 0) {
        if (earliest === undefined || rec.nextTry < earliest) {
          earliest = rec.nextTry;
        }
      }
    }
    return earliest;
  }

  reset(): void {
    this.inMemoryHealth.clear();
  }
}
