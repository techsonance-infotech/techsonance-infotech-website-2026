import { describe, it, expect } from "vitest";
import { getContainer, createTestContainer } from "../lib/di/container";
import { BOT_CONFIG_TOKEN, ENV_CONFIG_TOKEN } from "../lib/di/tokens";
import { RateLimiterService } from "../lib/services/ratelimit.service";

describe("Needle DI Container Infrastructure", () => {
  it("should initialize root container and provide configuration tokens", () => {
    const container = getContainer();
    expect(container).toBeDefined();

    const botConfig = container.get(BOT_CONFIG_TOKEN);
    expect(botConfig).toBeDefined();
    expect(botConfig.thresholds).toBeDefined();

    const env = container.get(ENV_CONFIG_TOKEN);
    expect(env).toBeDefined();
  });

  it("should support test container isolation and token overrides", () => {
    const customToken = BOT_CONFIG_TOKEN;
    const testContainer = createTestContainer([
      { provide: customToken, useValue: { mocked: true } as any },
    ]);
    expect((testContainer.get(customToken) as any).mocked).toBe(true);

    // Root container must remain unchanged
    const rootConfig = getContainer().get(BOT_CONFIG_TOKEN);
    expect((rootConfig as any).mocked).toBeUndefined();
  });

  it("should resolve RateLimiterService and rate limit requests correctly", async () => {
    const container = getContainer();
    const rateLimiter = container.get(RateLimiterService);
    expect(rateLimiter).toBeInstanceOf(RateLimiterService);

    const testKey = "test-ip-key";
    const cfg = { maxRequests: 2, windowSeconds: 60 };

    const r1 = await rateLimiter.check(testKey, cfg);
    expect(r1.success).toBe(true);
    expect(r1.remaining).toBe(1);

    const r2 = await rateLimiter.check(testKey, cfg);
    expect(r2.success).toBe(true);
    expect(r2.remaining).toBe(0);

    const r3 = await rateLimiter.check(testKey, cfg);
    expect(r3.success).toBe(false);
    expect(r3.retryAfter).toBeGreaterThan(0);
  });
});
