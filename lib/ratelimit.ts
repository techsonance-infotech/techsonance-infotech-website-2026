import { getEnv } from "./env";

interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
}

interface Bucket {
  tokens: number;
  lastRefill: number;
}

const memoryBuckets = new Map<string, Bucket>();

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<{ success: boolean; remaining: number; retryAfter?: number }> {
  try {
    const env = getEnv();
    if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
      // Use Upstash Redis REST API for atomic sliding window increment
      const redisKey = `ratelimit:${key}`;
      const url = env.UPSTASH_REDIS_REST_URL;
      const token = env.UPSTASH_REDIS_REST_TOKEN;

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
          // Set expiry if key had no TTL
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
  let bucket = memoryBuckets.get(key);

  if (!bucket) {
    bucket = { tokens: config.maxRequests, lastRefill: now };
    memoryBuckets.set(key, bucket);
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

export function getClientIp(req: Request): string {
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
