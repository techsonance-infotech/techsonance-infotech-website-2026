import { getContainer } from "./di/container";
import { RateLimiterService, type RateLimitConfig, type RateLimitResult } from "./services/ratelimit.service";

export type { RateLimitConfig, RateLimitResult };

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const service = getContainer().get(RateLimiterService);
  return service.check(key, config);
}

export function getClientIp(req: Request): string {
  const service = getContainer().get(RateLimiterService);
  return service.getClientIp(req);
}
