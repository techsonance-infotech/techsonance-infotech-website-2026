import { describe, it, expect } from "vitest";
import { getContainer, createTestContainer } from "../lib/di/container";
import { BOT_CONFIG_TOKEN, ENV_CONFIG_TOKEN } from "../lib/di/tokens";
import { RateLimiterService } from "../lib/services/ratelimit.service";
import { EmailService } from "../lib/services/email.service";
import { BookingService } from "../lib/services/booking.service";
import { RAGService } from "../lib/services/rag.service";
import { LLMHealthService } from "../lib/services/llm-health.service";
import { LLMProviderService } from "../lib/services/llm-provider.service";
import { LLMRouterService } from "../lib/services/llm-router.service";
import { QuotaError } from "../lib/llm/types";

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

  it("should resolve EmailService and generate valid ICS calendar invites", () => {
    const container = getContainer();
    const emailService = container.get(EmailService);
    expect(emailService).toBeInstanceOf(EmailService);

    const ics = emailService.createICSCalendar(
      {
        name: "John Doe",
        email: "john@example.com",
        projectType: "Web App",
        budgetRange: "$10k+",
        timeline: "1 Month",
        slotIso: new Date(Date.now() + 86400000).toISOString(),
        visitorTimezone: "Asia/Kolkata",
      },
      "TS-REF123"
    );

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("TS-REF123");
  });

  it("should resolve BookingService with injected EmailService", async () => {
    let emailSent = false;
    const testContainer = createTestContainer([
      {
        provide: EmailService,
        useValue: {
          createICSCalendar: () => "mock-ics",
          sendConsultationEmails: async () => {
            emailSent = true;
            return { ok: true };
          },
        } as any,
      },
      BookingService,
    ]);

    const bookingService = testContainer.get(BookingService);
    const slots = bookingService.getAvailableSlots();
    expect(slots.length).toBeGreaterThan(0);

    const result = await bookingService.processBooking({
      name: "Alice",
      email: "alice@example.com",
      projectType: "Mobile",
      budgetRange: "$15k",
      timeline: "2 Months",
      slotIso: slots[5].iso,
      visitorTimezone: "UTC",
    });

    expect(result.success).toBe(true);
    expect(result.ref).toMatch(/^TS-[A-Z0-9]+$/);
    expect(emailSent).toBe(true);
  });

  it("should resolve RAGService and return valid gate decision and KB stats", () => {
    const container = getContainer();
    const ragService = container.get(RAGService);
    expect(ragService).toBeInstanceOf(RAGService);

    const gateResult = ragService.evaluateGate("hello");
    expect(gateResult.decision).toBe("GREETING");

    const kbStats = ragService.getKBStats();
    expect(kbStats.totalChunks).toBeGreaterThan(0);
    expect(kbStats.faqCount).toBeGreaterThan(0);
  });

  it("should resolve LLMHealthService and track provider states", async () => {
    const container = getContainer();
    const healthService = container.get(LLMHealthService);
    expect(healthService).toBeInstanceOf(LLMHealthService);

    const testProviderId = "test-provider";
    const initialUsable = await healthService.isUsable(testProviderId);
    expect(initialUsable).toBe(true);

    await healthService.mark(testProviderId, new QuotaError("rate", 60, "Rate limited"));
    const postMarkUsable = await healthService.isUsable(testProviderId);
    expect(postMarkUsable).toBe(false);

    await healthService.markOk(testProviderId);
    const resetUsable = await healthService.isUsable(testProviderId);
    expect(resetUsable).toBe(true);
  });

  it("should resolve LLMProviderService and provide ordered providers", () => {
    const container = getContainer();
    const providerService = container.get(LLMProviderService);
    expect(providerService).toBeInstanceOf(LLMProviderService);

    const providers = providerService.getProviders();
    expect(providers.length).toBeGreaterThan(0);
    expect(providers.map((p) => p.id)).toContain("groq");
  });

  it("should resolve LLMRouterService with injected health and provider services", async () => {
    const testContainer = createTestContainer([
      {
        provide: LLMHealthService,
        useValue: {
          isUsable: async () => true,
          markOk: async () => {},
          mark: async () => {},
          earliestRetryAt: async () => undefined,
        } as any,
      },
      {
        provide: LLMProviderService,
        useValue: {
          getProviders: () => [
            {
              id: "mock-llm",
              name: "Mock LLM",
              enabled: () => true,
              chat: async function* () {
                yield "Hello";
                yield " ";
                yield "World";
              },
            },
          ],
        } as any,
      },
      LLMRouterService,
    ]);

    const router = testContainer.get(LLMRouterService);
    expect(router).toBeInstanceOf(LLMRouterService);

    let output = "";
    for await (const chunk of router.routeChat({
      messages: [{ role: "user", content: "Hi" }],
    })) {
      output += chunk;
    }

    expect(output).toBe("Hello World");
  });
});
