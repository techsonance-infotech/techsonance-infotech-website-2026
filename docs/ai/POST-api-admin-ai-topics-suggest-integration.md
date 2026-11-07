# Integration Guide: `POST /api/admin/ai/topics/suggest`

This guide details the architecture, RBAC access controls, contract schemas, and frontend integration specifications for the Autonomous AI Content Ideation Suggestion endpoint (`/api/admin/ai/topics/suggest`).

---

## 1. Architectural Overview (3-Tier Layering)

The AI topic ideation generator adheres strictly to the project's 3-Tier Layer Architecture:

```
┌────────────────────────────────────────────────────────┐
│  Admin Client (app/admin/blog/topics/page.tsx)         │
└───────────────────────────┬────────────────────────────┘
                            │ POST /api/admin/ai/topics/suggest
                            │ Body: { category?: string }
                            ▼
┌────────────────────────────────────────────────────────┐
│  Controller: app/api/admin/ai/topics/suggest/route.ts  │
│  - Origin Verification via isAllowedOrigin (403)       │
│  - Auth Session Check via AdminAuthService (401)       │
│  - RBAC: Editor+ Required for AI Generation (403)      │
│  - Strict Zod 4 Schema Parsing                         │
│  - Structured Logging & ErrorCode mapping              │
└───────────────────────────┬────────────────────────────┘
                            │ suggestTopicsWithAI(category)
                            ▼
┌────────────────────────────────────────────────────────┐
│  Service: lib/services/admin-topics.service.ts         │
│  - Injects AIWriterService & AdminTopicsRepository     │
│  - Generates 4 structured topic proposals via LLM      │
│  - Persists proposals in ts_ai_topics with             │
│    status = SUGGESTED and suggestedBy = "ai"           │
│  - Robust fallback proposals on LLM timeout            │
└───────────────────────────┬────────────────────────────┘
                            │ Drizzle ORM batch insert
                            ▼
┌────────────────────────────────────────────────────────┐
│  Repository: lib/repositories/admin-topics.repository.ts │
│  - Needle DI: inject(DRIZZLE_DB_TOKEN)                 │
│  - Table: ts_ai_topics                                 │
│  - Driver error mapping via mapDbError                 │
└────────────────────────────────────────────────────────┘
```

---

## 2. API Contract Specification

- **Path**: `/api/admin/ai/topics/suggest` (`API_ENDPOINTS.ADMIN.AI.TOPIC_SUGGEST`)
- **HTTP Method**: `POST`
- **Authentication**: `required` (Active Admin Session via cookie)
- **Required Role**: `editor`, `admin`, or `owner` (Viewers and Authors receive `403 FORBIDDEN`)

### Request Headers
| Header | Value | Requirement |
| :--- | :--- | :--- |
| `Content-Type` | `application/json` | Required when body is sent |
| `origin` | Same-origin or trusted domain | Required (CSRF protection) |

### Request Body Schema (`suggestAiTopicsSchema`)
```typescript
{
  /**
   * Target editorial category or focus area.
   * Max 100 characters. Defaults to "Full-Stack & Agentic AI" if omitted.
   */
  category?: string;
}
```

### Successful Response Format (`200 OK`)
The endpoint delivers both a standard `{ ok: true, data: { ... } }` envelope and backward-compatible top-level properties:
```json
{
  "ok": true,
  "success": true,
  "count": 4,
  "topics": [
    {
      "id": "e0b4a706-03fc-4ce2-b88d-e089d81d22b8",
      "siteId": "00000000-0000-0000-0000-000000000001",
      "title": "Building Production Multi-Agent Workflows with Next.js 16 and Needle DI",
      "keywords": ["Next.js 16", "Needle DI", "Multi-Agent AI", "TypeScript"],
      "category": "Agentic AI",
      "targetAudience": "Tech Leads & Engineers",
      "difficulty": "intermediate",
      "status": "SUGGESTED",
      "suggestedBy": "ai",
      "priority": 1,
      "notes": "Curated agency topic recommendation",
      "createdAt": "2026-11-07T10:35:00.000Z",
      "updatedAt": "2026-11-07T10:35:00.000Z"
    }
  ],
  "data": {
    "success": true,
    "count": 4,
    "topics": [ /* same array */ ]
  }
}
```

---

## 3. Error Responses & Handling Matrix

| HTTP Status | ErrorCode | Scenario | Solution / Recovery |
| :--- | :--- | :--- | :--- |
| `401` | `UNAUTHENTICATED` | Missing or expired admin cookie session | Redirect user to admin login screen (`/admin/login`) |
| `403` | `FORBIDDEN` | Origin header mismatch (untrusted cross-site origin) | Ensure requests originate from the same host |
| `403` | `FORBIDDEN` | User role is `viewer` or `author` | Disable or hide the "Suggest Topics" button for read-only roles |
| `400` | `BAD_REQUEST` | Malformed or corrupted JSON request body | Check payload serialization format |
| `422` | `VALIDATION` | `category` exceeds 100 characters or unexpected fields | Validate inputs with Zod client-side before dispatch |
| `500` | `INTERNAL` | Unexpected backend or unhandled database failure | Display toast error to user; prompt retry |

---

## 4. Frontend Integration Example (React 19)

In `app/admin/blog/topics/page.tsx`:

```tsx
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";

export function AiSuggestButton({ onTopicsAdded }: { onTopicsAdded: () => void }) {
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSuggest = async () => {
    try {
      setIsSuggesting(true);
      setErrorMsg(null);

      const res = await fetch(API_ENDPOINTS.ADMIN.AI.TOPIC_SUGGEST, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: "Agentic AI & Next.js 16" }),
      });

      const body = await res.json();

      if (!res.ok || !body.ok) {
        throw new Error(body.error?.message ?? "Failed to suggest topics");
      }

      // Success: notify parent to refresh topic backlog list
      onTopicsAdded();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error connecting to AI service");
    } finally {
      setIsSuggesting(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleSuggest}
        disabled={isSuggesting}
        className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium disabled:opacity-50"
      >
        <Sparkles className={`w-4 h-4 mr-2 ${isSuggesting ? "animate-spin" : ""}`} />
        {isSuggesting ? "Proposing Topics..." : "AI Suggest Topics"}
      </button>
      {errorMsg && <p className="text-red-500 text-xs mt-1">{errorMsg}</p>}
    </div>
  );
}
```

---

## 5. Verification & Testing

Both automated Vitest suites and standalone black-box assertion scripts cover 100% of the request matrix:

```bash
# 1. Vitest Integration Suite
npx vitest run tests/admin-ai-topics-suggest-blackbox.test.ts

# 2. Standalone Hardcore Black-Box Script
npx tsx blackbox-testing/ai/verify_admin_ai_topics_suggest_blackbox.ts

# 3. Full project regression verification
npm run typecheck
node scripts/check-boundaries.mjs
npm test
```
