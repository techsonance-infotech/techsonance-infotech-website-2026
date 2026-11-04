import "server-only";
import { inject } from "@needle-di/core";
import { eq, and, ilike, count } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { DRIZZLE_DB_TOKEN } from "../di/tokens";
import type { Database } from "../database/index";
import { postsTable, type Post, type InsertPost } from "../database/schema/core/post.schema";
import { auditLogsTable } from "../database/schema/core/audit.schema";
import { versionsTable } from "../database/schema/core/version.schema";

export interface ListPostsOptions {
  siteId?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ListPostsResult {
  posts: Post[];
  total: number;
}

export class AdminPostsService {
  constructor(private db: Database = inject(DRIZZLE_DB_TOKEN)) {}

  async listPosts(options: ListPostsOptions = {}): Promise<ListPostsResult> {
    try {
      const limit = options.limit ?? 20;
      const offset = options.offset ?? 0;

      const whereObj: { siteId?: string; status?: string } = {};
      if (options.siteId) whereObj.siteId = options.siteId;
      if (options.status) whereObj.status = options.status;

      const hasFilters = Object.keys(whereObj).length > 0;

      const findManyConfig: {
        orderBy: { createdAt: "desc" };
        limit: number;
        offset: number;
        with: { category: true };
        where?: { siteId?: string; status?: string };
      } = {
        orderBy: { createdAt: "desc" },
        limit,
        offset,
        with: {
          category: true,
        },
      };

      if (hasFilters) {
        findManyConfig.where = whereObj;
      }

      const countConditions = [];
      if (options.siteId) {
        countConditions.push(eq(postsTable.siteId, options.siteId));
      }
      if (options.status) {
        countConditions.push(eq(postsTable.status, options.status));
      }
      if (options.search) {
        countConditions.push(ilike(postsTable.title, `%${options.search}%`));
      }

      const countWhereClause =
        countConditions.length > 0 ? and(...countConditions) : undefined;

      const [posts, totalResult] = await Promise.all([
        this.db.query.postsTable.findMany(findManyConfig),
        countWhereClause
          ? this.db.select({ cnt: count() }).from(postsTable).where(countWhereClause)
          : this.db.select({ cnt: count() }).from(postsTable),
      ]);

      let filteredPosts = posts as Post[];
      if (options.search) {
        const searchLower = options.search.toLowerCase();
        filteredPosts = filteredPosts.filter((p) =>
          p.title.toLowerCase().includes(searchLower),
        );
      }

      return {
        posts: filteredPosts,
        total: totalResult[0]?.cnt ?? 0,
      };
    } catch (error) {
      console.error("AdminPostsService.listPosts error:", error);
      return { posts: [], total: 0 };
    }
  }

  async getPostById(id: string): Promise<Post | null> {
    try {
      const post = await this.db.query.postsTable.findFirst({
        where: { id },
        with: {
          category: true,
        },
      });
      return (post as Post) || null;
    } catch (error) {
      console.error("AdminPostsService.getPostById error:", error);
      return null;
    }
  }

  async createPost(
    data: InsertPost,
    actorId?: string,
    ipAddress?: string,
  ): Promise<Post> {
    const [created] = await this.db.insert(postsTable).values(data).returning();

    // Audit log
    await this.db.insert(auditLogsTable).values({
      actorId,
      action: "post.create",
      entityType: "post",
      entityId: created.id,
      afterState: created as unknown as Record<string, unknown>,
      ipAddress,
    });

    // Version history
    await this.db.insert(versionsTable).values({
      entityType: "post",
      entityId: created.id,
      snapshot: created as unknown as Record<string, unknown>,
      changedBy: actorId,
    });

    return created;
  }

  async updatePost(
    id: string,
    updates: Partial<InsertPost>,
    actorId?: string,
    ipAddress?: string,
  ): Promise<Post> {
    const existing = await this.getPostById(id);
    if (!existing) {
      throw new Error(`Post with id "${id}" not found`);
    }

    const nextVersionId = (existing.versionId || 1) + 1;

    const [updated] = await this.db
      .update(postsTable)
      .set({
        ...updates,
        versionId: nextVersionId,
        updatedAt: new Date(),
        updatedBy: actorId ?? existing.updatedBy,
      })
      .where(eq(postsTable.id, id))
      .returning();

    // Audit log
    await this.db.insert(auditLogsTable).values({
      actorId,
      action: "post.update",
      entityType: "post",
      entityId: id,
      beforeState: existing as unknown as Record<string, unknown>,
      afterState: updated as unknown as Record<string, unknown>,
      ipAddress,
    });

    // Version record
    await this.db.insert(versionsTable).values({
      entityType: "post",
      entityId: id,
      snapshot: updated as unknown as Record<string, unknown>,
      changedBy: actorId,
    });

    // If published, on-demand revalidate
    if (updated.status === "PUBLISHED" || existing.status === "PUBLISHED") {
      this.revalidatePostCache(updated.slug);
    }

    return updated;
  }

  async publishPost(
    id: string,
    actorId?: string,
    ipAddress?: string,
  ): Promise<Post> {
    const updated = await this.updatePost(
      id,
      {
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
      actorId,
      ipAddress,
    );

    this.revalidatePostCache(updated.slug);
    return updated;
  }

  async submitForReview(
    id: string,
    actorId?: string,
    ipAddress?: string,
  ): Promise<Post> {
    return this.updatePost(
      id,
      {
        status: "IN_REVIEW",
      },
      actorId,
      ipAddress,
    );
  }

  async deletePost(
    id: string,
    actorId?: string,
    ipAddress?: string,
  ): Promise<boolean> {
    const existing = await this.getPostById(id);
    if (!existing) {
      return false;
    }

    await this.db.delete(postsTable).where(eq(postsTable.id, id));

    await this.db.insert(auditLogsTable).values({
      actorId,
      action: "post.delete",
      entityType: "post",
      entityId: id,
      beforeState: existing as unknown as Record<string, unknown>,
      ipAddress,
    });

    this.revalidatePostCache(existing.slug);
    return true;
  }

  private revalidatePostCache(slug?: string): void {
    try {
      revalidateTag("posts", "default");
      if (slug) {
        revalidateTag(`post:${slug}`, "default");
      }
    } catch {
      // Degrades safely outside Next.js request context (e.g. CLI or scripts)
    }
  }
}
