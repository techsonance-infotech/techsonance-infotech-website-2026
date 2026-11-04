import { describe, it, expect } from "vitest";
import { getContainer, createTestContainer } from "../lib/di/container";
import { BOT_CONFIG_TOKEN, ENV_CONFIG_TOKEN } from "../lib/di/tokens";
import { RateLimiterService } from "../lib/services/ratelimit.service";
import { EmailService } from "../lib/services/email.service";
import { BookingService } from "../lib/services/booking.service";
import { RAGService } from "../lib/services/rag.service";
import { LLMRouterService } from "../lib/services/llm-router.service";

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

  it("should resolve RAGService and LLMRouterService", () => {
    const container = getContainer();
    const ragService = container.get(RAGService);
    const routerService = container.get(LLMRouterService);

    expect(ragService).toBeInstanceOf(RAGService);
    expect(routerService).toBeInstanceOf(LLMRouterService);

    const gateResult = ragService.evaluateGate("hello");
    expect(gateResult.decision).toBe("GREETING");
  });
});
