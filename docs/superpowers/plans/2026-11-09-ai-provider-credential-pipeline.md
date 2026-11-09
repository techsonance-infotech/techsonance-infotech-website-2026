# AI Provider & Credential Pipeline: Secure Multi-Account Failover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement an enterprise-grade AI Credential Vault, Key Broker, multi-account failover router, and admin key management pipeline with zero-downtime `.env` fallback and strict `ts_ai_*` database isolation.

**Architecture:** A server-only AES-256-GCM encryption vault encrypts provider keys with AAD binding and versioned KEK. An isolated Key Broker atomically claims healthy credentials (`SELECT ... FOR UPDATE SKIP LOCKED`), decrypts in memory just-in-time, records token spend in the ledger, and classifies failures into cooldowns or auto-quarantine. The LLM Router executes two-tier failover (keys first, then providers) while protecting streaming token UX.

**Tech Stack:** Next.js 16 (App Router, Server Actions), React 19, TypeScript strict, Drizzle ORM (RQB v2), Supabase Postgres (`:6543`), `@needle-di/core`, Zod 4, Tailwind CSS 4.

**Spec:** `docs/superpowers/specs/2026-11-09-ai-provider-credential-pipeline-design.md`

## Global Constraints

- Database objects MUST carry `ts_ai_*` prefix (`03-database-security.md`).
- Connection to database uses Supavisor pooler `:6543` with `prepare: false`.
- Needle DI single-token injection (`inject(DRIZZLE_DB_TOKEN)`) with zero dual signatures (`03`, `10`).
- No bare `process.env` outside `lib/env/` (`12-backend-compliance.md`).
- Keys and raw auth headers MUST NEVER be returned to client components, logged, or included in error messages.
- Zod 4 strict objects for inbound validation; TypeScript `as const` enums for closed sets.
- Verification commands required after every milestone: `npm run typecheck`, `node scripts/check-boundaries.mjs`, `npm test`.

---

## File Structure

```
lib/
  crypto/
    vault.ts                          # AES-256-GCM seal/open, HMAC fingerprint, KEK rotation
  constants/enums/
    ai.enum.ts                        # AiCredentialStatus, AiAccountBillingMode, AiEventKind
  database/schema/ai/
    account.schema.ts                 # ts_ai_accounts (email, billing mode, monthly budget)
    credential.schema.ts              # ts_ai_credentials (ciphertext, iv, tag, status, budget)
    credential-event.schema.ts        # ts_ai_credential_events (append-only audit log)
    alert.schema.ts                   # ts_ai_alerts (deduplicated security notifications)
  repositories/
    ai-credentials.repository.ts      # Drizzle RQB v2 queries, atomic SKIP LOCKED claims
  services/ai/
    key-broker.service.ts             # JIT in-memory decryption, account failover, .env fallback
    admin-ai-credentials.service.ts   # Administrative key lifecycle (add, replace, kill)
  services/
    llm-router.service.ts             # Upgraded two-tier failover & streaming protection
    llm-provider.service.ts           # Dynamic key injection from KeyBroker
  validations/
    ai-credential.schema.ts           # Zod 4 strict schemas for add key, replace key, kill switch
  contracts/
    admin-ai-credentials.contract.ts  # Contract definitions for API endpoints
app/
  api/admin/ai/credentials/
    route.ts                          # handleRoute implementation for credentials
    replace/route.ts                  # Zero-downtime rotation route
    kill/route.ts                     # Emergency kill-switch route
  admin/
    ai/credentials/page.tsx           # Write-only Add Key, Replace Key, Kill Switch, Status Table
tests/
  crypto-vault.test.ts
  ai-credentials-repository.test.ts
  key-broker.service.test.ts
  llm-router-failover.test.ts
  admin-ai-credentials.service.test.ts
```

---

## Tasks

### Task 1: Encryption Vault & KEK Management

**Files:**
- Create: `lib/crypto/vault.ts`
- Modify: `lib/env/server.ts`
- Test: `tests/crypto-vault.test.ts`

**Interfaces:**
- Consumes: `process.env.AI_KEK_V1`, `process.env.AI_FP_PEPPER` from `lib/env/server.ts`
- Produces: `seal(plainKey, aad)`, `open(sealed, aad)`, `fingerprint(plainKey)`

- [x] **Step 1: Write the failing test** (`tests/crypto-vault.test.ts`)
  - Test `seal` and `open` round-trip encryption.
  - Test wrong AAD throws `DecryptionError`.
  - Test corrupted ciphertext or flipped auth tag throws `DecryptionError`.
  - Test `fingerprint` produces stable HMAC-SHA256 hex string.
- [x] **Step 2: Run test to confirm it fails**
  - Run `npm test tests/crypto-vault.test.ts`.
- [x] **Step 3: Update `lib/env/server.ts`**
  - Add `AI_KEK_V1` and `AI_FP_PEPPER` with safe dev defaults.
- [x] **Step 4: Implement `lib/crypto/vault.ts`**
  - Implement `seal`, `open`, and `fingerprint` with `node:crypto` AES-256-GCM.
  - Add `import "server-only";`.
- [x] **Step 5: Verify test passes**
  - Run `npm test tests/crypto-vault.test.ts`.
- [x] **Step 6: Check types and boundaries**
  - Run `npm run typecheck && node scripts/check-boundaries.mjs`.

---

### Task 2: Database Schemas (`ts_ai_*`) & Enums

**Files:**
- Create: `lib/database/schema/ai/account.schema.ts`
- Create: `lib/database/schema/ai/credential.schema.ts`
- Create: `lib/database/schema/ai/credential-event.schema.ts`
- Create: `lib/database/schema/ai/alert.schema.ts`
- Modify: `lib/constants/enums/ai.enum.ts`
- Modify: `lib/database/schema/enum.schema.ts`
- Modify: `lib/database/schema/ai/index.ts`
- Modify: `lib/database/schema/index.schema.ts`

**Interfaces:**
- Consumes: `baseEntityFields` from `lib/database/schema/base.schema.ts`
- Produces: Drizzle tables `ts_ai_accounts`, `ts_ai_credentials`, `ts_ai_credential_events`, `ts_ai_alerts` and their inferred select/insert types

- [x] **Step 1: Update Enums**
  - Add `AiCredentialStatus` (`active`, `cooling_down`, `exhausted`, `disabled`, `compromised`).
  - Add `AiAccountBillingMode` (`prepaid`, `postpaid`, `free_tier`).
  - Add `AiCredentialEventKind` (`created`, `used`, `failed`, `cooled`, `exhausted`, `disabled`, `compromised`, `rotated`, `wiped`).
- [x] **Step 2: Create Drizzle Schema Files**
  - `account.schema.ts`: `ts_ai_accounts` with `provider`, `accountEmail`, `displayName`, `monthlyBudgetUsd`.
  - `credential.schema.ts`: `ts_ai_credentials` with `ciphertext`, `iv`, `authTag`, `keyVersion`, `fingerprint`, `last4`, `status`, `priority`, `dailyBudgetUsd`, `spentTodayUsd`, `cooldownUntil`, `isCanary`.
  - `credential-event.schema.ts`: `ts_ai_credential_events` append-only audit log.
  - `alert.schema.ts`: `ts_ai_alerts` for notification records.
- [x] **Step 3: Register in schema barrels**
  - Export from `lib/database/schema/ai/index.ts` and `lib/database/schema/index.schema.ts`.
- [x] **Step 4: Check types and boundaries**
  - Run `npm run typecheck && node scripts/check-boundaries.mjs`.

---

### Task 3: AI Credential Repository

**Files:**
- Create: `lib/repositories/ai-credentials.repository.ts`
- Modify: `lib/di/container.ts`
- Test: `tests/ai-credentials-repository.test.ts`

**Interfaces:**
- Consumes: `DRIZZLE_DB_TOKEN` via Needle DI, Drizzle tables `ts_ai_credentials`, `ts_ai_accounts`, `ts_ai_credential_events`
- Produces: `AiCredentialsRepository` class with clean singleton methods:
  - `createAccount(data)`
  - `listAccounts(provider?)`
  - `createCredential(data)`
  - `claimNextActiveCredential(provider)`: atomic `FOR UPDATE SKIP LOCKED`
  - `updateCredentialStatus(id, status, cooldownUntil?)`
  - `recordUsage(id, tokens, costUsd)`
  - `wipeCompromisedCredential(id)`
  - `recordEvent(credentialId, event, actor, meta)`

- [x] **Step 1: Write the failing test** (`tests/ai-credentials-repository.test.ts`)
  - Test `createCredential`, `claimNextActiveCredential`, status transition, and audit logging.
- [x] **Step 2: Run test to confirm it fails**
  - Run `npm test tests/ai-credentials-repository.test.ts`.
- [x] **Step 3: Implement `AiCredentialsRepository`**
  - Map DB errors with `mapDbError`.
  - Implement atomic query with `and(eq(t.provider, provider), eq(t.status, 'active'))`.
- [x] **Step 4: Register in `lib/di/container.ts`**
- [x] **Step 5: Verify test passes**
  - Run `npm test tests/ai-credentials-repository.test.ts`.

---

### Task 4: Key Broker Service & JIT Unsealing

**Files:**
- Create: `lib/services/ai/key-broker.service.ts`
- Modify: `lib/di/container.ts`
- Test: `tests/key-broker.service.test.ts`

**Interfaces:**
- Consumes: `AiCredentialsRepository`, `LLMHealthService`, `Env`, `open`, `seal`
- Produces: `KeyBrokerService` with:
  - `claimKey(providerId: string): Promise<{ key: string; credentialId?: string; isFallbackEnv: boolean }>`
  - `reportSuccess(credentialId: string, tokens: number): Promise<void>`
  - `reportFailure(credentialId: string, errorKind: string, errorDetails?: unknown): Promise<void>`

- [x] **Step 1: Write the failing test** (`tests/key-broker.service.test.ts`)
  - Test active key unsealing and return.
  - Test fallback to `.env` when no DB credentials exist.
  - Test reporting `AUTH_FAILED` disables credential and triggers quarantine.
- [x] **Step 2: Run test to confirm it fails**
  - Run `npm test tests/key-broker.service.test.ts`.
- [x] **Step 3: Implement `KeyBrokerService`**
  - Implement JIT unsealing with AAD `${credentialId}:${providerSlug}`.
  - Implement fallback to `this.env[providerConfig.apiKeyEnv]`.
  - Implement auto-quarantine on `AUTH_FAILED`.
- [x] **Step 4: Register in `lib/di/container.ts`**
- [x] **Step 5: Verify test passes**
  - Run `npm test tests/key-broker.service.test.ts`.

---

### Task 5: LLM Router & Provider Dynamic Key Injection

**Files:**
- Modify: `lib/llm/providers/openai-compatible.ts`
- Modify: `lib/services/llm-provider.service.ts`
- Modify: `lib/services/llm-router.service.ts`
- Test: `tests/llm-router-failover.test.ts`

**Interfaces:**
- Consumes: `KeyBrokerService`
- Produces: Two-tier failover in `routeChat` (rotate credentials per provider first, then switch provider)

- [x] **Step 1: Write the failing test** (`tests/llm-router-failover.test.ts`)
  - Test multi-account rotation within a single provider before falling back to next provider.
  - Verify streaming token CTA guard remains intact.
- [x] **Step 2: Run test to confirm it fails**
  - Run `npm test tests/llm-router-failover.test.ts`.
- [x] **Step 3: Refactor `OpenAICompatibleProvider`**
  - Support passing dynamic credentials or key resolver function per request.
- [x] **Step 4: Update `LLMRouterService`**
  - Integrate `KeyBrokerService` claim and report lifecycle.
- [x] **Step 5: Verify test passes**
  - Run `npm test tests/llm-router-failover.test.ts`.

---

### Task 6: Admin AI Credentials API & Server Actions

**Files:**
- Create: `lib/validations/ai-credential.schema.ts`
- Create: `lib/contracts/admin-ai-credentials.contract.ts`
- Create: `app/api/admin/ai/credentials/route.ts`
- Create: `app/api/admin/ai/credentials/replace/route.ts`
- Create: `app/api/admin/ai/credentials/kill/route.ts`
- Create: `lib/api/admin-ai-credentials.api.ts`
- Modify: `lib/constants/endpoints.constants.ts`
- Test: `tests/admin-ai-credentials.service.test.ts`

**Interfaces:**
- Consumes: `KeyBrokerService`, `AiCredentialsRepository`, `runAction`, `handleRoute`
- Produces:
  - `addCredential`: write-only validation, test ping, encryption, and store
  - `replaceCredential`: zero-downtime rotation with old ciphertext wiping
  - `killSwitch`: immediate pause of key, account, or provider

- [x] **Step 1: Write test for server actions & service** (`tests/admin-ai-credentials.service.test.ts`)
- [x] **Step 2: Define Zod 4 schemas and contracts**
- [x] **Step 3: Implement Server Service, API Routes, and client API wrappers**
- [x] **Step 4: Verify test passes**
  - Run `npm test tests/admin-ai-credentials.service.test.ts`.

---

### Task 7: Admin AI Control Center UI (Accounts & Keys)

**Files:**
- Create: `components/admin/ai/AddCredentialModal.tsx`
- Create: `components/admin/ai/ReplaceCredentialModal.tsx`
- Create: `components/admin/ai/KillSwitchDialog.tsx`
- Create: `app/admin/ai/credentials/page.tsx`
- Modify: `components/admin/AdminShell.tsx` (add navigation link)

**Interfaces:**
- Consumes: Client API from `lib/api/admin-ai-credentials.api.ts`
- Produces: Fully interactive Admin UI with 6 states (loading, empty, error, partial, stale, forbidden)

- [x] **Step 1: Implement Modals**
  - `AddCredentialModal`: Select provider & account, paste raw key (never shown again), set daily budget & priority.
  - `ReplaceCredentialModal`: Paste replacement key, confirm old key wipe.
  - `KillSwitchDialog`: Reason input, status toggle.
- [x] **Step 2: Build `app/admin/ai/credentials/page.tsx`**
  - Accounts & Keys table: Provider, Account Email, Last4, Status badge, Spent Today / Budget Left, Actions (Test, Replace, Disable/Kill).
- [x] **Step 3: Add navigation link to admin sidebar**
- [x] **Step 4: Verify UI builds cleanly**
  - Run `npm run typecheck`.

---

### Task 8: Verification, DoD & Boundary Certification

- [x] **Step 1: Run comprehensive typecheck**
  - `npm run typecheck`
- [x] **Step 2: Run boundary & import verification**
  - `node scripts/check-boundaries.mjs`
- [x] **Step 3: Run all unit & integration test suites**
  - `npm test`
- [x] **Step 4: Next.js Production Build**
  - `npm run build`
