import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getPromptsGET, PATCH as patchPromptsPATCH } from "@/app/api/admin/ai/prompts/route";
import { getContainer, resetRootContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { AdminPromptsService } from "@/lib/services/admin-prompts.service";
import { ErrorCode } from "@/lib/errors";
import { AI_PROMPTS_ERRORS, AI_PROMPTS_MESSAGES } from "@/lib/constants/ai.constants";
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";

describe("GET /api/admin/ai/prompts — Black Box Integration Tests", () => {
  let mockAuthService: any;
  let mockPromptsService: any;

  const editorSession = {
    userId: "editor-uuid-aaaa",
    email: "editor@techsonance.co.in",
    role: "editor",
    site: { id: "site-uuid-1111" },
  };

  const viewerSession = {
    userId: "viewer-uuid-bbbb",
    email: "viewer@techsonance.co.in",
    role: "viewer",
    site: { id: "site-uuid-1111" },
  };

  const sampleTemplates = [
    {
      id: "tmpl-uuid-0001",
      siteId: "site-uuid-1111",
      stepName: "outline",
      version: 1,
      systemPrompt: "You are a Technical Writer.",
      userPromptTemplate: "Topic: {{topic}}",
      modelPreference: "gemini-2.5-flash",
      temperature: 70,
      isActive: true,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    },
    {
      id: "tmpl-uuid-0002",
      siteId: "site-uuid-1111",
      stepName: "section",
      version: 1,
      systemPrompt: "You are a Senior Staff Engineer.",
      userPromptTemplate: "Section: {{heading}}",
      modelPreference: "gemini-2.5-flash",
      temperature: 70,
      isActive: true,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    },
  ];

  beforeEach(() => {
    resetRootContainer();

    mockAuthService = {
      getCurrentSession: vi.fn().mockResolvedValue(editorSession),
      hasPermission: vi.fn().mockReturnValue(true),
    };

    mockPromptsService = {
      listTemplates: vi.fn().mockResolvedValue(sampleTemplates),
      updateTemplate: vi.fn().mockResolvedValue(sampleTemplates[0]),
      getTemplateByStep: vi.fn().mockResolvedValue(sampleTemplates[0]),
      seedDefaults: vi.fn().mockResolvedValue(sampleTemplates),
    };

    const container = getContainer();
    container.bind({ provide: AdminAuthService, useValue: mockAuthService as any });
    container.bind({ provide: AdminPromptsService, useValue: mockPromptsService as any });
  });

  // ─── SECURITY & ORIGIN TESTS ───────────────────────────────────────────────

  it("1. Rejects request with foreign origin with 403 Forbidden", async () => {
    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.AI.PROMPTS}`, {
      method: "GET",
      headers: { origin: "https://untrusted-cross-site.com" },
    });

    const res = await getPromptsGET(req as any);
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
    expect(json.error.message).toBe(AI_PROMPTS_ERRORS.FORBIDDEN_ORIGIN);
  });

  // ─── AUTHENTICATION TESTS ──────────────────────────────────────────────────

  it("2. Rejects unauthenticated request with 401 Unauthenticated", async () => {
    mockAuthService.getCurrentSession.mockResolvedValue(null);

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.AI.PROMPTS}`, {
      method: "GET",
    });

    const res = await getPromptsGET(req as any);
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.UNAUTHENTICATED);
    expect(json.error.message).toBe(AI_PROMPTS_ERRORS.UNAUTHORIZED);
  });

  // ─── SUCCESSFUL RETRIEVAL TESTS ────────────────────────────────────────────

  it("3. Returns 200 OK with all templates for viewer role", async () => {
    mockAuthService.getCurrentSession.mockResolvedValue(viewerSession);

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.AI.PROMPTS}`, {
      method: "GET",
    });

    const res = await getPromptsGET(req as any);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(Array.isArray(json.templates)).toBe(true);
    expect(json.templates).toHaveLength(2);
    expect(json.total).toBe(2);
    expect(json.data.templates).toHaveLength(2);
    expect(json.data.total).toBe(2);
    expect(mockPromptsService.listTemplates).toHaveBeenCalledOnce();
  });

  it("4. Returns 200 OK with all templates for editor role", async () => {
    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.AI.PROMPTS}`, {
      method: "GET",
    });

    const res = await getPromptsGET(req as any);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.templates[0].stepName).toBe("outline");
    expect(json.templates[1].stepName).toBe("section");
    expect(json.data.templates[0].id).toBe("tmpl-uuid-0001");
  });

  // ─── ERROR HANDLING ────────────────────────────────────────────────────────

  it("5. Handles unexpected service crash with clean 500 status", async () => {
    mockPromptsService.listTemplates.mockRejectedValue(new Error("DB pool timeout"));

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.ADMIN.AI.PROMPTS}`, {
      method: "GET",
    });

    const res = await getPromptsGET(req as any);
    expect(res.status).toBe(500);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.INTERNAL);
    expect(json.error.message).toBe(AI_PROMPTS_ERRORS.LIST_FAILED);
  });
});

describe("PATCH /api/admin/ai/prompts — Black Box Integration Tests", () => {
  let mockAuthService: any;
  let mockPromptsService: any;

  const editorSession = {
    userId: "editor-uuid-aaaa",
    email: "editor@techsonance.co.in",
    role: "editor",
    site: { id: "site-uuid-1111" },
  };

  const viewerSession = {
    userId: "viewer-uuid-bbbb",
    email: "viewer@techsonance.co.in",
    role: "viewer",
    site: { id: "site-uuid-1111" },
  };

  const TEMPLATE_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

  const updatedTemplate = {
    id: TEMPLATE_ID,
    siteId: "site-uuid-1111",
    stepName: "outline",
    version: 1,
    systemPrompt: "Updated system prompt text.",
    userPromptTemplate: "Topic: {{topic}}",
    modelPreference: "gemini-2.5-pro",
    temperature: 80,
    isActive: true,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-11-07"),
  };

  beforeEach(() => {
    resetRootContainer();

    mockAuthService = {
      getCurrentSession: vi.fn().mockResolvedValue(editorSession),
      hasPermission: vi.fn().mockReturnValue(true),
    };

    mockPromptsService = {
      listTemplates: vi.fn().mockResolvedValue([]),
      updateTemplate: vi.fn().mockResolvedValue(updatedTemplate),
    };

    const container = getContainer();
    container.bind({ provide: AdminAuthService, useValue: mockAuthService as any });
    container.bind({ provide: AdminPromptsService, useValue: mockPromptsService as any });
  });

  const makeUrl = (id?: string) => {
    const base = `http://localhost:3000${API_ENDPOINTS.ADMIN.AI.PROMPTS}`;
    return id ? `${base}?id=${id}` : base;
  };

  const makePatchReq = (url: string, body: unknown = {}, extraHeaders: Record<string, string> = {}) =>
    new Request(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...extraHeaders },
      body: JSON.stringify(body),
    });

  // ─── SECURITY & ORIGIN TESTS ───────────────────────────────────────────────

  it("6. Rejects request with foreign origin with 403 Forbidden (PATCH)", async () => {
    const req = new Request(makeUrl(TEMPLATE_ID), {
      method: "PATCH",
      headers: { origin: "https://evil.site", "Content-Type": "application/json" },
      body: JSON.stringify({ systemPrompt: "New system prompt content here." }),
    });

    const res = await patchPromptsPATCH(req as any);
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
    expect(json.error.message).toBe(AI_PROMPTS_ERRORS.FORBIDDEN_ORIGIN);
  });

  // ─── AUTHENTICATION TESTS ──────────────────────────────────────────────────

  it("7. Rejects unauthenticated PATCH with 401", async () => {
    mockAuthService.getCurrentSession.mockResolvedValue(null);

    const res = await patchPromptsPATCH(makePatchReq(makeUrl(TEMPLATE_ID), { systemPrompt: "Updated prompt text." }) as any);
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.UNAUTHENTICATED);
  });

  // ─── AUTHORIZATION TESTS ───────────────────────────────────────────────────

  it("8. Rejects viewer role PATCH with 403 Forbidden (Editor+ required)", async () => {
    mockAuthService.getCurrentSession.mockResolvedValue(viewerSession);
    mockAuthService.hasPermission.mockReturnValue(false);

    const res = await patchPromptsPATCH(makePatchReq(makeUrl(TEMPLATE_ID), { systemPrompt: "Updated prompt text." }) as any);
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.FORBIDDEN);
    expect(json.error.message).toBe(AI_PROMPTS_ERRORS.FORBIDDEN_ROLE);
  });

  // ─── VALIDATION TESTS ──────────────────────────────────────────────────────

  it("9. Returns 422 when id query param is missing or invalid UUID", async () => {
    const res = await patchPromptsPATCH(makePatchReq(makeUrl("not-a-uuid"), { systemPrompt: "Updated prompt text." }) as any);
    expect(res.status).toBe(422);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.VALIDATION);
    expect(json.error.message).toBe(AI_PROMPTS_ERRORS.INVALID_ID);
  });

  it("10. Returns 422 when body fields violate schema constraints", async () => {
    // systemPrompt below minimum length
    const res = await patchPromptsPATCH(makePatchReq(makeUrl(TEMPLATE_ID), { systemPrompt: "short" }) as any);
    expect(res.status).toBe(422);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.VALIDATION);
  });

  // ─── SUCCESSFUL UPDATE TESTS ───────────────────────────────────────────────

  it("11. Returns 200 OK with updated template for editor role", async () => {
    const res = await patchPromptsPATCH(
      makePatchReq(makeUrl(TEMPLATE_ID), {
        systemPrompt: "Updated system prompt text.",
        modelPreference: "gemini-2.5-pro",
        temperature: 80,
      }) as any,
    );
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.template.id).toBe(TEMPLATE_ID);
    expect(json.data.template.systemPrompt).toBe("Updated system prompt text.");
    expect(json.template.id).toBe(TEMPLATE_ID);
    expect(json.message).toBe(AI_PROMPTS_MESSAGES.TEMPLATE_UPDATED);
    expect(mockPromptsService.updateTemplate).toHaveBeenCalledWith(TEMPLATE_ID, {
      systemPrompt: "Updated system prompt text.",
      modelPreference: "gemini-2.5-pro",
      temperature: 80,
    });
  });

  // ─── NOT FOUND TESTS ───────────────────────────────────────────────────────

  it("12. Returns 404 when template with given ID does not exist", async () => {
    mockPromptsService.updateTemplate.mockResolvedValue(null);

    const res = await patchPromptsPATCH(
      makePatchReq(makeUrl(TEMPLATE_ID), { systemPrompt: "Updated system prompt text." }) as any,
    );
    expect(res.status).toBe(404);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.NOT_FOUND);
    expect(json.error.message).toBe(AI_PROMPTS_ERRORS.TEMPLATE_NOT_FOUND);
  });

  // ─── ERROR HANDLING ────────────────────────────────────────────────────────

  it("13. Handles unexpected service crash with clean 500 on PATCH", async () => {
    mockPromptsService.updateTemplate.mockRejectedValue(new Error("DB write failure"));

    const res = await patchPromptsPATCH(
      makePatchReq(makeUrl(TEMPLATE_ID), { systemPrompt: "Updated system prompt text." }) as any,
    );
    expect(res.status).toBe(500);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe(ErrorCode.INTERNAL);
    expect(json.error.message).toBe(AI_PROMPTS_ERRORS.UPDATE_FAILED);
  });
});
