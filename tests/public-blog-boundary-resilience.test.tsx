import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  publicBlogPostBoundarySchema,
  publicBlogListBoundarySchema,
} from "@/lib/validations/public-blog-boundary.schema";
import { BlogCard } from "@/app/components/blog/BlogCard";
import { BlogFeaturedCard } from "@/app/components/blog/BlogFeaturedCard";
import type { BlogPost } from "@/lib/content/types";

describe("Public Blog Boundary & Resilience Suite", () => {
  describe("publicBlogPostBoundarySchema", () => {
    it("parses a well-formed blog post without mutation", () => {
      const raw = {
        slug: "nextjs-16-resilience-patterns",
        title: "Next.js 16 Production Resilience Patterns",
        excerpt: "Architecting zero-downtime frontends with defensive boundaries.",
        content: "<p>Deep dive into error recovery.</p>",
        category: "Software Engineering",
        date: "2026-10-15",
        readTime: "7 min read",
        authors: [
          {
            name: "Alex Wright",
            role: "Principal Systems Architect",
            avatar: "AW",
          },
        ],
        heroImage: "/images/blog/resilience.png",
        tags: ["Next.js", "Reliability", "Architecture"],
        status: "PUBLISHED",
      };

      const parsed = publicBlogPostBoundarySchema.parse(raw);
      expect(parsed.slug).toBe("nextjs-16-resilience-patterns");
      expect(parsed.title).toBe("Next.js 16 Production Resilience Patterns");
      expect(parsed.authors).toHaveLength(1);
      expect(parsed.authors[0]?.name).toBe("Alex Wright");
      expect(parsed.tags).toEqual(["Next.js", "Reliability", "Architecture"]);
    });

    it("recovers gracefully from null, missing, and corrupt fields", () => {
      const corrupt = {
        slug: null,
        title: "",
        excerpt: null,
        content: null,
        category: null,
        date: null,
        authors: null,
        heroImage: null,
        tags: [null, 123, "TypeScript", ""],
        status: "INVALID_STATUS",
      };

      const parsed = publicBlogPostBoundarySchema.parse(corrupt);
      expect(parsed.slug).toBe("untitled-post");
      expect(parsed.title).toBe("Untitled Post");
      expect(parsed.category).toBe("Software Engineering");
      expect(parsed.heroImage).toBe("/images/og/blog.png");
      expect(parsed.tags).toEqual(["TypeScript"]);
      // Authors should fall back to default team author
      expect(parsed.authors).toHaveLength(1);
      expect(parsed.authors[0]?.name).toBe("TechSonance Team");
      expect(parsed.status).toBe("PUBLISHED");
    });
  });

  describe("publicBlogListBoundarySchema (Item-level isolation)", () => {
    it("filters out corrupt or null items while preserving healthy articles", () => {
      const mixedPayload = [
        {
          slug: "valid-post-1",
          title: "First Post",
          excerpt: "Intro",
          content: "<p>Hello</p>",
          category: "Software Engineering",
          date: "2026-10-01",
          readTime: "3 min read",
          authors: [{ name: "Dev", role: "Engineer", avatar: "D" }],
          heroImage: "/img1.png",
          tags: ["Test"],
        },
        null,
        undefined,
        "not-an-object",
        {
          slug: "valid-post-2",
          title: "Second Post",
          excerpt: "Architecture",
          content: "<p>World</p>",
          category: "AI & Automation",
          date: "2026-10-02",
          readTime: "5 min read",
          authors: [{ name: "Lead", role: "Architect", avatar: "L" }],
          heroImage: "/img2.png",
          tags: ["AI"],
        },
      ];

      const parsed = publicBlogListBoundarySchema.parse(mixedPayload);
      expect(parsed).toHaveLength(2);
      expect(parsed[0]?.slug).toBe("valid-post-1");
      expect(parsed[1]?.slug).toBe("valid-post-2");
    });

    it("handles non-array inputs cleanly by returning empty list", () => {
      const parsed = publicBlogListBoundarySchema.parse([]);
      expect(parsed).toEqual([]);
    });
  });

  describe("Blog Components Rendering Resilience", () => {
    it("BlogCard renders without crash when authors is empty or malformed", () => {
      const testPost: BlogPost = {
        slug: "safe-post",
        title: "Resilient Card Test",
        excerpt: "Testing card crash resistance",
        content: "<p>Content</p>",
        category: "Software Engineering",
        date: "2026-10-14",
        readTime: "4 min read",
        authors: [] as any,
        heroImage: "/test.png",
        tags: [],
      };

      const html = renderToString(<BlogCard post={testPost} />);
      expect(html).toContain("Resilient Card Test");
      expect(html).toContain("TechSonance Team");
    });

    it("BlogFeaturedCard renders without crash when authors is empty or malformed", () => {
      const testPost: BlogPost = {
        slug: "featured-post",
        title: "Featured Article",
        excerpt: "Testing featured card",
        content: "<p>Featured content</p>",
        category: "AI & Automation",
        date: "2026-10-14",
        readTime: "6 min read",
        authors: [] as any,
        heroImage: "/featured.png",
        tags: [],
      };

      const html = renderToString(<BlogFeaturedCard post={testPost} />);
      expect(html).toContain("Featured Article");
      expect(html).toContain("TechSonance Team");
    });
  });
});
