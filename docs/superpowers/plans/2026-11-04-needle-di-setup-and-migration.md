# Needle DI Setup and Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a type-safe Dependency Injection architecture using `@needle-di/core` and migrate core stateful/IO services (Rate Limiting, Email, Booking, RAG, and LLM Routing) along with API routes.

**Architecture:** A centralized Needle DI root container (`lib/di/container.ts`) binds injectable services and config tokens. Services use ECMAScript stage 3 decorators (`@injectable()`) and constructor injection (`inject(...)`). Existing module exports (`lib/email.ts`, `lib/ratelimit.ts`) remain backward-compatible by delegating to the container, and Next.js route handlers (`app/api/*`) resolve services via `getContainer()`.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest, `@needle-di/core` v1.2.1, Nodemailer, Upstash Redis.

**Spec:** `docs/superpowers/specs/2026-11-04-needle-di-setup-and-migration-design.md`

## Global Constraints

- Target TypeScript compiler / runtime: ECMAScript Stage 3 native decorators (zero `reflect-metadata` requirement).
- No breaking changes to existing public contracts or tests in `tests/`.
- All tests must pass: `npm test`.
- All types must pass: `npm run typecheck`.

---

### Task 1: Prerequisite Fix - Next.js 16 Config Deprecation

**Files:**

- Modify: `next.config.ts:3-7`

**Interfaces:**

- Removes deprecated `eslint` option which fails under Next.js 16 `typecheck`.

- [ ] **Step 1: Verify typecheck failure**
      Run: `npm run typecheck`
      Expected: error TS2353: Object literal may only specify known properties, and 'eslint' does not exist in type 'NextConfig'.

- [ ] **Step 2: Remove deprecated `eslint` config from `next.config.ts`**
      Remove:

```typescript
  eslint: {
    ignoreDuringBuilds: true,
  },
```

- [ ] **Step 3: Run typecheck to verify fix**
      Run: `npm run typecheck`
      Expected: PASS (0 errors)

- [ ] **Step 4: Commit**

```bash
git add next.config.ts
git commit -m "fix(config): remove deprecated eslint field from next.config.ts"
```

---

### Task 2: Needle DI Tokens and Container Infrastructure

**Files:**

- Create: `lib/di/tokens.ts`
- Create: `lib/di/container.ts`
- Test: `tests/di.test.ts`

**Interfaces:**

- Produces:
  - `ENV_CONFIG_TOKEN`: `InjectionToken<EnvConfig>`
  - `BOT_CONFIG_TOKEN`: `InjectionToken<typeof BOT_CONFIG>`
  - `getContainer()`: `() => Container`
  - `createTestContainer(overrides?: Provider[])`: `(overrides?: Provider[]) => Container`

- [ ] **Step 1: Write failing test in `tests/di.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { getContainer, createTestContainer } from "../lib/di/container";
import { BOT_CONFIG_TOKEN, ENV_CONFIG_TOKEN } from "../lib/di/tokens";

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
});
```

- [ ] **Step 2: Run test to verify it fails**
      Run: `npx vitest run tests/di.test.ts`
      Expected: FAIL (cannot find module `../lib/di/container`)

- [ ] **Step 3: Create `lib/di/tokens.ts` and `lib/di/container.ts`**

In `lib/di/tokens.ts`:

```typescript
import { InjectionToken } from "@needle-di/core";
import { BOT_CONFIG } from "../config";
import type { Env } from "../env";

export const BOT_CONFIG_TOKEN = new InjectionToken<typeof BOT_CONFIG>("BOT_CONFIG_TOKEN");
export const ENV_CONFIG_TOKEN = new InjectionToken<Env>("ENV_CONFIG_TOKEN");
```

In `lib/di/container.ts`:

```typescript
import { Container, type Provider } from "@needle-di/core";
import { BOT_CONFIG } from "../config";
import { getEnv } from "../env";
import { BOT_CONFIG_TOKEN, ENV_CONFIG_TOKEN } from "./tokens";

let rootContainer: Container | null = null;

export function configureContainer(container: Container): Container {
  container.bind({ provide: BOT_CONFIG_TOKEN, useValue: BOT_CONFIG });
  container.bind({ provide: ENV_CONFIG_TOKEN, useFactory: () => getEnv() });
  return container;
}

export function getContainer(): Container {
  if (!rootContainer) {
    rootContainer = new Container();
    configureContainer(rootContainer);
  }
  return rootContainer;
}

export function createTestContainer(overrides: Provider[] = []): Container {
  const container = new Container();
  configureContainer(container);
  for (const provider of overrides) {
    container.bind(provider);
  }
  return container;
}

export function resetRootContainer(): void {
  rootContainer = null;
}
```

- [ ] **Step 4: Run test to verify it passes**
      Run: `npx vitest run tests/di.test.ts`
      Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/di/ tests/di.test.ts
git commit -m "feat(di): setup needle di container and config tokens"
```

---

### Task 3: RateLimiterService Implementation

**Files:**

- Create: `lib/services/ratelimit.service.ts`
- Modify: `lib/ratelimit.ts`
- Modify: `lib/di/container.ts`
- Test: `tests/di.test.ts`

**Interfaces:**

- Produces: `RateLimiterService`
  - `check(key: string, config: { maxRequests: number; windowSeconds: number }): Promise<{ success: boolean; remaining: number; retryAfter?: number }>`
  - `getClientIp(req: Request): string`
  - `reset(): void` (for testing)

- [ ] **Step 1: Add RateLimiterService tests to `tests/di.test.ts`**

```typescript
import { RateLimiterService } from "../lib/services/ratelimit.service";

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
```

- [ ] **Step 2: Run test to verify it fails**
      Run: `npx vitest run tests/di.test.ts`
      Expected: FAIL

- [ ] **Step 3: Implement `RateLimiterService` and bind in `container.ts`**

In `lib/services/ratelimit.service.ts`:
Create `@injectable()` `RateLimiterService` encapsulating Upstash Redis REST check and in-memory bucket fallback.
In `lib/ratelimit.ts`:
Export `checkRateLimit` and `getClientIp` delegating to `getContainer().get(RateLimiterService)` to preserve existing function signatures.
In `lib/di/container.ts`:
Bind `RateLimiterService`.

- [ ] **Step 4: Run tests to verify all rate limit and di tests pass**
      Run: `npx vitest run`
      Expected: PASS (all tests pass)

- [ ] **Step 5: Commit**

```bash
git add lib/services/ratelimit.service.ts lib/ratelimit.ts lib/di/ tests/di.test.ts
git commit -m "feat(di): implement injectable RateLimiterService"
```

---

### Task 4: EmailService Implementation

**Files:**

- Create: `lib/services/email.service.ts`
- Modify: `lib/email.ts`
- Modify: `lib/di/container.ts`
- Test: `tests/di.test.ts`

**Interfaces:**

- Produces: `EmailService`
  - `sendMail(options: { to: string; subject: string; text: string; html: string; replyTo?: string; attachments?: Array<{ filename: string; content: Buffer }> }): Promise<void>`
  - `sendConsultationEmails(booking: BookingPayload, ref: string): Promise<void>`
  - `createICSCalendar(booking: BookingPayload, ref: string): string`

- [ ] **Step 1: Add EmailService tests to `tests/di.test.ts`**

```typescript
import { EmailService } from "../lib/services/email.service";

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
    "TS-REF123",
  );

  expect(ics).toContain("BEGIN:VCALENDAR");
  expect(ics).toContain("TS-REF123");
});
```

- [ ] **Step 2: Run test to verify it fails**
      Run: `npx vitest run tests/di.test.ts`
      Expected: FAIL

- [ ] **Step 3: Implement `EmailService` and bind in `container.ts`**

In `lib/services/email.service.ts`:
Create `@injectable()` `EmailService` using native decorators and constructor injection of `ENV_CONFIG_TOKEN`.
In `lib/email.ts`:
Delegate `sendMail`, `sendConsultationEmails`, and `createICSCalendar` to `getContainer().get(EmailService)`.

- [ ] **Step 4: Run tests to verify all tests pass**
      Run: `npx vitest run`
      Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/services/email.service.ts lib/email.ts lib/di/container.ts tests/di.test.ts
git commit -m "feat(di): implement injectable EmailService"
```

---

### Task 5: BookingService Implementation

**Files:**

- Create: `lib/services/booking.service.ts`
- Modify: `lib/di/container.ts`
- Test: `tests/di.test.ts`

**Interfaces:**

- Consumes: `EmailService` via `inject(EmailService)`
- Produces: `BookingService`
  - `getAvailableSlots(fromTimestamp?: number): Slot[]`
  - `validateSlot(slotIso: string): boolean`
  - `processBooking(payload: BookingPayload): Promise<{ success: boolean; ref: string }>`

- [ ] **Step 1: Add BookingService tests in `tests/di.test.ts`**

```typescript
import { BookingService } from "../lib/services/booking.service";

it("should resolve BookingService with injected EmailService", async () => {
  let emailSent = false;
  const testContainer = createTestContainer([
    {
      provide: EmailService,
      useValue: {
        createICSCalendar: () => "mock-ics",
        sendConsultationEmails: async () => {
          emailSent = true;
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
```

- [ ] **Step 2: Run test to verify it fails**
      Run: `npx vitest run tests/di.test.ts`
      Expected: FAIL

- [ ] **Step 3: Implement `BookingService` and bind in `container.ts`**

In `lib/services/booking.service.ts`:
Create `@injectable()` `BookingService` injecting `EmailService`.
In `lib/di/container.ts`:
Bind `BookingService`.

- [ ] **Step 4: Run test to verify it passes**
      Run: `npx vitest run tests/di.test.ts`
      Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/services/booking.service.ts lib/di/container.ts tests/di.test.ts
git commit -m "feat(di): implement injectable BookingService"
```

---

### Task 6: RAGService and LLMRouterService Implementation

**Files:**

- Create: `lib/services/rag.service.ts`
- Create: `lib/services/llm-router.service.ts`
- Modify: `lib/di/container.ts`
- Test: `tests/di.test.ts`

**Interfaces:**

- Produces: `RAGService`
  - `evaluateGate(query: string): GateResult`
  - `search(query: string, k?: number): RetrievedChunk[]`
- Produces: `LLMRouterService`
  - `routeChat(req: LLMChatRequest, customProviders?: LLMProvider[]): AsyncIterable<string>`

- [ ] **Step 1: Add RAGService and LLMRouterService tests in `tests/di.test.ts`**

```typescript
import { RAGService } from "../lib/services/rag.service";
import { LLMRouterService } from "../lib/services/llm-router.service";

it("should resolve RAGService and LLMRouterService", () => {
  const container = getContainer();
  const ragService = container.get(RAGService);
  const routerService = container.get(LLMRouterService);

  expect(ragService).toBeInstanceOf(RAGService);
  expect(routerService).toBeInstanceOf(LLMRouterService);

  const gateResult = ragService.evaluateGate("hello");
  expect(gateResult.decision).toBe("GREETING");
});
```

- [ ] **Step 2: Run test to verify it fails**
      Run: `npx vitest run tests/di.test.ts`
      Expected: FAIL

- [ ] **Step 3: Implement `RAGService` and `LLMRouterService` and bind in `container.ts`**

In `lib/services/rag.service.ts`:
Create `@injectable()` `RAGService` calling `evaluateGate` and `retrieve`.
In `lib/services/llm-router.service.ts`:
Create `@injectable()` `LLMRouterService` calling `routeChat`.
In `lib/di/container.ts`:
Bind `RAGService` and `LLMRouterService`.

- [ ] **Step 4: Run test to verify it passes**
      Run: `npx vitest run tests/di.test.ts`
      Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/services/rag.service.ts lib/services/llm-router.service.ts lib/di/container.ts tests/di.test.ts
git commit -m "feat(di): implement injectable RAGService and LLMRouterService"
```

---

### Task 7: Route Handlers Migration

**Files:**

- Modify: `app/api/contact/route.ts`
- Modify: `app/api/careers/route.ts`
- Modify: `app/api/book/route.ts`
- Modify: `app/api/chat/route.ts`

**Interfaces:**

- Consumes: `getContainer()` to resolve `RateLimiterService`, `EmailService`, `BookingService`, `RAGService`, `LLMRouterService`.

- [ ] **Step 1: Migrate `app/api/contact/route.ts`**
      Remove local `ipCache` and duplicate rate limiting.
      Inject `RateLimiterService` and `EmailService`:

```typescript
const container = getContainer();
const rateLimiter = container.get(RateLimiterService);
const emailService = container.get(EmailService);
```

- [ ] **Step 2: Migrate `app/api/careers/route.ts`**
      Resolve `EmailService` via `getContainer().get(EmailService)`:

```typescript
const container = getContainer();
const emailService = container.get(EmailService);
await emailService.sendMail({ ... });
```

- [ ] **Step 3: Migrate `app/api/book/route.ts`**
      Resolve `RateLimiterService` and `BookingService`:

```typescript
const container = getContainer();
const rateLimiter = container.get(RateLimiterService);
const bookingService = container.get(BookingService);
```

- [ ] **Step 4: Migrate `app/api/chat/route.ts`**
      Resolve `RateLimiterService`, `RAGService`, and `LLMRouterService`.

- [ ] **Step 5: Run tests to verify no regressions**
      Run: `npx vitest run`
      Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add app/api/
git commit -m "refactor(api): migrate route handlers to Needle DI container"
```

---

### Task 8: End-to-End Verification and Cleanup

**Files:**

- All modified files

- [ ] **Step 1: Run full Vitest suite**
      Run: `npm test`
      Expected: All test suites PASS (106+ tests)

- [ ] **Step 2: Run full TypeScript check**
      Run: `npm run typecheck`
      Expected: 0 errors

- [ ] **Step 3: Run linter**
      Run: `npm run lint`
      Expected: 0 errors

- [ ] **Step 4: Final commit**

```bash
git commit --allow-empty -m "chore: complete needle di setup and migration"
```
