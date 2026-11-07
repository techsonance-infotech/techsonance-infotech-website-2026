# Integration Guide: `GET /api/admin/ai/usage`

This guide details the architecture, access controls, contract schemas, and frontend integration specifications for the AI Telemetry & Usage Metrics endpoint (`/api/admin/ai/usage`).

---

## 1. Architectural Overview (3-Tier Layering)

The AI Telemetry subsystem adheres strictly to the project's 3-Tier Layer Architecture:

```
┌────────────────────────────────────────────────────────┐
│  Admin Client (app/admin/blog/ai/usage/page.tsx)       │
└───────────────────────────┬────────────────────────────┘
                            │ GET /api/admin/ai/usage
                            ▼
┌────────────────────────────────────────────────────────┐
│  Controller: app/api/admin/ai/usage/route.ts           │
│  - Origin Verification via isAllowedOrigin (403)       │
│  - Auth Session Check via AdminAuthService (401)       │
│  - Role Access: All authenticated admin roles (200)    │
│  - Structured Logging & ErrorCode mapping              │
└───────────────────────────┬────────────────────────────┘
                            │ getTelemetrySummary()
                            ▼
┌────────────────────────────────────────────────────────┐
│  Service: lib/services/admin-telemetry.service.ts      │
│  - Reads AI_BLOG_DAILY_CAP & AI_BLOG_WEEKLY_CAP        │
│  - Computes start of day and start of week boundaries  │
│  - Returns TelemetrySummary with aggregates            │
└───────────────────────────┬────────────────────────────┘
                            │ getTelemetryAggregates()
                            ▼
┌────────────────────────────────────────────────────────┐
│  Repository:                                           │
│  lib/repositories/admin-telemetry.repository.ts        │
│  - Needle DI: inject(DRIZZLE_DB_TOKEN)                 │
│  - Queries ts_ai_usage_events, ts_ai_generation_jobs,  │
│    and ts_web_posts                                    │
│  - Driver error mapping via mapDbError                 │
└────────────────────────────────────────────────────────┘
```

---

## 2. API Contract Specification

- **Path**: `/api/admin/ai/usage` (`API_ENDPOINTS.ADMIN.AI.USAGE`)
- **HTTP Method**: `GET`
- **Authentication**: `required` (Active Admin Session via cookie)
- **Role Requirement**: Any authenticated role (`viewer`, `author`, `editor`, `admin`, `owner`)

### Successful Response Format (`200 OK`)
The endpoint delivers both a standard `{ ok: true, data: { ... } }` envelope and backward-compatible top-level properties:
```json
{
  "ok": true,
  "tokensToday": 14500,
  "tokensThisWeek": 85200,
  "dailyPostsUsed": 1,
  "dailyPostCap": 1,
  "weeklyPostsUsed": 2,
  "weeklyPostCap": 3,
  "totalJobs": 18,
  "activeJobs": 1,
  "providerStats": [
    {
      "provider": "gemini-2.5-pro",
      "totalCalls": 32,
      "successCalls": 31,
      "avgDurationMs": 1420
    },
    {
      "provider": "workers-ai-flux",
      "totalCalls": 12,
      "successCalls": 12,
      "avgDurationMs": 2310
    }
  ],
  "recentEvents": [],
  "data": {
    "tokensToday": 14500,
    "tokensThisWeek": 85200,
    "dailyPostsUsed": 1,
    "dailyPostCap": 1,
    "weeklyPostsUsed": 2,
    "weeklyPostCap": 3,
    "totalJobs": 18,
    "activeJobs": 1,
    "providerStats": [ /* same array */ ],
    "recentEvents": []
  }
}
```

---

## 3. Error Responses & Handling Matrix

| HTTP Status | ErrorCode | Scenario | Solution / Recovery |
| :--- | :--- | :--- | :--- |
| `401` | `UNAUTHENTICATED` | Missing or expired admin cookie session | Redirect user to admin login screen (`/admin/login`) |
| `403` | `FORBIDDEN` | Origin header mismatch (untrusted cross-site origin) | Ensure requests originate from the same host |
| `500` | `INTERNAL` | Unexpected database pool timeout or query crash | Display error banner to user; prompt retry |

---

## 4. Frontend Integration Example (React 19)

In `app/admin/blog/ai/usage/page.tsx`:

```tsx
import { useEffect, useState } from "react";
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";
import type { TelemetrySummary } from "@/lib/types/admin.types";

export function TelemetryDashboard() {
  const [data, setData] = useState<TelemetrySummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadTelemetry = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_ENDPOINTS.ADMIN.AI.USAGE);
      if (res.ok) {
        const json = await res.json();
        // Support both direct summary and standard envelope
        setData(json.data ?? json);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTelemetry();
  }, []);

  if (loading) return <div>Loading telemetry...</div>;
  if (!data) return <div>Failed to load metrics.</div>;

  return (
    <div>
      <h3>Tokens Used Today: {data.tokensToday.toLocaleString()}</h3>
      <p>Daily Cap: {data.dailyPostsUsed} / {data.dailyPostCap} posts</p>
    </div>
  );
}
```

---

## 5. Verification & Testing

Both automated Vitest suites and standalone black-box assertion scripts cover 100% of the request matrix:

```bash
# 1. Vitest Integration Suite
npx vitest run tests/admin-ai-usage-blackbox.test.ts

# 2. Standalone Hardcore Black-Box Script
npx tsx blackbox-testing/ai/verify_admin_ai_usage_blackbox.ts

# 3. Full project regression verification
npm run typecheck
node scripts/check-boundaries.mjs
npm test
```
