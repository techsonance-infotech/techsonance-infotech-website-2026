import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as listTopicsGET, POST as createTopicPOST } from "@/app/api/admin/ai/topics/route";
import {
  GET as getTopicByIdGET,
  PATCH as updateTopicPATCH,
  DELETE as deleteTopicDELETE,
} from "@/app/api/admin/ai/topics/[id]/route";
import { getContainer, resetRootContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { AdminTopicsService } from "@/lib/services/admin-topics.service";
import { AiTopicStatus } from "@/lib/constants/enums/ai.enum";
import { ErrorCode } from "@/lib/errors";
import { AI_TOPICS_ERRORS } from "@/lib/constants/ai.constants";

describe("GET & POST /api/admin/ai/topics and [id] — Black Box Integration Tests", () => {
  let mockAuthService: any;
  let mockTopicsService: any;
  let topicsDatabase: any[] = [];

  const validTopicId = "d1111111-2222-4333-8444-555555555555";
  const nonExistentId = "d9999999-9999-4999-8999-999999999999";

  const sampleEditorSession = {
    userId: "admin-uuid-1111",
    email: "editor@techsonance.co.in",
    role: "editor",
    site: { id: "site-uuid-1111" },
  };

  const sampleViewerSession = {
    userId: "viewer-uuid-2222",
    email: "viewer@techsonance.co.in",
    role: "viewer",
    site: { id: "site-uuid-1111" },
  };

  const sampleAuthorSession = {
    userId: "author-uuid-3333",
    email: "author@techsonance.co.in",
    role: "author",
    site: { id: "site-uuid-1111" },
  };

  const sampleTopic = {
    id: validTopicId,
    siteId: "site-uuid-1111",
    title: "Event-Driven Microservices with Next.js 16 and Kafka",
    keywords: ["microservices", "kafka", "event-driven", "nextjs"],
    category: "Architecture",
    targetAudience: "Lead Architects & CTOs",
    difficulty: "advanced",
    status: AiTopicStatus.ACCEPTED,
    priority: 1,
    suggestedBy: "admin",
    notes: "High organic search volume and intent",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    resetRootContainer();
    topicsDatabase = [{ ...sampleTopic }];

    mockAuthService = {
      getCurrentSession: vi.fn().mockResolvedValue(sampleEditorSession),
      hasPermission: vi.fn().mockImplementation((role: string, required: string) => {
        const hierarchy: Record<string, number> = {
          viewer: 1,
          author: 2,
          editor: 3,
          admin: 4,
          owner: 5,
        };
        return (hierarchy[role] ?? 0) >= (hierarchy[required] ?? 0);
      }),
    };

    mockTopicsService = {
      listTopics: vi.fn().mockImplementation(async (opts?: any) => {
        let filtered = [...topicsDatabase];
        if (opts?.status) {
          filtered = filtered.filter((t) => t.status === opts.status);
        }
        if (opts?.search) {
          filtered = filtered.filter((t) =>
            t.title.toLowerCase().includes(opts.search.toLowerCase()),
          );
        }
        return { topics: filtered, total: filtered.length };
      }),
      getTopicById: vi.fn().mockImplementation(async (id: string) => {
        return topicsDatabase.find((t) => t.id === id) ?? null;
      }),
      createTopic: vi.fn().mockImplementation(async (data: any) => {
        const created = {
          id: `topic-uuid-${Date.now()}`,
          siteId: "site-uuid-1111",
          title: data.title,
          keywords: data.keywords ?? [],
          category: data.category ?? "Engineering",
          targetAudience: data.targetAudience ?? "Tech Leads & Engineers",
          difficulty: data.difficulty ?? "intermediate",
          status: AiTopicStatus.ACCEPTED,
          priority: data.priority ?? 0,
          suggestedBy: data.suggestedBy ?? "admin",
          notes: data.notes ?? null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        topicsDatabase.push(created);
        return created;
      }),
      updateTopicStatus: vi.fn().mockImplementation(async (id: string, status: any) => {
        const found = topicsDatabase.find((t) => t.id === id);
        if (!found) return null;
        found.status = status;
        found.updatedAt = new Date().toISOString();
        return found;
      }),
      deleteTopic: vi.fn().mockImplementation(async (id: string) => {
        const idx = topicsDatabase.findIndex((t) => t.id === id);
        if (idx === -1) return false;
        topicsDatabase.splice(idx, 1);
        return true;
      }),
    };

    const container = getContainer();
    container.bind({ provide: AdminAuthService, useValue: mockAuthService });
    container.bind({ provide: AdminTopicsService, useValue: mockTopicsService });
  });

  // ─── GET /api/admin/ai/topics ────────────────────────────────────────────────

  it("1. GET /api/admin/ai/topics rejects unauthenticated request with 401 UNAUTHENTICATED", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce(null);

    const req = new Request("http://localhost:3000/api/admin/ai/topics", { method: "GET" });
    const res = await listTopicsGET(req as any);
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.UNAUTHENTICATED);
    expect(json.error.message).toBe(AI_TOPICS_ERRORS.UNAUTHORIZED);
  });

  it("2. GET /api/admin/ai/topics rejects untrusted origin with 403 FORBIDDEN", async () => {
    const req = new Request("http://localhost:3000/api/admin/ai/topics", {
      method: "GET",
      headers: { origin: "https://unauthorized-origin.com" },
    });

    const res = await listTopicsGET(req as any);
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
  });

  it("3. GET /api/admin/ai/topics returns 200 OK with topics list", async () => {
    const req = new Request("http://localhost:3000/api/admin/ai/topics?limit=10", {
      method: "GET",
    });
    const res = await listTopicsGET(req as any);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.topics).toHaveLength(1);
    expect(json.data.total).toBe(1);
    expect(json.topics).toHaveLength(1); // Backward compatibility
  });

  // ─── POST /api/admin/ai/topics ───────────────────────────────────────────────

  it("4. POST /api/admin/ai/topics rejects unauthenticated request with 401 UNAUTHENTICATED", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce(null);

    const req = new Request("http://localhost:3000/api/admin/ai/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Valid New Topic" }),
    });

    const res = await createTopicPOST(req as any);
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.UNAUTHENTICATED);
  });

  it("5. POST /api/admin/ai/topics rejects viewer role with 403 FORBIDDEN (Editor+ required)", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce(sampleViewerSession);

    const req = new Request("http://localhost:3000/api/admin/ai/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Autonomous Agent Orchestration" }),
    });

    const res = await createTopicPOST(req as any);
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
    expect(json.error.message).toBe(AI_TOPICS_ERRORS.FORBIDDEN_ROLE);
  });

  it("6. POST /api/admin/ai/topics rejects author role with 403 FORBIDDEN (Editor+ required)", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce(sampleAuthorSession);

    const req = new Request("http://localhost:3000/api/admin/ai/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Autonomous Agent Orchestration" }),
    });

    const res = await createTopicPOST(req as any);
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
  });

  it("7. POST /api/admin/ai/topics rejects title < 5 chars with 422 VALIDATION", async () => {
    const req = new Request("http://localhost:3000/api/admin/ai/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "AI" }),
    });

    const res = await createTopicPOST(req as any);
    expect(res.status).toBe(422);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.VALIDATION);
    expect(json.error.fieldErrors?.title).toBeDefined();
  });

  it("8. POST /api/admin/ai/topics creates topic with 201 CREATED for editor", async () => {
    const payload = {
      title: "Building Zero-Knowledge Authentication in Next.js 16",
      category: "Security",
      keywords: ["auth", "cryptography", "zero-knowledge"],
      targetAudience: "Security Engineers",
      difficulty: "advanced" as const,
      priority: 2,
    };

    const req = new Request("http://localhost:3000/api/admin/ai/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await createTopicPOST(req as any);
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.topic.title).toBe(payload.title);
    expect(json.data.topic.category).toBe(payload.category);
    expect(json.success).toBe(true);
    expect(topicsDatabase).toHaveLength(2);
  });

  // ─── GET /api/admin/ai/topics/[id] ───────────────────────────────────────────

  it("9. GET /api/admin/ai/topics/[id] rejects unauthenticated request with 401 UNAUTHENTICATED", async () => {
    mockAuthService.getCurrentSession.mockResolvedValueOnce(null);

    const req = new Request(`http://localhost:3000/api/admin/ai/topics/${validTopicId}`, {
      method: "GET",
    });

    const res = await getTopicByIdGET(req as any, {
      params: Promise.resolve({ id: validTopicId }),
    });
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.UNAUTHENTICATED);
  });

  it("10. GET /api/admin/ai/topics/[id] rejects invalid UUID with 422 VALIDATION", async () => {
    const req = new Request("http://localhost:3000/api/admin/ai/topics/invalid-not-uuid", {
      method: "GET",
    });

    const res = await getTopicByIdGET(req as any, {
      params: Promise.resolve({ id: "invalid-not-uuid" }),
    });
    expect(res.status).toBe(422);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.VALIDATION);
  });

  it("11. GET /api/admin/ai/topics/[id] returns 404 NOT_FOUND for non-existent topic", async () => {
    const req = new Request(`http://localhost:3000/api/admin/ai/topics/${nonExistentId}`, {
      method: "GET",
    });

    const res = await getTopicByIdGET(req as any, {
      params: Promise.resolve({ id: nonExistentId }),
    });
    expect(res.status).toBe(404);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.NOT_FOUND);
    expect(json.error.message).toBe(AI_TOPICS_ERRORS.TOPIC_NOT_FOUND);
  });

  it("12. GET /api/admin/ai/topics/[id] returns 200 OK with topic details", async () => {
    const req = new Request(`http://localhost:3000/api/admin/ai/topics/${validTopicId}`, {
      method: "GET",
    });

    const res = await getTopicByIdGET(req as any, {
      params: Promise.resolve({ id: validTopicId }),
    });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.topic.id).toBe(validTopicId);
    expect(json.data.topic.title).toBe(sampleTopic.title);
    expect(res.headers.get("x-request-id")).toBeDefined();
  });

  // ─── PATCH /api/admin/ai/topics/[id] ─────────────────────────────────────────

  it("13. PATCH /api/admin/ai/topics/[id] updates status with 200 OK for editor", async () => {
    const req = new Request(`http://localhost:3000/api/admin/ai/topics/${validTopicId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: AiTopicStatus.QUEUED }),
    });

    const res = await updateTopicPATCH(req as any, {
      params: Promise.resolve({ id: validTopicId }),
    });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.topic.status).toBe(AiTopicStatus.QUEUED);
    expect(json.success).toBe(true);
  });

  // ─── DELETE /api/admin/ai/topics/[id] ────────────────────────────────────────

  it("14. DELETE /api/admin/ai/topics/[id] deletes topic with 200 OK for editor", async () => {
    const req = new Request(`http://localhost:3000/api/admin/ai/topics/${validTopicId}`, {
      method: "DELETE",
    });

    const res = await deleteTopicDELETE(req as any, {
      params: Promise.resolve({ id: validTopicId }),
    });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.success).toBe(true);
    expect(topicsDatabase).toHaveLength(0);
  });
});
