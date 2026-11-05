import "server-only";
import { inject } from "@needle-di/core";
import { revalidateTag } from "next/cache";
import {
  AdminPostsRepository,
  type ListAdminPostsOptions,
} from "@/lib/repositories/admin-posts.repository";
import type { Post, InsertPost } from "@/lib/database/schema/index.schema";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";

export interface ListPostsOptions extends ListAdminPostsOptions {}

export interface ListPostsResult {
  posts: Post[];
  total: number;
}

export class AdminPostsService {
  constructor(private postsRepo: AdminPostsRepository = inject(AdminPostsRepository)) {}

  async listPosts(options: ListPostsOptions = {}): Promise<ListPostsResult> {
    try {
      return await this.postsRepo.listPosts(options);
    } catch (error) {
      logger.error("AdminPostsService.listPosts error", { error: String(error) });
      return { posts: [], total: 0 };
    }
  }

  async getPostById(id: string): Promise<Post | null> {
    try {
      return await this.postsRepo.findPostById(id);
    } catch (error) {
      logger.error("AdminPostsService.getPostById error", { id, error: String(error) });
      return null;
    }
  }

  async createPost(data: InsertPost, actorId?: string, ipAddress?: string): Promise<Post> {
    const auditData = {
      actorId,
      action: "post.create",
      entityType: "post",
      entityId: "",
      ipAddress,
    };

    const versionData = {
      entityType: "post",
      entityId: "",
      changedBy: actorId,
    };

    return this.postsRepo.createPostWithAudit(data, auditData, versionData);
  }

  async updatePost(
    id: string,
    updates: Partial<InsertPost>,
    actorId?: string,
    ipAddress?: string,
  ): Promise<Post> {
    const existing = await this.getPostById(id);
    if (!existing) {
      throw new AppError("NOT_FOUND", `Post with id "${id}" not found`);
    }

    const nextVersionId = (existing.versionId || 1) + 1;
    const finalUpdates = {
      ...updates,
      versionId: nextVersionId,
      updatedBy: actorId ?? existing.updatedBy,
    };

    const auditData = {
      actorId,
      action: "post.update",
      entityType: "post",
      entityId: id,
      beforeState: existing as unknown as Record<string, unknown>,
      ipAddress,
    };

    const versionData = {
      entityType: "post",
      entityId: id,
      changedBy: actorId,
    };

    const updated = await this.postsRepo.updatePostWithAudit(
      id,
      finalUpdates,
      auditData,
      versionData,
    );
    if (!updated) {
      throw new AppError("NOT_FOUND", `Post with id "${id}" not found`);
    }

    if (updated.status === "PUBLISHED" || existing.status === "PUBLISHED") {
      this.revalidatePostCache(updated.slug);
    }

    return updated;
  }

  async publishPost(id: string, actorId?: string, ipAddress?: string): Promise<Post> {
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

  async submitForReview(id: string, actorId?: string, ipAddress?: string): Promise<Post> {
    return this.updatePost(
      id,
      {
        status: "IN_REVIEW",
      },
      actorId,
      ipAddress,
    );
  }

  async deletePost(id: string, actorId?: string, ipAddress?: string): Promise<boolean> {
    const existing = await this.getPostById(id);
    if (!existing) {
      return false;
    }

    const auditData = {
      actorId,
      action: "post.delete",
      entityType: "post",
      entityId: id,
      beforeState: existing as unknown as Record<string, unknown>,
      ipAddress,
    };

    const deleted = await this.postsRepo.deletePostWithAudit(id, auditData);
    if (deleted) {
      this.revalidatePostCache(existing.slug);
    }
    return deleted;
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
