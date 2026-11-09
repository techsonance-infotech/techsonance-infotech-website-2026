# AI Provider & Credential Pipeline: Secure Multi-Account Failover Design

*TechSonance Infotech · Architecture Specification · 9 Nov 2026*

## 1. Goal & Context

TechSonance runs LLM features across customer-facing Chat (`Sonance AI`) and the Autonomous Technical Blog Generation Pipeline (`JobOrchestratorService`). Currently, AI keys are loaded statically from environment variables with one credential per provider.

**Goal:** Implement a secure, multi-account, multi-provider AI credential vault and broker pipeline. When a key or account exhausts quota, hits rate limits, or is revoked, the system automatically rotates to the next available healthy key of that model/provider, and then to fallback providers. Keys are stored in the database exclusively as AES-256-GCM ciphertext, isolated behind an in-memory server-only Key Broker.

### Non-Goals
- Consumer session tokens or browser cookies (official API keys only).
- Storing decrypted keys in Redis or client sessions.
- Bypassing provider terms (safe pattern: multi-project/multi-account budget isolation).

---

## 2. Global Constraints & Architecture Standards

- **Database Isolation:** All tables, indexes, constraints, and enums MUST carry `ts_ai_*` prefix (`03-database-security.md`).
- **Connection Model:** Runtime connects to Supavisor `:6543` with `prepare: false`. Migrations on `:5432`.
- **Dependency Injection:** `@needle-di/core` singletons. Zero dual signatures (`executor?: Database | DbTransaction`), zero `any`.
- **Validation & Enums:** Zod 4 strict objects. Closed sets use TypeScript `as const` objects in `lib/constants/enums/`.
- **Framework & Runtime:** Next.js 16 App Router, React 19, Node.js `node:crypto`, `server-only` everywhere secrets or keys are touched.
- **Fail Fast & Safe:** Never leak keys, full tokens, or authorization headers in error messages, logger payloads, or client bundles.

---

## 3. Subsystems & Component Responsibilities

```
[Customer Chat / Autonomous Job]
              │
              ▼
      [LLMRouterService]  ◄── Task-bound route profile (Groq -> Gemini -> Cerebras)
              │
              ▼
      [KeyBrokerService]  ◄── Server-only decrypt with KEK; atomic claim (SKIP LOCKED)
              │
              ├── [Crypto Vault] (AES-256-GCM + AAD: credentialId:provider)
              ├── [ts_ai_credentials] (Ciphertext, IV, Tag, KEK version, Fingerprint)
              └── [ts_ai_accounts] (Account email, budget, billing mode)
              │
              ▼
   [OpenAICompatibleProvider]
              │
              ├── Success ──► Record token usage & update spent budget
              └── Error   ──► Classify:
                               ├── RATE_LIMITED    -> Cooldown in Redis/DB
                               ├── QUOTA_EXHAUSTED -> Mark EXHAUSTED; switch key
                               ├── AUTH_FAILED     -> Mark COMPROMISED/DISABLED; alert & switch
                               └── PROVIDER_DOWN   -> Trip breaker; switch provider
```

| Component | Layer / Path | Responsibility |
| :--- | :--- | :--- |
| **Crypto Vault** | `lib/crypto/vault.ts` | `seal()`, `open()`, and `fingerprint()`. Pure AES-256-GCM crypto with AAD validation. |
| **Key Broker** | `lib/services/ai/key-broker.service.ts` | In-memory key unsealing, atomic reservation (`FOR UPDATE SKIP LOCKED`), fallback to `.env`. |
| **Credential Repository** | `lib/repositories/ai-credentials.repository.ts` | Drizzle queries for `ts_ai_credentials`, `ts_ai_accounts`, `ts_ai_credential_events`. |
| **LLM Router** | `lib/services/llm-router.service.ts` | Two-tier failover: switch key first, then fallback provider. Preserves streaming response guards. |
| **Health Service** | `lib/services/llm-health.service.ts` | Upstash Redis + in-memory state tracking for cooldowns, quota exhaustion, and circuit breakers. |
| **Admin Control Center** | `app/admin/ai/` & `lib/server/action.ts` | Write-only key entry, connection testing, replace key (zero downtime with old ciphertext wipe), kill switch. |

---

## 4. Encryption & Vault Design

### 4.1 AES-256-GCM Specification
- **Master Key (KEK):** Versioned 32-byte key (`AI_KEK_V1`, base64) stored in environment variables / secrets manager.
- **IV:** Fresh cryptographically secure random 12-byte IV for every encryption call (`randomBytes(12)`).
- **AAD (Additional Authenticated Data):** Bound to `${credentialId}:${provider}`. Ciphertext transplanted to another record or provider will fail authentication.
- **Fingerprint:** HMAC-SHA256 of the plain key with `AI_FP_PEPPER`. Deterministic and one-way, used for duplicate detection and secret leak matching.
- **Metadata:** Records `last4` for administrative display. Raw keys are discarded from memory immediately after request completes.

```ts
export type SealedSecret = {
  ciphertext: Buffer;
  iv: Buffer;
  authTag: Buffer;
  keyVersion: number;
};
```

---

## 5. Database Schema Specifications (`ts_ai_*`)

### 5.1 Tables

1. **`ts_ai_accounts`**
   - `id`: UUID (PK)
   - `provider`: text (`groq`, `gemini`, `cerebras`, `openrouter`, `mistral`, `cloudflare`, `github`, etc.)
   - `account_email`: text (for admin label and billing ownership)
   - `display_name`: text
   - `billing_mode`: text (`prepaid`, `postpaid`, `free_tier`)
   - `monthly_budget_usd`: numeric(10, 2)
   - `created_by`: uuid
   - `created_at`, `updated_at`: timestamptz

2. **`ts_ai_credentials`**
   - `id`: UUID (PK, generated client/broker side to form AAD)
   - `account_id`: UUID (FK to `ts_ai_accounts.id`)
   - `provider`: text not null
   - `label`: text not null
   - `ciphertext`: bytea not null
   - `iv`: bytea not null
   - `auth_tag`: bytea not null
   - `key_version`: integer not null default 1
   - `fingerprint`: text not null unique
   - `last4`: text not null
   - `status`: enum `AiCredentialStatus` (`active`, `cooling_down`, `exhausted`, `disabled`, `compromised`)
   - `priority`: integer not null default 100
   - `cooldown_until`: timestamptz
   - `quota_resets_at`: timestamptz
   - `daily_budget_usd`: numeric(10, 2)
   - `spent_today_usd`: numeric(10, 2) default 0
   - `consecutive_failures`: integer default 0
   - `last_error_kind`: text
   - `last_used_at`: timestamptz
   - `is_canary`: boolean not null default false
   - `created_at`, `updated_at`: timestamptz

3. **`ts_ai_credential_events` (Append-Only Audit)**
   - `id`: bigserial (PK)
   - `credential_id`: UUID
   - `event`: text not null (`created`, `used`, `failed`, `cooled`, `exhausted`, `disabled`, `compromised`, `rotated`, `wiped`)
   - `actor`: text not null (`system` or `user_id`)
   - `request_id`: text
   - `meta`: jsonb not null default `{}` (scrubbed; zero secrets or headers)
   - `at`: timestamptz default now()

4. **`ts_ai_alerts`**
   - `id`: bigserial (PK)
   - `severity`: text (`info`, `warning`, `high`, `critical`)
   - `type`: text not null
   - `credential_id`: UUID
   - `dedupe_key`: text not null
   - `channel`: text not null
   - `sent_at`: timestamptz
   - `created_at`: timestamptz default now()

---

## 6. Key Brokering & Failover Logic

### 6.1 Two-Tier Selection
1. **Tier 1 (Multi-Account / Multi-Key for current provider):**
   - Query `ts_ai_credentials` for `provider = currentProvider` and `status = 'active'`.
   - Filter `cooldown_until <= now()` and `(daily_budget_usd is null or spent_today_usd < daily_budget_usd)`.
   - Order by `priority ASC, last_used_at ASC NULLS FIRST`.
   - Atomically lock selected row with `FOR UPDATE SKIP LOCKED`.
   - If found, unseal with `open()` and return active credentials.
   - **Hybrid Fallback:** If zero DB credentials exist for this provider, fall back to `.env` key to guarantee uninterrupted service during migration.
2. **Tier 2 (Provider Failover):**
   - If all credentials for `currentProvider` return exhaustion or rate limits, trip health breaker and advance to the next provider in the chain.

### 6.2 Error Classification & Auto-Quarantine
- `401 / 403` (AUTH_FAILED):
  - Mark status as `compromised` or `disabled`.
  - Trigger audit event `ts_ai_credential_events`.
  - Dispatch Critical/High alert via email.
  - Rotate immediately to next key.
- `429` (RATE_LIMITED):
  - Set `status = 'cooling_down'`, `cooldown_until = now() + retryAfter`.
- `402 / Quota error` (QUOTA_EXHAUSTED):
  - Set `status = 'exhausted'`.
- Canary credential read:
  - If any caller or query reads a row where `is_canary = true`, immediately fire a Critical Alert.

---

## 7. Verification Plan & DoD

- **Unit Tests:**
  - `vault.test.ts`: `seal()` and `open()` roundtrip; bad AAD throws decryption error; tampered ciphertext or auth tag fails; HMAC fingerprint is deterministic.
- **Repository Tests:**
  - `ai-credentials.repository.test.ts`: Insert credential, query active with `FOR UPDATE SKIP LOCKED`, update status, record event.
- **Broker & Failover Tests:**
  - `key-broker.service.test.ts`: Multi-account claim, fallback to `.env`, rotation on failure classification.
- **Boundaries & Lint:**
  - `npm run typecheck`, `node scripts/check-boundaries.mjs`, and `npm test` passing cleanly.
