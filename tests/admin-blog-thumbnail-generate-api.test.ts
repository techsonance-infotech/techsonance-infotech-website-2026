import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/admin/blog/thumbnail/generate/route";
import { getContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { ImageStepService } from "@/lib/services/image/image-step.service";
import { AdminPostsRepository } from "@/lib/repositories/admin-posts.repository";

describe("POST /api/admin/blog/thumbnail/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is unauthenticated", async () => {
    const mockAuthService = {
      getCurrentSession: vi.fn().mockResolvedValue(null),
    };

    const container = getContainer();
    vi.spyOn(container, "get").mockImplementation((token: any) => {
      if (token === AdminAuthService) return mockAuthService as any;
      return {} as any;
    });

    const req = new Request("http://localhost:3000/api/admin/blog/thumbnail/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "My Great Article" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.ok).toBe(false);
  });

  it("generates thumbnail successfully for authenticated admin", async () => {
    const mockAuthService = {
      getCurrentSession: vi.fn().mockResolvedValue({
        user: { id: "00000000-0000-0000-0000-000000000001", email: "admin@techsonance.com" },
      }),
    };

    const mockImageStepService = {
      generateThumbnail: vi.fn().mockResolvedValue({
        url: "https://res.cloudinary.com/techsonance/image/upload/v1/test.webp",
        provider: "pollinations",
        prompt: "Minimalist modern tech editorial illustration: Next.js 16 Needle DI",
        alt: "Illustration representing Production Multi-Agent Workflows",
        thumbnailMissing: false,
      }),
    };

    const mockPostsRepo = {
      findPostById: vi.fn().mockResolvedValue(null),
      updatePostWithAudit: vi
        .fn()
        .mockResolvedValue({ id: "e6b440c9-f3f6-4cc4-b9ae-42a391d8098d" }),
    };

    const container = getContainer();
    vi.spyOn(container, "get").mockImplementation((token: any) => {
      if (token === AdminAuthService) return mockAuthService as any;
      if (token === ImageStepService) return mockImageStepService as any;
      if (token === AdminPostsRepository) return mockPostsRepo as any;
      return {} as any;
    });

    const req = new Request("http://localhost:3000/api/admin/blog/thumbnail/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postId: "e6b440c9-f3f6-4cc4-b9ae-42a391d8098d",
        title: "Production Multi-Agent Workflows with Next.js 16 & Needle DI",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.url).toBe("https://res.cloudinary.com/techsonance/image/upload/v1/test.webp");
    expect(json.data.provider).toBe("pollinations");
    expect(mockPostsRepo.updatePostWithAudit).toHaveBeenCalled();
  });

  it("generatePostThumbnail client helper correctly parses unwrapped envelope data without schema error", async () => {
    const { generatePostThumbnail } = await import("@/lib/api/admin-posts.api");

    // Mock global fetch to return an API envelope { ok: true, data: { ... } }
    const mockApiResponse = {
      ok: true,
      data: {
        url: "https://res.cloudinary.com/demo/image/upload/hero.jpg",
        provider: "pollinations",
        prompt: "Clean isometric servers",
        alt: "Hero graphic",
        thumbnailMissing: false,
      },
    };

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(mockApiResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const clientRes = await generatePostThumbnail({
      postId: "test-id",
      title: "Clean isometric servers",
    });

    expect(clientRes.ok).toBe(true);
    expect(clientRes.data.url).toBe("https://res.cloudinary.com/demo/image/upload/hero.jpg");
    expect(clientRes.data.thumbnailMissing).toBe(false);
    fetchSpy.mockRestore();
  });
});
