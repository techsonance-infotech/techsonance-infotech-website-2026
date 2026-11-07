import { z } from "zod";
import { PostStatus } from "@/lib/constants/enums";
import type { BlogPost, BlogPostAuthor } from "@/lib/content/types";

const defaultAuthor: BlogPostAuthor = {
  name: "TechSonance Team",
  role: "Engineering",
  avatar: "TS",
};

export const publicBlogPostAuthorSchema = z
  .object({
    name: z.string().trim().min(1).catch("TechSonance Team"),
    role: z.string().trim().min(1).catch("Engineering"),
    avatar: z.string().catch("TS"),
  })
  .loose();

export const publicBlogPostFaqSchema = z
  .object({
    question: z.string().catch(""),
    answer: z.string().catch(""),
  })
  .loose();

export const publicBlogPostSeoSchema = z
  .object({
    metaTitle: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined)
      .catch(undefined),
    metaDescription: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined)
      .catch(undefined),
    canonical: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined)
      .catch(undefined),
    ogImage: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined)
      .catch(undefined),
    noindex: z
      .boolean()
      .nullish()
      .transform((v) => v ?? undefined)
      .catch(undefined),
  })
  .loose();

/**
 * Resilient schema for an individual public blog post.
 * Uses .catch() and .default() for non-critical fields so corrupt DB/API fields
 * gracefully fall back without causing a runtime white-screen crash.
 */
export const publicBlogPostBoundarySchema: z.ZodType<BlogPost> = z
  .object({
    slug: z.string().trim().min(1).catch("untitled-post"),
    title: z.string().trim().min(1).catch("Untitled Post"),
    excerpt: z.string().catch(""),
    content: z.string().catch(""),
    category: z.string().trim().catch("Software Engineering"),
    date: z.string().catch(() => new Date().toISOString().split("T")[0] || "2026-10-14"),
    readTime: z.string().catch("5 min read"),
    authors: z
      .array(publicBlogPostAuthorSchema)
      .nullish()
      .transform((v) => (v && v.length > 0 ? v : [defaultAuthor]))
      .catch([defaultAuthor]),
    heroImage: z.string().catch("/images/og/blog.png"),
    tags: z
      .array(z.string().catch(""))
      .nullish()
      .transform((v) => (v ?? []).filter((t): t is string => typeof t === "string" && t.trim().length > 0))
      .catch([]),
    faqs: z
      .array(publicBlogPostFaqSchema)
      .nullish()
      .transform((v) => (v && v.length > 0 ? v : undefined))
      .catch(undefined),
    status: z
      .enum(PostStatus)
      .nullish()
      .transform((v) => v ?? PostStatus.PUBLISHED)
      .catch(PostStatus.PUBLISHED),
    publishedAt: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined)
      .catch(undefined),
    seo: publicBlogPostSeoSchema
      .nullish()
      .transform((v) => v ?? undefined)
      .catch(undefined),
  })
  .loose();

/**
 * Array parser with item-level isolation.
 * A malformed or corrupted blog post item is caught as null and filtered out,
 * ensuring the rest of the blog posts render without failure.
 */
export const publicBlogListBoundarySchema: z.ZodType<BlogPost[]> = z
  .array(z.unknown())
  .transform((items) => {
    const results: BlogPost[] = [];
    for (const item of items) {
      if (item && typeof item === "object") {
        const parsed = publicBlogPostBoundarySchema.safeParse(item);
        if (parsed.success) {
          results.push(parsed.data);
        }
      }
    }
    return results;
  });
