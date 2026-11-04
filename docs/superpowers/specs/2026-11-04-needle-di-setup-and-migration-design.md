# Needle DI Setup and Migration Design Spec

## 1. Overview
This specification details the setup of **Needle DI** (`@needle-di/core`) and the incremental migration of core I/O and stateful services in the TechSonance Next.js application.

The goal is to replace ad-hoc module singletons and duplicate implementations (such as in-memory rate limiting and nodemailer transports) with type-safe, decoupled, and testable dependency-injected services using ECMAScript native decorators.

## 2. Goals & Non-Goals
### Goals
- Centralize dependency management using `@needle-di/core`.
- Provide a robust root container with testable override capabilities (`createTestContainer`).
- Migrate key stateful and I/O services into `@injectable()` classes:
  - `RateLimiterService`: Unifies Upstash Redis & in-memory sliding window rate limiting.
  - `EmailService`: Centralizes nodemailer transport creation, HTML/text templates, and `.ics` calendar generation.
  - `BookingService`: Handles consultation slot validation and confirmation email dispatch.
  - `RAGService`: Encapsulates MiniSearch index loading, query synonym expansion, and relevance gating.
  - `LLMRouterService`: Manages multi-provider LLM chat streaming and fallback handling.
- Migrate API route handlers (`/api/contact`, `/api/careers`, `/api/book`, `/api/chat`) to resolve dependencies via the container.
- Preserve backward-compatibility for existing module exports (e.g. `lib/email.ts`, `lib/ratelimit.ts`) by delegating to the container.
- Fix Next.js 16 build/typecheck deprecation in `next.config.ts`.

### Non-Goals
- Migrating stateless utility functions (e.g., text sanitizers, prompt formatting strings, SEO metadata maps) to DI classes.
- Introducing heavy reflection packages like `reflect-metadata` (Needle DI utilizes native Stage 3 decorators).

## 3. Architecture & File Structure

```
lib/
  di/
    tokens.ts          # Strongly typed InjectionTokens
    container.ts       # Root container initialization and createTestContainer helper
  services/
    ratelimit.service.ts  # RateLimiterService class
    email.service.ts      # EmailService class
    booking.service.ts    # BookingService class
    rag.service.ts        # RAGService class
    llm-router.service.ts # LLMRouterService class
  email.ts             # Backward-compatible wrapper delegating to EmailService
  ratelimit.ts         # Backward-compatible wrapper delegating to RateLimiterService
  slots.ts             # Slots generation & validation utilities
app/api/
  contact/route.ts     # Migrated to RateLimiterService & EmailService
  careers/route.ts     # Migrated to EmailService
  book/route.ts        # Migrated to RateLimiterService & BookingService
  chat/route.ts        # Migrated to RateLimiterService, RAGService, LLMRouterService
tests/
  di.test.ts           # Verification test suite for Needle DI container and services
```

## 4. Detailed Component Design

### 4.1 Dependency Injection Module (`lib/di/`)
- **`tokens.ts`**:
  - `InjectionToken<T>` definitions:
    - `ENV_CONFIG_TOKEN`: configuration from `getEnv()`.
    - `BOT_CONFIG_TOKEN`: configuration from `BOT_CONFIG`.
- **`container.ts`**:
  - `getContainer()`: Lazily initializes the singleton `Container` instance and binds all providers.
  - `createTestContainer(overrides?: Provider[])`: Creates an isolated container with test mocks.

### 4.2 Services (`lib/services/`)
- **`RateLimiterService`**:
  - Injected with `BOT_CONFIG_TOKEN` and `ENV_CONFIG_TOKEN`.
  - Methods:
    - `check(key: string, config: { maxRequests: number; windowSeconds: number }): Promise<{ success: boolean; remaining: number; retryAfter?: number }>`
    - `getClientIp(req: Request): string`
  - Replaces inline IP caching in `/api/contact/route.ts`.
- **`EmailService`**:
  - Injected with `ENV_CONFIG_TOKEN`.
  - Methods:
    - `sendMail(options: { to: string; subject: string; text: string; html: string; replyTo?: string; attachments?: Array<{ filename: string; content: Buffer }> }): Promise<void>`
    - `sendConsultationEmails(booking: BookingPayload, ref: string): Promise<void>`
    - `createICSCalendar(booking: BookingPayload, ref: string): string`
- **`BookingService`**:
  - Injects `EmailService` via `inject(EmailService)`.
  - Methods:
    - `getAvailableSlots(fromTimestamp?: number): Slot[]`
    - `validateSlot(slotIso: string): boolean`
    - `processBooking(payload: BookingPayload): Promise<{ ref: string; success: boolean }>`
- **`RAGService`**:
  - Encapsulates KB index retrieval and gate evaluation.
  - Methods:
    - `evaluateGate(query: string): GateResult`
    - `search(query: string, k?: number): RetrievedChunk[]`
- **`LLMRouterService`**:
  - Encapsulates LLM provider chat streaming and failover.
  - Methods:
    - `routeChat(req: LLMChatRequest): AsyncIterable<string>`

### 4.3 Route Handlers Migration
- Update `POST` handlers in `app/api/contact`, `app/api/careers`, `app/api/book`, and `app/api/chat` to resolve services via `getContainer().get(...)`.
- Eliminate duplicated inline rate limiting logic from `app/api/contact/route.ts`.

### 4.4 Prerequisite Fix
- In `next.config.ts`, remove the deprecated `eslint: { ignoreDuringBuilds: true }` block which causes TypeScript error TS2353 under Next.js 16.

## 5. Testing & Verification Plan
- **Unit & Container Tests (`tests/di.test.ts`)**:
  - Verify container initialization and singleton instance retrieval.
  - Verify `BookingService` correctly receives and uses injected `EmailService`.
  - Verify `RateLimiterService` allows and blocks within window thresholds.
  - Verify `createTestContainer()` allows mock overrides without affecting root container.
- **Regression Tests**:
  - Run all existing Vitest test suites (`npm test`): `tests/booking.test.ts`, `tests/faq.test.ts`, `tests/gate.test.ts`, `tests/llm.test.ts`.
- **Type Checking**:
  - Run `npm run typecheck` to ensure 0 TypeScript errors across the whole project.
