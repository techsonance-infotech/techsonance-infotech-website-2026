import "server-only";
import { inject } from "@needle-di/core";
import { desc, eq } from "drizzle-orm";
import { DRIZZLE_DB_TOKEN } from "@/lib/di/tokens";
import type { Database } from "@/lib/database/index";
import {
  postsTable,
  authorsTable,
  jobsTable,
  type Post,
  type Author,
  type Job,
} from "@/lib/database/schema/index.schema";
import { JobStatus } from "@/lib/database/enum";
import { mapDbError } from "@/lib/dbErrors";

export class PublicContentRepository {
  constructor(private db: Database = inject(DRIZZLE_DB_TOKEN)) {}

  async findPublishedPosts() {
    try {
      return await this.db.query.postsTable.findMany({
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
    } catch (err) {
      throw mapDbError(err, { context: "PublicContentRepository.findPublishedPosts" });
    }
  }

  async findPostBySlug(slug: string) {
    if (!slug || !slug.trim()) return null;
    try {
      const post = await this.db.query.postsTable.findFirst({
        where: { slug: slug.trim() },
        with: { category: true },
      });
      return post ?? null;
    } catch (err) {
      throw mapDbError(err, { context: "PublicContentRepository.findPostBySlug", id: slug });
    }
  }

  async findPostSlugs(): Promise<string[]> {
    try {
      const posts = await this.db.query.postsTable.findMany({
        where: { status: "PUBLISHED" },
        columns: { slug: true },
      });
      return posts.map((p) => p.slug);
    } catch (err) {
      throw mapDbError(err, { context: "PublicContentRepository.findPostSlugs" });
    }
  }

  async findAllAuthors(): Promise<Author[]> {
    try {
      return await this.db.query.authorsTable.findMany();
    } catch (err) {
      throw mapDbError(err, { context: "PublicContentRepository.findAllAuthors" });
    }
  }

  async findPublishedJobs(status: JobStatus = JobStatus.OPEN): Promise<Job[]> {
    try {
      return await this.db.query.jobsTable.findMany({
        where: {
          status: status as unknown as undefined,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } catch (err) {
      throw mapDbError(err, { context: "PublicContentRepository.findPublishedJobs" });
    }
  }

  async findJobBySlug(slug: string): Promise<Job | null> {
    if (!slug || !slug.trim()) return null;
    try {
      const job = await this.db.query.jobsTable.findFirst({
        where: { slug: slug.trim() },
      });
      return job ?? null;
    } catch (err) {
      throw mapDbError(err, { context: "PublicContentRepository.findJobBySlug", id: slug });
    }
  }

  async findJobSlugs(): Promise<string[]> {
    try {
      const jobs = await this.db.query.jobsTable.findMany({
        where: {
          status: JobStatus.OPEN as unknown as undefined,
        },
        columns: { slug: true },
      });
      return jobs.map((j) => j.slug);
    } catch (err) {
      throw mapDbError(err, { context: "PublicContentRepository.findJobSlugs" });
    }
  }
}
