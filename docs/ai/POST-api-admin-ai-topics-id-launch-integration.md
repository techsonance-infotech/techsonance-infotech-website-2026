# Integration Guide: `POST /api/admin/ai/topics/[id]/launch`

This guide details the architecture, RBAC access controls, contract schemas, and frontend integration specifications for the Autonomous AI Content Generation Pipeline Launch endpoint (`/api/admin/ai/topics/[id]/launch`).

---

## 1. Architectural Overview (3-Tier Layering)

The topic generation trigger adheres strictly to the project's 3-Tier Layer Architecture:

```
┌────────────────────────────────────────────────────────┐
│  Admin Client (app/admin/blog/topics/page.tsx)         │
└───────────────────────────┬────────────────────────────┘
                            │ POST /api/admin/ai/topics/[id]/launch
                            ▼
┌────────────────────────────────────────────────────────┐
│  Controller:                                           │
│  app/api/admin/ai/topics/[id]/launch/route.ts          │
│  - Origin Verification via isAllowedOrigin (403)       │
│  - Auth Session Check via AdminAuthService (401)       │
│  - RBAC: Editor+ Required for Generation Trigger (403) │
│  - Strict UUID Validation via aiTopicParamsSchema      │
│  - Structured Logging & ErrorCode mapping              │
└───────────────────────────┬────────────────────────────┘
                            │ launchTopicGeneration(id)
                            ▼
┌────────────────────────────────────────────────────────┐
│  Service: lib/services/admin-topics.service.ts         │
│  - Validates topic exists (404 on missing UUID)        │
│  - Updates status to QUEUED in ts_ai_topics            │
│  - Invokes JobOrchestratorService.createJob()          │
│  - Triggers asynchronous job execution in background   │
│  - Returns { jobId }                                   │
└───────────────────────────┬────────────────────────────┘
                            │ createJob() & executeJob()
                            ▼
┌────────────────────────────────────────────────────────┐
│  Service: lib/services/job-orchestrator.service.ts     │
│  - Enqueues job in ts_ai_generation_jobs               │
│  - Manages 6-stage autonomous research & drafting      │
└────────────────────────────────────────────────────────┘
```

---

## 2. API Contract Specification

- **Path**: `/api/admin/ai/topics/[id]/launch` (`API_ENDPOINTS.ADMIN.AI.TOPIC_LAUNCH(id)`)
- **HTTP Method**: `POST`
- **Authentication**: `required` (Active Admin Session via cookie)
- **Required Role**: `editor`, `admin`, or `owner` (Viewers and Authors receive `403 FORBIDDEN`)

### Path Parameters (`aiTopicParamsSchema`)
| Parameter | Type | Format | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | UUIDv4 | Unique identifier of the topic in `ts_ai_topics` |

### Successful Response Format (`200 OK`)
The endpoint delivers both a standard `{ ok: true, data: { ... } }` envelope and backward-compatible top-level properties:
```json
{
  "ok": true,
  "success": true,
  "jobId": "e12a4b56-789c-4def-0123-456789abcdef",
  "message": "Autonomous generation job triggered successfully.",
  "data": {
    "success": true,
    "jobId": "e12a4b56-789c-4def-0123-456789abcdef",
    "message": "Autonomous generation job triggered successfully."
  }
}
```

---

## 3. Error Responses & Handling Matrix

| HTTP Status | ErrorCode | Scenario | Solution / Recovery |
| :--- | :--- | :--- | :--- |
| `401` | `UNAUTHENTICATED` | Missing or expired admin cookie session | Redirect user to admin login screen (`/admin/login`) |
| `403` | `FORBIDDEN` | Origin header mismatch (untrusted cross-site origin) | Ensure requests originate from the same host |
| `403` | `FORBIDDEN` | User role is `viewer` or `author` | Disable or hide the "Launch 1-Click" button for read-only roles |
| `400` | `BAD_REQUEST` | Topic ID is not a valid UUID | Check route URL parameter formatting |
| `404` | `NOT_FOUND` | Topic ID does not exist in `ts_ai_topics` | Prompt user that the topic was removed |
| `500` | `INTERNAL` | Unexpected backend or orchestrator queue crash | Display toast error to user; prompt retry |

---

## 4. Frontend Integration Example (React 19)

In `app/admin/blog/topics/page.tsx`:

```tsx
import { useState } from "react";
import { Play } from "lucide-react";
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";
import { AiTopicStatus } from "@/lib/constants/enums/ai.enum";

export function LaunchGenerationButton({
  topicId,
  onLaunched,
}: {
  topicId: string;
  onLaunched: (jobId: string) => void;
}) {
  const [isLaunching, setIsLaunching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLaunch = async () => {
    try {
      setIsLaunching(true);
      setErrorMsg(null);

      const res = await fetch(API_ENDPOINTS.ADMIN.AI.TOPIC_LAUNCH(topicId), {
        method: "POST",
      });

      const body = await res.json();

      if (!res.ok || !body.ok) {
        throw new Error(body.error?.message ?? "Failed to launch generation job");
      }

      onLaunched(body.jobId);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error launching job");
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleLaunch}
        disabled={isLaunching}
        className="flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded font-medium disabled:opacity-50"
      >
        <Play className={`w-3.5 h-3.5 mr-1 ${isLaunching ? "animate-pulse" : ""}`} />
        {isLaunching ? "Launching..." : "Launch 1-Click"}
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
npx vitest run tests/admin-ai-topics-launch-blackbox.test.ts

# 2. Standalone Hardcore Black-Box Script
npx tsx blackbox-testing/ai/verify_admin_ai_topics_launch_blackbox.ts

# 3. Full project regression verification
npm run typecheck
node scripts/check-boundaries.mjs
npm test
```
