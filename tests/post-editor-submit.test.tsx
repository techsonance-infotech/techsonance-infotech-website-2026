import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { PostEditor } from "@/components/admin/PostEditor";
import {
  submitPostForReview,
  publishPost,
  deletePost,
  getPostById,
  listPosts,
} from "@/lib/api/admin-posts.api";
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";
import type { AdminPost } from "@/lib/types/admin.types";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("Frontend Integration: Blog & Posts Management (Submit, Publish, Delete, List, Get)", () => {
  const sampleDraftPost: Partial<AdminPost> = {
    id: "c1111111-2222-4333-8444-555555555555",
    title: "Understanding Micro-Frontends in 2026",
    slug: "understanding-micro-frontends-2026",
    excerpt: "Architecting modular frontend architectures.",
    content: "Detailed markdown content discussing isolated builds and federation.",
    status: "DRAFT",
    tags: ["architecture", "react", "nextjs"],
    readTime: "4 min read",
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. submitPostForReview Client Function", () => {
    it("dispatches POST to centralized endpoint API_ENDPOINTS.ADMIN.BLOG.POST_SUBMIT(id)", async () => {
      const mockPost = {
        ...sampleDraftPost,
        status: "IN_REVIEW",
      };

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ok: true,
          data: { post: mockPost },
          post: mockPost,
          message: "Post submitted for editorial review successfully",
        }),
      });
      global.fetch = fetchMock;

      const result = await submitPostForReview(sampleDraftPost.id!);

      expect(fetchMock).toHaveBeenCalledWith(
        API_ENDPOINTS.ADMIN.BLOG.POST_SUBMIT(sampleDraftPost.id!),
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }),
      );

      expect(result.ok).toBe(true);
      expect(result.data.post.status).toBe("IN_REVIEW");
      expect(result.message).toBe("Post submitted for editorial review successfully");
    });

    it("throws appropriate error when backend rejects submission (e.g. 403 Forbidden or 400 Validation)", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          ok: false,
          error: {
            code: "FORBIDDEN",
            message: "Forbidden: author or higher required to submit posts.",
          },
        }),
      });
      global.fetch = fetchMock;

      await expect(submitPostForReview(sampleDraftPost.id!)).rejects.toThrow(
        "Forbidden: author or higher required to submit posts.",
      );
    });
  });

  describe("2. publishPost Client Function", () => {
    it("dispatches POST to centralized endpoint API_ENDPOINTS.ADMIN.BLOG.POST_PUBLISH(id)", async () => {
      const mockPost = {
        ...sampleDraftPost,
        status: "PUBLISHED",
        publishedAt: new Date().toISOString(),
      };

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ok: true,
          data: { post: mockPost },
          post: mockPost,
          message: "Post published successfully",
        }),
      });
      global.fetch = fetchMock;

      const result = await publishPost(sampleDraftPost.id!);

      expect(fetchMock).toHaveBeenCalledWith(
        API_ENDPOINTS.ADMIN.BLOG.POST_PUBLISH(sampleDraftPost.id!),
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }),
      );

      expect(result.ok).toBe(true);
      expect(result.data.post.status).toBe("PUBLISHED");
      expect(result.message).toBe("Post published successfully");
    });

    it("throws appropriate error when backend rejects publishing (e.g. 403 Forbidden: editor required)", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          ok: false,
          error: {
            code: "FORBIDDEN",
            message: "Forbidden: editor or higher required to publish posts.",
          },
        }),
      });
      global.fetch = fetchMock;

      await expect(publishPost(sampleDraftPost.id!)).rejects.toThrow(
        "Forbidden: editor or higher required to publish posts.",
      );
    });
  });

  describe("3. deletePost Client Function", () => {
    it("dispatches DELETE to centralized endpoint API_ENDPOINTS.ADMIN.BLOG.POST(id)", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ok: true,
          data: { success: true, message: "Post deleted successfully" },
          message: "Post deleted successfully",
        }),
      });
      global.fetch = fetchMock;

      const result = await deletePost(sampleDraftPost.id!);

      expect(fetchMock).toHaveBeenCalledWith(
        API_ENDPOINTS.ADMIN.BLOG.POST(sampleDraftPost.id!),
        expect.objectContaining({
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }),
      );

      expect(result.ok).toBe(true);
      expect(result.data.success).toBe(true);
    });

    it("throws appropriate error when post deletion fails", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          ok: false,
          error: {
            code: "FORBIDDEN",
            message: "Forbidden: editor or higher required to delete posts.",
          },
        }),
      });
      global.fetch = fetchMock;

      await expect(deletePost(sampleDraftPost.id!)).rejects.toThrow(
        "Forbidden: editor or higher required to delete posts.",
      );
    });
  });

  describe("4. listPosts and getPostById Client Functions", () => {
    it("listPosts builds search and filter query parameters correctly", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ok: true,
          data: { posts: [sampleDraftPost], total: 1 },
          posts: [sampleDraftPost],
          total: 1,
        }),
      });
      global.fetch = fetchMock;

      const result = await listPosts({ status: "DRAFT", search: "Micro-Frontends" });
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("status=DRAFT&search=Micro-Frontends"),
        expect.any(Object),
      );
      expect(result.posts).toHaveLength(1);
    });

    it("getPostById fetches single post details correctly", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ok: true,
          data: { post: sampleDraftPost },
          post: sampleDraftPost,
        }),
      });
      global.fetch = fetchMock;

      const post = await getPostById(sampleDraftPost.id!);
      expect(fetchMock).toHaveBeenCalledWith(
        API_ENDPOINTS.ADMIN.BLOG.POST(sampleDraftPost.id!),
        expect.any(Object),
      );
      expect(post.title).toBe("Understanding Micro-Frontends in 2026");
    });
  });

  describe("5. PostEditor React Hook Form State & Header Action Bar Integration", () => {
    it("renders DRAFT article with React Hook Form values, displaying Delete, Submit, Save, and Publish buttons", () => {
      const html = renderToString(<PostEditor initialPost={sampleDraftPost} isNew={false} />);

      expect(html).toContain("Understanding Micro-Frontends in 2026");
      expect(html).toContain("understanding-micro-frontends-2026");
      expect(html).toContain("DRAFT");
      expect(html).toContain("Submit for Review");
      expect(html).toContain("Save Draft");
      expect(html).toContain("Publish to Live Site");
      expect(html).toContain("Delete");
    });

    it("does not render Delete button for brand new unsaved article (isNew=true)", () => {
      const html = renderToString(<PostEditor isNew={true} />);

      expect(html).toContain("New Blog Article");
      expect(html).not.toContain(">Delete<");
      expect(html).toContain("Save Draft");
    });

    it("hides 'Submit for Review' button when article status is already IN_REVIEW", () => {
      const inReviewPost: Partial<AdminPost> = {
        ...sampleDraftPost,
        status: "IN_REVIEW",
      };

      const html = renderToString(<PostEditor initialPost={inReviewPost} isNew={false} />);

      expect(html).toContain("IN_REVIEW");
      expect(html).not.toContain("Submit for Review");
      expect(html).toContain("Save Draft");
      expect(html).toContain("Publish to Live Site");
    });

    it("displays 'Republish Live Site' and hides 'Submit for Review' when article status is PUBLISHED", () => {
      const publishedPost: Partial<AdminPost> = {
        ...sampleDraftPost,
        status: "PUBLISHED",
      };

      const html = renderToString(<PostEditor initialPost={publishedPost} isNew={false} />);

      expect(html).toContain("PUBLISHED");
      expect(html).not.toContain("Submit for Review");
      expect(html).toContain("Save Draft");
      expect(html).toContain("Republish Live Site");
    });

    it("dynamically computes word count and estimated read time from content", () => {
      const longContentPost: Partial<AdminPost> = {
        ...sampleDraftPost,
        content: new Array(450).fill("word").join(" "),
      };

      const html = renderToString(<PostEditor initialPost={longContentPost} isNew={false} />);

      expect(html).toMatch(/450.*words/);
      expect(html).toContain("3 min read");
    });
  });
});
