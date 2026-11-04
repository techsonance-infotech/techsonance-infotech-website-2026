import { unstable_cache } from "next/cache";
import { blogPosts } from "@/data/blog";
import { getContainer } from "../di/container";
import { ContentDbService } from "../services/content-db.service";
import { getEnv } from "../env";
import type { BlogPost, PostSource } from "./types";

// ─── Cache helper that degrades safely outside of Next.js server runtime ─────
function safeCache<Args extends unknown[], R>(
  fn: (...args: Args) => Promise<R>,
  keyParts?: string[],
  options?: { revalidate?: number | false; tags?: string[] }
): (...args: Args) => Promise<R> {
  let cached: ((...args: Args) => Promise<R>) | null = null;
  try {
    cached = unstable_cache(
      fn as unknown as Parameters<typeof unstable_cache>[0],
      keyParts,
      options
    ) as (...args: Args) => Promise<R>;
  } catch {
    return fn;
  }
  return async (...args: Args): Promise<R> => {
    try {
      if (cached) {
        return await cached(...args);
      }
    } catch {
      // Degrades when incrementalCache is missing (e.g. in vitest, scripts, or non-Next contexts)
    }
    return await fn(...args);
  };
}

// ─── Normalizer for Legacy Blog Data ─────────────────────────────────────────
function normalizeLegacyPost(raw: (typeof blogPosts)[number]): BlogPost {
  let publishedAt: string | undefined;
  try {
    const parsed = new Date(raw.date);
    if (!Number.isNaN(parsed.getTime())) {
      publishedAt = parsed.toISOString();
    }
  } catch {
    publishedAt = undefined;
  }

  return {
    slug: raw.slug,
    title: raw.title,
    excerpt: raw.excerpt,
    content: raw.content,
    category: raw.category,
    date: raw.date,
    readTime: raw.readTime,
    authors: raw.authors.map((a) => ({
      name: a.name,
      role: a.role,
      avatar: a.avatar,
    })),
    heroImage: raw.heroImage,
    tags: [...raw.tags],
    faqs: raw.faqs ? raw.faqs.map((f) => ({ question: f.question, answer: f.answer })) : undefined,
    status: "PUBLISHED",
    publishedAt,
    seo: {
      metaTitle: raw.title,
      metaDescription: raw.excerpt,
    },
  };
}

// ─── Legacy Post Source (In-Memory from data/blog.ts) ────────────────────────
export const legacyPostSource: PostSource = {
  async list(opts?: { category?: string; status?: string }): Promise<BlogPost[]> {
    let posts = blogPosts.map(normalizeLegacyPost);

    if (opts?.category) {
      const target = opts.category.toLowerCase().trim();
      posts = posts.filter((p) => p.category.toLowerCase().trim() === target);
    }

    if (opts?.status) {
      posts = posts.filter((p) => p.status === opts.status);
    }

    return posts;
  },

  async get(slug: string): Promise<BlogPost | null> {
    const post = blogPosts.find((p) => p.slug === slug);
    return post ? normalizeLegacyPost(post) : null;
  },

  async slugs(): Promise<string[]> {
    return blogPosts.map((p) => p.slug);
  },
};

// ─── CMS Database Fetchers (Delegates to ContentDbService via DI) ────────────
async function fetchCmsPostsRaw(category?: string): Promise<BlogPost[]> {
  try {
    const db = getContainer().get(ContentDbService);
    return await db.fetchPublishedPosts(category);
  } catch {
    return [];
  }
}

async function fetchCmsPostBySlugRaw(slug: string): Promise<BlogPost | null> {
  try {
    const db = getContainer().get(ContentDbService);
    return await db.fetchPostBySlug(slug);
  } catch {
    return null;
  }
}

async function fetchCmsSlugsRaw(): Promise<string[]> {
  try {
    const db = getContainer().get(ContentDbService);
    return await db.fetchPostSlugs();
  } catch {
    return [];
  }
}

// ─── Cached CMS Fetchers with Next.js Tags ───────────────────────────────────
const getCachedCmsPosts = safeCache(
  fetchCmsPostsRaw,
  ["cms-posts-list"],
  { tags: ["posts"], revalidate: 3600 }
);

const getCachedCmsPostBySlug = safeCache(
  fetchCmsPostBySlugRaw,
  ["cms-post-by-slug"],
  { tags: ["posts"], revalidate: 3600 }
);

const getCachedCmsSlugs = safeCache(
  fetchCmsSlugsRaw,
  ["cms-posts-slugs"],
  { tags: ["posts"], revalidate: 3600 }
);

// ─── CMS Post Source ─────────────────────────────────────────────────────────
export const cmsPostSource: PostSource = {
  async list(opts?: { category?: string }): Promise<BlogPost[]> {
    return getCachedCmsPosts(opts?.category);
  },

  async get(slug: string): Promise<BlogPost | null> {
    return getCachedCmsPostBySlug(slug);
  },

  async slugs(): Promise<string[]> {
    return getCachedCmsSlugs();
  },
};

// ─── Factory: Source Selector ────────────────────────────────────────────────
export function getPostSource(): PostSource {
  try {
    const env = getEnv();
    if (env.CONTENT_SOURCE_BLOG === "cms") {
      return cmsPostSource;
    }
  } catch {
    if (process.env.CONTENT_SOURCE_BLOG === "cms") {
      return cmsPostSource;
    }
  }
  return legacyPostSource;
}
