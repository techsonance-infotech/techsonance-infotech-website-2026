---
name: rag-chatbot-eval
description: "Guidelines and verification workflows for the TechSonance AI Chatbot: RAG pipeline, knowledge base indexing (MiniSearch), prompt templates, slots, and Upstash rate-limiting."
---

# RAG & AI Chatbot System Runbook

Use this skill when developing, updating, or debugging the AI Chatbot, Knowledge Base, and rate-limiting infrastructure in `components/chat/`, `lib/rag/`, and `lib/llm/`.

## Architecture

- **Knowledge Base builder**: `scripts/build-kb.ts` compiles documentation, services, and FAQ questions into search vectors/indices.
- **Search Retrieval**: MiniSearch indexing in `lib/rag/`.
- **Slot Extraction & Intent**: `lib/slots.ts` extracts booking intent, user email, project budget, and technical requirements.
- **Safety & Rate Limiting**: Upstash Redis sliding-window limiter in `lib/ratelimit.ts`.

## Checklist for Knowledge Base & Bot Changes

1. **Knowledge Base Updates**:
   - When services, pricing, or case studies change, run:
     ```bash
     npm run build:kb
     ```
   - Verify that the resulting knowledge base artifacts are valid JSON and indexed properly.

2. **Rate Limiting & Safety**:
   - Ensure the `/api/chat` endpoint verifies IP / session rate limits via `ratelimit.ts` before dispatching LLM calls.
   - Return clean 429 HTTP status with `Retry-After` headers when limits are reached.

3. **Fallback Handling**:
   - If the LLM call times out or rate limits fail, ensure the client widget in `components/chat/` degrades gracefully to direct contact email submission.
