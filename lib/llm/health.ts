import { BOT_CONFIG } from "../config";
import { QuotaError } from "./types";
import { getEnv } from "../env";

export type HealthState = "HEALTHY" | "COOLDOWN" | "EXHAUSTED" | "DISABLED";

export interface ProviderHealthRecord {
  state: HealthState;
  nextTry: number;
  consecutiveServerErrors: number;
}

// In-memory fallback
const inMemoryHealth = new Map<string, ProviderHealthRecord>();

function getRedisConfig() {
  try {
    const env = getEnv();
    if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
      return { url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN };
    }
  } catch {
    // env not loaded or invalid
  }
  return null;
}

export const health = {
  async getRecord(id: string): Promise<ProviderHealthRecord> {
    const redis = getRedisConfig();
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

    const rec = inMemoryHealth.get(id);
    if (!rec) {
      const defaultRec: ProviderHealthRecord = {
        state: "HEALTHY",
        nextTry: 0,
        consecutiveServerErrors: 0,
      };
      inMemoryHealth.set(id, defaultRec);
      return defaultRec;
    }
    return rec;
  },

  async setRecord(id: string, rec: ProviderHealthRecord, ttlSec?: number): Promise<void> {
    inMemoryHealth.set(id, rec);

    const redis = getRedisConfig();
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
  },

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
  },

  async markOk(id: string): Promise<void> {
    const rec = await this.getRecord(id);
    rec.state = "HEALTHY";
    rec.nextTry = 0;
    rec.consecutiveServerErrors = 0;
    await this.setRecord(id, rec);
  },

  async mark(id: string, error: QuotaError, now = Date.now()): Promise<void> {
    const rec = await this.getRecord(id);
    let ttl = 60;

    switch (error.kind) {
      case "rate": {
        const retrySec = error.retryAfterSec && error.retryAfterSec > 0 ? error.retryAfterSec : 60;
        rec.state = "COOLDOWN";
        rec.nextTry = now + retrySec * 1000;
        ttl = retrySec;
        break;
      }
      case "daily": {
        const exhaustHours = BOT_CONFIG.thresholds.defaultExhaustedHours;
        const exhaustSec = exhaustHours * 3600;
        rec.state = "EXHAUSTED";
        rec.nextTry = now + exhaustSec * 1000;
        ttl = exhaustSec;
        break;
      }
      case "server":
      case "timeout": {
        rec.consecutiveServerErrors++;
        if (rec.consecutiveServerErrors >= BOT_CONFIG.thresholds.maxConsecutiveServerErrors) {
          const cd = BOT_CONFIG.thresholds.repeatedServerErrorCooldownSec; // 15 min
          rec.state = "COOLDOWN";
          rec.nextTry = now + cd * 1000;
          ttl = cd;
        } else {
          const cd = BOT_CONFIG.thresholds.serverErrorCooldownSec; // 2 min
          rec.state = "COOLDOWN";
          rec.nextTry = now + cd * 1000;
          ttl = cd;
        }
        break;
      }
      case "auth": {
        const cd = BOT_CONFIG.thresholds.authErrorProbeIntervalSec; // 1 hour
        rec.state = "DISABLED";
        rec.nextTry = now + cd * 1000;
        ttl = cd;
        break;
      }
    }

    await this.setRecord(id, rec, ttl);
  },

  async earliestRetryAt(): Promise<number | undefined> {
    let earliest: number | undefined = undefined;
    for (const [, rec] of inMemoryHealth) {
      if (rec.nextTry > 0) {
        if (earliest === undefined || rec.nextTry < earliest) {
          earliest = rec.nextTry;
        }
      }
    }
    return earliest;
  },

  reset(): void {
    inMemoryHealth.clear();
  },
};
