import { inject } from "@needle-di/core";
import { DRIZZLE_DB_TOKEN } from "../di/tokens";
import type { Database } from "../database/index";
import type { BlogPost, BlogPostStatus, JobPosting, JobStatus } from "../content/types";

/**
 * Production Content Database Service
 * Fully type-safe Drizzle ORM query service with compile-time relation joins
 * and Needle DI container injection.
 */
export class ContentDbService {
  constructor(
    private db: Database = inject(DRIZZLE_DB_TOKEN)
  ) {}

  getDb(): Database {
    return this.db;
  }

  async fetchPublishedPosts(category?: string): Promise<BlogPost[]> {
    try {
      const postsData = await this.db.query.postsTable.findMany({
        where: {
          status: "PUBLISHED",
        },
        with: {
          category: true,
        },
        orderBy: {
          publishedAt: "desc",
        },
      });

      if (!postsData || postsData.length === 0) return [];

      const authorsData = await this.db.query.authorsTable.findMany();
      const authorMap = new Map<string, { name: string; role: string; avatar: string }>();
      for (const a of authorsData) {
        authorMap.set(a.id, {
          name: a.name,
          role: a.role || "Team TechSonance",
          avatar: a.avatar || "TS",
        });
      }

      const posts: BlogPost[] = postsData.map((row) => {
        const catName = row.category?.name || "Software Engineering";
        const resolvedAuthors = Array.isArray(row.authorIds)
          ? row.authorIds
              .map((id) => authorMap.get(id))
              .filter((a): a is { name: string; role: string; avatar: string } => !!a)
          : [];

        const authors =
          resolvedAuthors.length > 0
            ? resolvedAuthors
            : [{ name: "TechSonance Team", role: "Engineering", avatar: "TS" }];

        const publishedDate = row.publishedAt || row.createdAt;
        const formattedDate = publishedDate
          ? new Date(publishedDate).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })
          : "Recent";

        return {
          slug: row.slug,
          title: row.title,
          excerpt: row.excerpt || "",
          content: row.content,
          category: catName,
          date: formattedDate,
          readTime: row.readTime || "5 min read",
          authors,
          heroImage: row.heroImage || "/images/blog/default.jpg",
          tags: Array.isArray(row.tags) ? row.tags : [],
          faqs: Array.isArray(row.faqs)
            ? (row.faqs as Array<{ question: string; answer: string }>)
            : undefined,
          status: row.status as BlogPostStatus,
          publishedAt: row.publishedAt
            ? row.publishedAt.toISOString()
            : row.createdAt
            ? row.createdAt.toISOString()
            : undefined,
          seo: row.seo as BlogPost["seo"],
        };
      });

      if (category) {
        const target = category.toLowerCase().trim();
        return posts.filter((p) => p.category.toLowerCase().trim() === target);
      }

      return posts;
    } catch {
      return [];
    }
  }

  async fetchPostBySlug(slug: string): Promise<BlogPost | null> {
    try {
      const row = await this.db.query.postsTable.findFirst({
        where: {
          slug,
        },
        with: {
          category: true,
        },
      });

      if (!row) return null;

      const authorsData = await this.db.query.authorsTable.findMany();
      const authorMap = new Map<string, { name: string; role: string; avatar: string }>();
      for (const a of authorsData) {
        authorMap.set(a.id, {
          name: a.name,
          role: a.role || "Team TechSonance",
          avatar: a.avatar || "TS",
        });
      }

      const resolvedAuthors = Array.isArray(row.authorIds)
        ? row.authorIds
            .map((id) => authorMap.get(id))
            .filter((a): a is { name: string; role: string; avatar: string } => !!a)
        : [];

      const authors =
        resolvedAuthors.length > 0
          ? resolvedAuthors
          : [{ name: "TechSonance Team", role: "Engineering", avatar: "TS" }];

      const publishedDate = row.publishedAt || row.createdAt;
      const formattedDate = publishedDate
        ? new Date(publishedDate).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        : "Recent";

      return {
        slug: row.slug,
        title: row.title,
        excerpt: row.excerpt || "",
        content: row.content,
        category: row.category?.name || "Software Engineering",
        date: formattedDate,
        readTime: row.readTime || "5 min read",
        authors,
        heroImage: row.heroImage || "/images/blog/default.jpg",
        tags: Array.isArray(row.tags) ? row.tags : [],
        faqs: Array.isArray(row.faqs)
          ? (row.faqs as Array<{ question: string; answer: string }>)
          : undefined,
        status: row.status as BlogPostStatus,
        publishedAt: row.publishedAt
          ? row.publishedAt.toISOString()
          : row.createdAt
          ? row.createdAt.toISOString()
          : undefined,
        seo: row.seo as BlogPost["seo"],
      };
    } catch {
      return null;
    }
  }

  async fetchPostSlugs(): Promise<string[]> {
    try {
      const posts = await this.db.query.postsTable.findMany({
        where: {
          status: "PUBLISHED",
        },
        columns: {
          slug: true,
        },
      });
      return posts.map((p) => p.slug);
    } catch {
      return [];
    }
  }

  async fetchJobs(status?: string): Promise<JobPosting[]> {
    try {
      const targetStatus = status || "OPEN";
      const jobs = await this.db.query.jobsTable.findMany({
        where: {
          status: targetStatus,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return jobs.map((row) => ({
        id: row.id,
        slug: row.slug,
        title: row.title,
        department: row.department,
        location: row.location,
        type: row.type,
        experienceLevel: row.experienceLevel || "Mid-Senior",
        description: row.description,
        responsibilities: Array.isArray(row.responsibilities) ? row.responsibilities : [],
        requirements: Array.isArray(row.requirements) ? row.requirements : [],
        benefits: Array.isArray(row.benefits) ? row.benefits : [],
        closesAt: row.closesAt ? row.closesAt.toISOString() : undefined,
        status: row.status as JobStatus,
      }));
    } catch {
      return [];
    }
  }

  async fetchJobBySlug(slug: string): Promise<JobPosting | null> {
    try {
      const row = await this.db.query.jobsTable.findFirst({
        where: {
          slug,
        },
      });

      if (!row) return null;

      return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        department: row.department,
        location: row.location,
        type: row.type,
        experienceLevel: row.experienceLevel || "Mid-Senior",
        description: row.description,
        responsibilities: Array.isArray(row.responsibilities) ? row.responsibilities : [],
        requirements: Array.isArray(row.requirements) ? row.requirements : [],
        benefits: Array.isArray(row.benefits) ? row.benefits : [],
        closesAt: row.closesAt ? row.closesAt.toISOString() : undefined,
        status: row.status as JobStatus,
      };
    } catch {
      return null;
    }
  }

  async fetchJobSlugs(): Promise<string[]> {
    try {
      const jobs = await this.db.query.jobsTable.findMany({
        where: {
          status: "OPEN",
        },
        columns: {
          slug: true,
        },
      });
      return jobs.map((j) => j.slug);
    } catch {
      return [];
    }
  }
}
