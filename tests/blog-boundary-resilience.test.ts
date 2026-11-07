import { describe, it, expect } from "vitest";
import {
  SafeAdminPostsListResponseSchema,
  SafeAdminPostItemSchema,
  SafeAdminAiTopicsListResponseSchema,
  SafeAdminAiTopicItemSchema,
  SafeAdminAiJobsListResponseSchema,
} from "@/lib/validations/admin-blog-boundary.schema";
import { PostStatus } from "@/lib/constants/enums/content.enum";
import { AiTopicStatus } from "@/lib/constants/enums/ai.enum";

describe("Blog & AI Boundary Schema Resilience", () => {
  it("drops malformed post items while preserving valid records", () => {
    const rawPayload = {
      posts: [
        {
          id: "post-1",
          slug: "understanding-ai-agents",
          title: "Understanding AI Agents",
          status: PostStatus.PUBLISHED,
          readTime: "6 min read",
          updatedAt: "2026-03-01T10:00:00Z",
        },
        null,
        "unexpected-string-data",
        {
          id: "post-2",
          slug: null,
          title: null,
          status: "CORRUPTED_STATUS",
          readTime: null,
          updatedAt: null,
        },
      ],
      total: 4,
    };

    const parsed = SafeAdminPostsListResponseSchema.safeParse(rawPayload);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.posts.length).toBe(2);
      expect(parsed.data.posts[0].title).toBe("Understanding AI Agents");
      expect(parsed.data.posts[0].status).toBe(PostStatus.PUBLISHED);

      // Corrupted item is defensively sanitized with fallback values
      expect(parsed.data.posts[1].title).toBe("Untitled Article");
      expect(parsed.data.posts[1].slug).toBe("article");
      expect(parsed.data.posts[1].status).toBe(PostStatus.DRAFT);
      expect(parsed.data.posts[1].readTime).toBe("5 min read");
    }
  });

  it("handles null or empty post lists without throwing", () => {
    const emptyPayload = { posts: null, total: null };
    const parsed = SafeAdminPostsListResponseSchema.safeParse(emptyPayload);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.posts).toEqual([]);
      expect(parsed.data.total).toBe(0);
    }
  });

  it("sanitizes AI topic proposals with defensive defaults", () => {
    const rawTopic = {
      id: "topic-1",
      title: null,
      keywords: null,
      status: "INVALID_STATUS",
      priority: "NaN",
    };

    const parsed = SafeAdminAiTopicItemSchema.safeParse(rawTopic);
    expect(parsed.success).toBe(true);
    if (parsed.success && parsed.data) {
      expect(parsed.data.title).toBe("Untitled Topic");
      expect(parsed.data.keywords).toEqual([]);
      expect(parsed.data.status).toBe(AiTopicStatus.SUGGESTED);
      expect(parsed.data.priority).toBe(0);
    }
  });

  it("sanitizes AI generation job items gracefully", () => {
    const rawJobs = {
      jobs: [
        {
          id: "job-1",
          topicText: "AI Micro-Frontends",
          status: "PENDING",
        },
        null,
      ],
      total: 2,
    };

    const parsed = SafeAdminAiJobsListResponseSchema.safeParse(rawJobs);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.jobs.length).toBe(1);
      expect(parsed.data.jobs[0].topicText).toBe("AI Micro-Frontends");
    }
  });
});
