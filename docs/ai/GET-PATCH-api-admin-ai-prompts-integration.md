# GET & PATCH `/api/admin/ai/prompts` — Integration Guide

**Domain:** Autonomous AI Content Generation Pipeline  
**Route file:** `app/api/admin/ai/prompts/route.ts`  
**Contract:** `lib/contracts/admin-ai-prompts.contract.ts`  
**Service:** `lib/services/admin-prompts.service.ts`  
**Repository:** `lib/repositories/admin-prompts.repository.ts`  
**DB table:** `ts_ai_prompt_templates`

---

## Overview

The `/api/admin/ai/prompts` endpoint manages the **dynamic prompt template library** that powers the autonomous AI content generation pipeline. Each template corresponds to one pipeline step (`outline`, `section`, `meta`, `image`, `critic`) and stores the system prompt, user prompt template, model preference, and temperature. Templates are seeded from defaults on first access and can be updated per-step by editors.

---

## Endpoints

### `GET /api/admin/ai/prompts`

Returns all active prompt templates, seeding defaults if the table is empty.

| Attribute      | Value                                                       |
| -------------- | ----------------------------------------------------------- |
| **Auth**       | Required — Viewer, Editor, Admin                            |
| **RBAC**       | Viewer+ (read-only access allowed)                          |
| **Origin**     | Enforced — foreign origins → 403                            |
| **Cache**      | `private, no-store`                                         |
| **Response**   | `200 OK` with `{ ok: true, data: { templates, total }, templates, total }` |

### `PATCH /api/admin/ai/prompts?id=<uuid>`

Updates a specific prompt template by its UUID. The template ID is passed as a **query parameter**.

| Attribute      | Value                                                       |
| -------------- | ----------------------------------------------------------- |
| **Auth**       | Required — Editor+, Admin                                   |
| **RBAC**       | Editor+ (Viewer forbidden → 403)                            |
| **Origin**     | Enforced — foreign origins → 403                            |
| **Cache**      | `private, no-store`                                         |
| **Response**   | `200 OK` with `{ ok: true, data: { template }, template, message }` |

---

## Request & Response Schemas

### GET — Response `200 OK`

```json
{
  "ok": true,
  "data": {
    "templates": [
      {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "siteId": "site-uuid-1111",
        "stepName": "outline",
        "version": 1,
        "systemPrompt": "You are a Principal Software Architect...",
        "userPromptTemplate": "Topic: \"{{topic}}\"\\nCategory: {{category}}",
        "modelPreference": "gemini-2.5-flash",
        "temperature": 70,
        "isActive": true,
        "createdAt": "2026-01-01T00:00:00.000Z",
        "updatedAt": "2026-01-01T00:00:00.000Z"
      }
    ],
    "total": 5
  },
  "templates": [...],
  "total": 5
}
```

### PATCH — Request Body

All fields are **optional** (patch semantics). At least one must be supplied.

| Field                 | Type      | Constraints               | Description                              |
| --------------------- | --------- | ------------------------- | ---------------------------------------- |
| `systemPrompt`        | `string`  | 10–8000 chars             | The system-role instruction for the LLM  |
| `userPromptTemplate`  | `string`  | 5–4000 chars              | Handlebars-style template with `{{vars}}`|
| `modelPreference`     | `string`  | 1–100 chars               | LLM model identifier (e.g. `gemini-2.5-pro`) |
| `temperature`         | `integer` | 0–100 (maps to 0.0–1.0)   | LLM sampling temperature percentage      |

```json
{
  "systemPrompt": "You are a Principal Software Architect and Technical Writer...",
  "userPromptTemplate": "Topic: \"{{topic}}\"\nCategory: {{category}}\nGenerate 4-6 focused headings.",
  "modelPreference": "gemini-2.5-pro",
  "temperature": 65
}
```

### PATCH — Response `200 OK`

```json
{
  "ok": true,
  "data": {
    "template": {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "stepName": "outline",
      "systemPrompt": "Updated system prompt...",
      "modelPreference": "gemini-2.5-pro",
      "temperature": 65,
      "updatedAt": "2026-11-07T05:33:00.000Z"
    }
  },
  "template": { ... },
  "success": true,
  "message": "Prompt template updated successfully."
}
```

---

## HTTP Status Code Matrix

| Status | Code Enum           | Trigger                                           |
| ------ | ------------------- | ------------------------------------------------- |
| `200`  | —                   | Successful GET or PATCH                           |
| `401`  | `UNAUTHENTICATED`   | No active admin session                           |
| `403`  | `FORBIDDEN`         | Foreign origin, or Viewer role attempting PATCH   |
| `404`  | `NOT_FOUND`         | PATCH — no template with given UUID               |
| `422`  | `VALIDATION`        | Invalid UUID param or body schema violations      |
| `500`  | `INTERNAL`          | Unexpected service or database failure            |

---

## Pipeline Step Names

| `stepName`  | Description                                              | Default Model         |
| ----------- | -------------------------------------------------------- | --------------------- |
| `outline`   | Generates structured JSON outline with headings          | `gemini-2.5-flash`    |
| `section`   | Writes full markdown section content per heading         | `gemini-2.5-flash`    |
| `meta`      | Generates SEO metadata JSON (title, slug, description)   | `gemini-2.5-flash`    |
| `image`     | Generates image prompt for FLUX.1/Pollinations           | `flux-schnell`        |
| `critic`    | Evaluates article quality and assigns a score (1–10)     | `gemini-2.5-flash`    |

---

## TypeScript Client Examples

### Fetching all templates

```typescript
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";

const response = await fetch(API_ENDPOINTS.ADMIN.AI.PROMPTS, {
  method: "GET",
  credentials: "include",
});

if (!response.ok) {
  const error = await response.json();
  console.error("Failed to fetch templates:", error.error.message);
  throw new Error(error.error.code);
}

const { data } = await response.json();
// data.templates: PromptTemplate[]
// data.total: number
```

### Updating a specific template

```typescript
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";

const templateId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const url = `${API_ENDPOINTS.ADMIN.AI.PROMPTS}?id=${templateId}`;

const response = await fetch(url, {
  method: "PATCH",
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    systemPrompt: "You are a Principal Software Architect...",
    temperature: 65,
  }),
});

if (response.status === 404) {
  console.error("Template not found — check the UUID");
  return;
}

if (response.status === 403) {
  console.error("Insufficient permissions — Editor+ required");
  return;
}

const { data, message } = await response.json();
console.log(message); // "Prompt template updated successfully."
// data.template: PromptTemplate
```

---

## Running Verification

### Vitest black-box suite

```bash
npx vitest run tests/admin-ai-prompts-blackbox.test.ts
```

### Standalone executable script

```bash
npx tsx blackbox-testing/ai/verify_admin_ai_prompts_blackbox.ts
```

---

## Notes

- **Template seeding**: If the `ts_ai_prompt_templates` table is empty when `GET` is called, the service auto-seeds the five default pipeline templates and returns them in the same request.
- **Versioning**: The `version` column is tracked but not auto-incremented on PATCH — manual version bumps are handled at the service layer when needed.
- **Temperature scale**: Stored as integers 0–100; divided by 100 to get the 0.0–1.0 float for LLM API calls.
- **Backwards compatibility**: All responses include both `data.*` envelope fields and flat top-level fields (e.g. `templates`, `template`, `total`) for existing consumers.
