import "server-only";
import { inject } from "@needle-di/core";
import { ENV_CONFIG_TOKEN } from "../di/tokens";
import type { Env } from "../env";

export interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  retryAfter?: number;
}

interface Bucket {
  tokens: number;
  lastRefill: number;
}

export class RateLimiterService {
  private memoryBuckets = new Map<string, Bucket>();

  constructor(private env: Env = inject(ENV_CONFIG_TOKEN)) {}

  async check(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    try {
      if (this.env.UPSTASH_REDIS_REST_URL && this.env.UPSTASH_REDIS_REST_TOKEN) {
        const redisKey = `ratelimit:${key}`;
        const url = this.env.UPSTASH_REDIS_REST_URL;
        const token = this.env.UPSTASH_REDIS_REST_TOKEN;

        const pipelineRes = await fetch(`${url}/pipeline`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify([
            ["INCR", redisKey],
            ["TTL", redisKey],
          ]),
        });

        if (pipelineRes.ok) {
          const results = await pipelineRes.json();
          const currentCount = results[0]?.result ?? 1;
          let ttl = results[1]?.result ?? config.windowSeconds;

          if (ttl === -1) {
            await fetch(`${url}/expire/${redisKey}/${config.windowSeconds}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            ttl = config.windowSeconds;
          }

          if (currentCount > config.maxRequests) {
            return { success: false, remaining: 0, retryAfter: Math.max(1, ttl) };
          }
          return {
            success: true,
            remaining: Math.max(0, config.maxRequests - currentCount),
          };
        }
      }
    } catch {
      // Fall back to memory bucket on Redis error or missing configuration
    }

    // Token Bucket In-Memory Fallback
    const now = Date.now();

    // Memory hygiene: prune stale buckets when map exceeds threshold
    if (this.memoryBuckets.size > 2000) {
      const maxAgeMs = 30 * 60 * 1000;
      for (const [k, b] of this.memoryBuckets.entries()) {
        if (now - b.lastRefill > maxAgeMs) {
          this.memoryBuckets.delete(k);
        }
      }
    }

    let bucket = this.memoryBuckets.get(key);

    if (!bucket) {
      bucket = { tokens: config.maxRequests, lastRefill: now };
      this.memoryBuckets.set(key, bucket);
    }

    const refillRate = config.maxRequests / (config.windowSeconds * 1000);
    const elapsed = now - bucket.lastRefill;
    bucket.tokens = Math.min(config.maxRequests, bucket.tokens + elapsed * refillRate);
    bucket.lastRefill = now;

    if (bucket.tokens < 1) {
      const timeNeededMs = (1 - bucket.tokens) / refillRate;
      const retryAfter = Math.ceil(timeNeededMs / 1000);
      return { success: false, remaining: 0, retryAfter };
    }

    bucket.tokens -= 1;
    return { success: true, remaining: Math.floor(bucket.tokens) };
  }

  getClientIp(req: Request): string {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }
    const realIp = req.headers.get("x-real-ip");
    if (realIp) {
      return realIp.trim();
    }
    return "127.0.0.1";
  }

  reset(): void {
    this.memoryBuckets.clear();
  }
}
