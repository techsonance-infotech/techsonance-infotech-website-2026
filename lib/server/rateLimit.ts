import "server-only";
import { AppError } from "@/lib/errors";
import { checkRateLimit, type RateLimitConfig } from "@/lib/ratelimit";

export type RateLimitPolicy = {
  key: string;
  limit: number;
  windowSec: number;
};

export async function enforceRateLimit(policy: RateLimitPolicy, identifier: string): Promise<void> {
  const config: RateLimitConfig = {
    maxRequests: policy.limit,
    windowSeconds: policy.windowSec,
  };
  const rateLimitKey = `${policy.key}:${identifier}`;
  const res = await checkRateLimit(rateLimitKey, config);

  if (!res.success) {
    const retryAfterSec = res.retryAfter ?? 1;
    throw new AppError("RATE_LIMITED", "Too many requests. Please slow down.", {
      retryAfterSec,
    });
  }
}
