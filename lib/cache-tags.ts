export const CACHE_TAGS = {
  posts: "posts",
  post: (slug: string) => `post:${slug}`,
  categories: "categories",
  jobs: "jobs",
  job: (id: string) => `job:${id}`,
  topics: "ai-topics",
  settings: "settings",
} as const;

export type CacheTag = string;
