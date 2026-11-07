# Integration Guide: `GET, POST /api/admin/ai/topics` & `GET /api/admin/ai/topics/[id]`

This guide details the architecture, RBAC access controls, contract schemas, and frontend integration specifications for the Autonomous AI Content Ideation and Topic Cluster endpoints (`/api/admin/ai/topics` and `/api/admin/ai/topics/[id]`).

---

## 1. Architectural Overview (3-Tier Layering)

The AI topic ideation subsystem adheres strictly to the project's 3-Tier Layer Architecture:

```
┌────────────────────────────────────────────────────────┐
│  Admin Client (app/admin/blog/topics/page.tsx)         │
└───────────────────────────┬────────────────────────────┘
                            │ GET /api/admin/ai/topics
                            │ POST /api/admin/ai/topics
                            │ GET /api/admin/ai/topics/[id]
                            ▼
┌────────────────────────────────────────────────────────┐
│  Controllers:                                          │
│  - app/api/admin/ai/topics/route.ts                    │
│  - app/api/admin/ai/topics/[id]/route.ts               │
│  - Origin Verification via isAllowedOrigin (403)       │
│  - Auth Session Check via AdminAuthService (401)       │
│  - RBAC: Viewer+ for GET, Editor+ for Mutations (403)  │
│  - Strict Zod 4 Schema Parsing                         │
│  - Distributed Tracing Header: x-request-id            │
└───────────────────────────┬────────────────────────────┘
                            │ listTopics() / createTopic()
                            ▼
┌────────────────────────────────────────────────────────┐
│  Service: lib/services/admin-topics.service.ts         │
│  - Business logic, audience mapping, priority scoring  │
│  - Status lifecycle: SUGGESTED -> ACCEPTED -> QUEUED   │
└───────────────────────────┬────────────────────────────┘
                            │ Drizzle ORM Queries
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

- **Base Paths**:
  - `/api/admin/ai/topics` (List & Create)
  - `/api/admin/ai/topics/[id]` (Detail, Status Update & Delete)
- **Authentication**: `required` (Admin Session)
- **Rate Limit**: Standard admin API protection

### Role Permissions Matrix
| Method | Path | Required Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/ai/topics` | `viewer` | Read-only listing with search & status filters |
| `POST` | `/api/admin/ai/topics` | `editor` | Create and enqueue new topic idea |
| `GET` | `/api/admin/ai/topics/[id]` | `viewer` | Retrieve single topic detail by UUID |
| `PATCH` | `/api/admin/ai/topics/[id]` | `editor` | Transition topic status (e.g. to `QUEUED`) |
| `DELETE` | `/api/admin/ai/topics/[id]` | `editor` | Delete topic from backlog |

---

### Endpoint A: `GET /api/admin/ai/topics`

#### Query Parameters (`listAiTopicsQuerySchema`)
```typescript
{
  status?: "SUGGESTED" | "ACCEPTED" | "QUEUED" | "GENERATED" | "REJECTED";
  search?: string;   // Case-insensitive title search
  limit?: number;    // Default 50, max 100
  offset?: number;   // Default 0
}
```

#### Response Envelope (`200 OK`)
```json
{
  "ok": true,
  "data": {
    "topics": [
      {
        "id": "d1111111-2222-4333-8444-555555555555",
        "siteId": "site-uuid-1111",
        "title": "Event-Driven Microservices with Next.js 16 and Kafka",
        "keywords": ["microservices", "kafka", "event-driven", "nextjs"],
        "category": "Architecture",
        "targetAudience": "Lead Architects & CTOs",
        "difficulty": "advanced",
        "status": "ACCEPTED",
        "priority": 1,
        "suggestedBy": "admin",
        "notes": "High organic search volume and intent",
        "createdAt": "2026-11-07T04:59:45.407Z",
        "updatedAt": "2026-11-07T04:59:45.408Z"
      }
    ],
    "total": 1
  },
  "topics": [...],
  "total": 1
}
```

---

### Endpoint B: `POST /api/admin/ai/topics`

#### Request Payload (`createAiTopicSchema`)
```typescript
{
  title: string;              // Required: 5 to 250 characters (trimmed)
  keywords?: string[];        // Optional: array of strings (max 20 keywords)
  category?: string;          // Optional: max 100 characters (default: "Engineering")
  targetAudience?: string;    // Optional: max 150 characters (default: "Tech Leads & Engineers")
  difficulty?: string;        // Optional: "beginner" | "intermediate" | "advanced"
  priority?: number;          // Optional: integer between -100 and 100 (default: 0)
  notes?: string;             // Optional: max 1000 characters
  suggestedBy?: "ai" | "admin";
}
```

#### Response Envelope (`201 Created`)
```json
{
  "ok": true,
  "data": {
    "topic": {
      "id": "topic-uuid-999",
      "title": "Building Zero-Knowledge Authentication in Next.js 16",
      "category": "Security",
      "status": "ACCEPTED",
      "priority": 2
    }
  },
  "topic": { ... },
  "success": true
}
```

---

### Endpoint C: `GET /api/admin/ai/topics/[id]`

#### Path Parameters (`aiTopicParamsSchema`)
- `id`: Valid UUID string

#### Response Envelope (`200 OK`)
```json
{
  "ok": true,
  "data": {
    "topic": {
      "id": "d1111111-2222-4333-8444-555555555555",
      "title": "Event-Driven Microservices with Next.js 16 and Kafka",
      "keywords": ["microservices", "kafka", "event-driven", "nextjs"],
      "category": "Architecture",
      "status": "ACCEPTED"
    }
  },
  "topic": { ... }
}
```

---

## 3. Error Codes & Scenarios

| Scenario | HTTP Status | Code | Message |
| :--- | :--- | :--- | :--- |
| Missing admin session | `401 Unauthorized` | `UNAUTHENTICATED` | "You must be signed in to access AI topic clusters" |
| Origin mismatch | `403 Forbidden` | `FORBIDDEN` | "Forbidden origin" |
| Viewer/Author on mutations | `403 Forbidden` | `FORBIDDEN` | "Insufficient permissions. Only editors and admins can modify AI topic clusters." |
| Title < 5 characters | `422 Unprocessable` | `VALIDATION` | "Topic title is required and must be between 5 and 250 characters." |
| Non-existent topic UUID | `404 Not Found` | `NOT_FOUND` | "AI topic not found" |
| Database error | `500 Internal Error` | `INTERNAL` | "Failed to retrieve topic details" |

---

## 4. Frontend Integration Guide

The topic backlog manager ([`app/admin/blog/topics/page.tsx`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/techsonance-infotech-website-2026/app/admin/blog/topics/page.tsx)) interacts with the endpoints:

```typescript
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";

// 1. Fetching topics list
export async function fetchTopics(status?: string, search?: string) {
  const url = new URL(API_ENDPOINTS.ADMIN.AI.TOPICS, window.location.origin);
  if (status && status !== "ALL") url.searchParams.set("status", status);
  if (search?.trim()) url.searchParams.set("search", search.trim());

  const res = await fetch(url.toString());
  const data = await res.json();
  if (data.ok) {
    return data.data?.topics || data.topics;
  }
}

// 2. Fetching single topic by ID
export async function fetchTopicById(id: string) {
  const res = await fetch(API_ENDPOINTS.ADMIN.AI.TOPIC(id));
  const data = await res.json();
  if (data.ok) {
    return data.data?.topic || data.topic;
  }
}

// 3. Creating a new topic
export async function createTopic(newTopicData: CreateTopicInput) {
  const res = await fetch(API_ENDPOINTS.ADMIN.AI.TOPICS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newTopicData),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || data.error || "Failed to create topic");
  }
  return data.data?.topic || data.topic;
}
```

---

## 5. Verification & Testing Evidence

- **Vitest Suite**: `tests/admin-ai-topics-blackbox.test.ts` (14 integration tests covering 401, 403 origin, 403 RBAC, 422 validation, 404 not found, 200 list, 201 create, 200 get by id, 200 update status, and 200 delete).
- **Standalone Runner**: `blackbox-testing/ai/verify_admin_ai_topics_blackbox.ts` (39 assertions passed provably).
