import "server-only";
import { inject } from "@needle-di/core";
import { and, count, eq, ilike } from "drizzle-orm";
import { DRIZZLE_DB_TOKEN } from "@/lib/di/tokens";
import type { Database } from "@/lib/database/index";
import { withTransaction } from "@/lib/database/transaction";
import {
  postsTable,
  auditLogsTable,
  versionsTable,
  sitesTable,
  type Post,
  type InsertPost,
  type InsertAuditLog,
  type InsertContentVersion,
} from "@/lib/database/schema/index.schema";
import { mapDbError } from "@/lib/dbErrors";

export interface ListAdminPostsOptions {
  siteId?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ListAdminPostsResult {
  posts: Post[];
  total: number;
}

export class AdminPostsRepository {
  constructor(private db: Database = inject(DRIZZLE_DB_TOKEN)) {}

  /**
   * Retrieves the default site ID or provisions a fallback agency site record.
   */
  async getDefaultSiteId(): Promise<string> {
    try {
      const existing = await this.db.query.sitesTable.findFirst();
      if (existing) return existing.id;

      const [created] = await this.db
        .insert(sitesTable)
        .values({
          name: "TechSonance Infotech LLP",
          slug: "techsonance-infotech-llp",
          domain: "techsonance.co.in",
        })
        .returning();

      return created.id;
    } catch (err) {
      throw mapDbError(err, {
        context: "AdminPostsRepository.getDefaultSiteId",
      });
    }
  }

  /**
   * Lists posts using Drizzle RQB v2 object syntax.
   * Returns row types directly per rule 12 §2.7.
   */
  async listPosts(options: ListAdminPostsOptions = {}): Promise<ListAdminPostsResult> {
    const limit = options.limit ?? 20;
    const offset = options.offset ?? 0;

    try {
      const whereObj: { siteId?: string; status?: string } = {};
      if (options.siteId) whereObj.siteId = options.siteId;
      if (options.status) whereObj.status = options.status;

      const hasFilters = Object.keys(whereObj).length > 0;
      const conditions = [];
      if (whereObj.siteId) conditions.push(eq(postsTable.siteId, whereObj.siteId));
      if (whereObj.status) conditions.push(eq(postsTable.status, whereObj.status));

      const [posts, totalResult] = await Promise.all([
        this.db.query.postsTable.findMany({
          orderBy: { createdAt: "desc" },
          limit,
          offset,
          with: { category: true },
          ...(hasFilters ? { where: whereObj } : {}),
        }),
        conditions.length > 0
          ? this.db
              .select({ cnt: count() })
              .from(postsTable)
              .where(and(...conditions))
          : this.db.select({ cnt: count() }).from(postsTable),
      ]);

      let filteredPosts = (posts as Post[]) || [];
      if (options.search && options.search.trim()) {
        const searchLower = options.search.trim().toLowerCase();
        filteredPosts = filteredPosts.filter((p) => p.title?.toLowerCase().includes(searchLower));
      }

      return {
        posts: filteredPosts,
        total: totalResult[0]?.cnt ?? filteredPosts.length,
      };
    } catch (error) {
      throw mapDbError(error, {
        context: "AdminPostsRepository.listPosts",
      });
    }
  }

  /**
   * Finds a post by ID with relations.
   */
  async findPostById(id: string): Promise<Post | null> {
    if (!id || !id.trim()) return null;

    try {
      const post = await this.db.query.postsTable.findFirst({
        where: { id },
        with: { category: true },
      });

      return (post as Post) ?? null;
    } catch (error) {
      throw mapDbError(error, {
        context: "AdminPostsRepository.findPostById",
        id,
      });
    }
  }

  /**
   * Finds a post by unique slug.
   */
  async findPostBySlug(slug: string): Promise<Post | null> {
    if (!slug || !slug.trim()) return null;

    try {
      const post = await this.db.query.postsTable.findFirst({
        where: { slug: slug.trim() },
        with: { category: true },
      });

      return (post as Post) ?? null;
    } catch (error) {
      throw mapDbError(error, {
        context: "AdminPostsRepository.findPostBySlug",
      });
    }
  }

  /**
   * Creates a post and records audit log + version snapshot atomically.
   */
  async createPostWithAudit(
    data: InsertPost,
    auditData?: Partial<InsertAuditLog>,
    versionData?: Partial<InsertContentVersion>,
  ): Promise<Post> {
    try {
      return await withTransaction(
        async (tx) => {
          const [created] = await tx.insert(postsTable).values(data).returning();

          if (auditData) {
            await tx.insert(auditLogsTable).values({
              action: auditData.action || "CREATE",
              entityType: auditData.entityType || "post",
              ...auditData,
              entityId: created.id,
              afterState: created as unknown as Record<string, unknown>,
            });
          }

          if (versionData) {
            await tx.insert(versionsTable).values({
              entityType: versionData.entityType || "post",
              ...versionData,
              entityId: created.id,
              snapshot: created as unknown as Record<string, unknown>,
            });
          }

          return created;
        },
        { database: this.db },
      );
    } catch (error) {
      throw mapDbError(error, {
        context: "AdminPostsRepository.createPostWithAudit",
      });
    }
  }

  /**
   * Updates a post and captures audit log + version snapshot atomically.
   */
  async updatePostWithAudit(
    id: string,
    updates: Partial<InsertPost>,
    auditData?: Partial<InsertAuditLog>,
    versionData?: Partial<InsertContentVersion>,
  ): Promise<Post | null> {
    try {
      return await withTransaction(
        async (tx) => {
          const [updated] = await tx
            .update(postsTable)
            .set({
              ...updates,
              updatedAt: new Date(),
            })
            .where(eq(postsTable.id, id))
            .returning();

          if (!updated) return null;

          if (auditData) {
            await tx.insert(auditLogsTable).values({
              action: auditData.action || "UPDATE",
              entityType: auditData.entityType || "post",
              ...auditData,
              entityId: id,
              afterState: updated as unknown as Record<string, unknown>,
            });
          }

          if (versionData) {
            await tx.insert(versionsTable).values({
              entityType: versionData.entityType || "post",
              ...versionData,
              entityId: id,
              snapshot: updated as unknown as Record<string, unknown>,
            });
          }

          return updated;
        },
        { database: this.db },
      );
    } catch (error) {
      throw mapDbError(error, {
        context: "AdminPostsRepository.updatePostWithAudit",
        id,
      });
    }
  }

  /**
   * Deletes a post with an audit log record.
   */
  async deletePostWithAudit(id: string, auditData?: Partial<InsertAuditLog>): Promise<boolean> {
    try {
      return await withTransaction(
        async (tx) => {
          const [deleted] = await tx.delete(postsTable).where(eq(postsTable.id, id)).returning();

          if (!deleted) return false;

          if (auditData) {
            await tx.insert(auditLogsTable).values({
              action: auditData.action || "DELETE",
              entityType: auditData.entityType || "post",
              entityId: id,
              ...auditData,
            });
          }

          return true;
        },
        { database: this.db },
      );
    } catch (error) {
      throw mapDbError(error, {
        context: "AdminPostsRepository.deletePostWithAudit",
        id,
      });
    }
  }
}
