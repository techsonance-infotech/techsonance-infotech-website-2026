# Architecture & Engineering Decisions

This document records key architectural and design decisions for the **TechSonance Website Chatbot ("Sonance AI")**.

---

## 1. Stateless Server & Zero Server Chat Logs
- **Decision**: The Next.js API routes (`/api/chat`, `/api/book`, `/api/slots`, `/api/health`) are 100% stateless.
- **Rationale**: User chat privacy and GDPR/data protection compliance. Chat histories exist solely in the visitor's local browser IndexedDB (`Dexie.js`).
- **Server logs**: Server logs record only gate decisions, provider latency, and error types. No message text is ever logged.

---

## 2. Zero-Token Direct FAQ Interception & Hybrid Retrieval
- **Decision**: Use `minisearch` BM25 indexing over curated Markdown knowledge chunks and `faq.json` entries, coupled with synonym expansion and alias matching.
- **Threshold**: Questions scoring $\ge 0.68$ match directly against `faq.json` and are streamed immediately using simulated natural typing ($15\text{ms/word}$) at $0$ token cost.
- **Fail-safe Mode**: If all LLM providers become exhausted or rate-limited, the system automatically falls back to FAQ-only direct mode, ensuring visitors still receive instant answers for all core agency questions.

---

## 3. Strict Relevance Gating & Prompt Injection Defense
- **Decision**: Multi-layer relevance gate evaluated prior to invoking any LLM:
  1. **BLOCKED**: Regex & keyword filter for coding tasks ("write a function", "fix my bug", code fences), prompt extractions ("system prompt", "ignore instructions"), and offensive content.
  2. **BOOKING**: Direct detection of consultation/meeting booking intent.
  3. **GREETING / SMALLTALK**: Instant canned responses with contextual quick-reply chips.
  4. **FAQ_DIRECT**: Direct zero-token answers from curated FAQ.
  5. **IN_SCOPE**: Retrieval score threshold or presence of agency/project keywords.
  6. **OUT_OF_SCOPE**: Polite refusal with consultation CTA.

---

## 4. Multi-Provider LLM Rotation & State Machine
- **Decision**: Support Groq, Gemini, Cerebras, OpenRouter Free Tier, Mistral AI, Cloudflare Workers AI, and GitHub Models through an OpenAI-compatible adapter.
- **Single Pass Router**: The router loops through the pool of healthy providers exactly once per request. There are no infinite loops or recursions.
- **Stream Integrity**: If tokens have already begun streaming to the client, the provider is never switched mid-stream; errors append a graceful conclusion and booking CTA.
- **Cooldowns**:
  - Rate limit (429): 60s cooldown (or `Retry-After` header value).
  - Daily quota / credit exhaustion (402/429): Marked `EXHAUSTED` for 6 hours (configurable via `EXHAUSTED_RETRY_HOURS`).
  - Server errors (5xx) or timeouts: 120s cooldown; 3 consecutive errors trigger 15-minute cooldown.
  - Auth errors (401/403): Provider disabled for 1 hour.

---

## 5. Booking & Timezone Architecture
- **Decision**: Slots are generated strictly in IST (`Asia/Kolkata`) on the server according to defined agency business hours (10:00 AM – 7:00 PM IST, Monday to Saturday).
- **Client Presentation**: The frontend automatically detects the visitor's local browser timezone (`Intl.DateTimeFormat().resolvedOptions().timeZone`) and converts slot timestamps.
- **Email Delivery**: Emails include IST and client local times, plus a generated `.ics` iCalendar attachment.
