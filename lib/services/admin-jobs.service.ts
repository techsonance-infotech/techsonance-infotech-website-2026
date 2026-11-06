import "server-only";
import { inject } from "@needle-di/core";
import { revalidateTag } from "next/cache";
import {
  AdminJobsRepository,
  type ListAdminJobsOptions,
} from "@/lib/repositories/admin-jobs.repository";
import type { Job, InsertJob, ContentVersion } from "@/lib/database/schema/index.schema";
import { JobStatus, JobApprovalStatus } from "../database/enum";
import { AppError, ErrorCode } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { CAREER_ERRORS, CAREER_AUDIT_ACTIONS } from "@/lib/constants/careers.constants";

export interface ListJobsOptions extends ListAdminJobsOptions {}

export interface ListJobsResult {
  jobs: Job[];
  total: number;
}

export class AdminJobsService {
  constructor(private jobsRepo: AdminJobsRepository = inject(AdminJobsRepository)) {}

  async listJobs(options: ListJobsOptions = {}): Promise<ListJobsResult> {
    try {
      return await this.jobsRepo.listJobs(options);
    } catch (error: any) {
      logger.error("AdminJobsService.listJobs error", {
        error: String(error),
        cause: error?.cause ? String(error.cause?.message || error.cause) : undefined,
      });
      throw error;
    }
  }

  async getJobById(id: string): Promise<Job | null> {
    if (!id || !id.trim()) return null;
    return this.jobsRepo.findJobById(id);
  }

  async createJob(data: InsertJob, actorId?: string, ipAddress?: string): Promise<Job> {
    if (!data.title || !data.slug) {
      throw new AppError(ErrorCode.VALIDATION, CAREER_ERRORS.JOB_TITLE_AND_SLUG_REQUIRED);
    }

    const sanitizedData: InsertJob = {
      ...data,
      ownerId:
        data.ownerId && typeof data.ownerId === "string" && data.ownerId.trim()
          ? data.ownerId.trim()
          : undefined,
      hiringManagerId:
        data.hiringManagerId && typeof data.hiringManagerId === "string" && data.hiringManagerId.trim()
          ? data.hiringManagerId.trim()
          : undefined,
    };

    const validActorId =
      actorId && actorId.trim() && actorId !== "00000000-0000-0000-0000-000000000000"
        ? actorId
        : undefined;

    const auditData = {
      actorId: validActorId,
      action: CAREER_AUDIT_ACTIONS.JOB_CREATE,
      entityType: "job",
      entityId: "",
      ipAddress,
    };

    const versionData = {
      entityType: "job",
      entityId: "",
      changedBy: validActorId,
    };

    return this.jobsRepo.createJobWithAudit(sanitizedData, auditData, versionData);
  }

  async updateJob(
    id: string,
    updates: Partial<InsertJob>,
    actorId?: string,
    ipAddress?: string,
  ): Promise<Job> {
    const existing = await this.getJobById(id);
    if (!existing) {
      throw new AppError(ErrorCode.NOT_FOUND, CAREER_ERRORS.JOB_NOT_FOUND);
    }

    const nextVersionId = (existing.versionId || 1) + 1;
    const finalUpdates: Partial<InsertJob> = {
      ...updates,
      versionId: nextVersionId,
      ownerId:
        updates.ownerId !== undefined
          ? updates.ownerId && typeof updates.ownerId === "string" && updates.ownerId.trim()
            ? updates.ownerId.trim()
            : null
          : undefined,
      hiringManagerId:
        updates.hiringManagerId !== undefined
          ? updates.hiringManagerId && typeof updates.hiringManagerId === "string" && updates.hiringManagerId.trim()
            ? updates.hiringManagerId.trim()
            : null
          : undefined,
    };

    const validActorId =
      actorId && actorId.trim() && actorId !== "00000000-0000-0000-0000-000000000000"
        ? actorId
        : undefined;

    const auditData = {
      actorId: validActorId,
      action: CAREER_AUDIT_ACTIONS.JOB_UPDATE,
      entityType: "job",
      entityId: id,
      beforeState: existing as unknown as Record<string, unknown>,
      ipAddress,
    };

    const versionData = {
      entityType: "job",
      entityId: id,
      changedBy: validActorId,
    };

    const updated = await this.jobsRepo.updateJobWithAudit(
      id,
      finalUpdates,
      auditData,
      versionData,
    );
    if (!updated) {
      throw new AppError(ErrorCode.NOT_FOUND, CAREER_ERRORS.JOB_NOT_FOUND);
    }

    this.revalidateJobCache(updated.slug);
    return updated;
  }

  async transitionStatus(
    jobId: string,
    targetStatus: JobStatus,
    actor: { userId: string; role: string },
    comment?: string,
    ipAddress?: string,
  ): Promise<Job> {
    const existing = await this.getJobById(jobId);
    if (!existing) {
      throw new AppError(ErrorCode.NOT_FOUND, CAREER_ERRORS.JOB_NOT_FOUND);
    }

    if (existing.status === targetStatus) {
      return existing;
    }

    const currentStatus = existing.status;
    const role = (actor.role || "").toLowerCase();
    const isAdminOrOwner = role === "admin" || role === "owner";
    const isRecruiter = role === "recruiter" || role === "editor";

    if (!isAdminOrOwner && !isRecruiter) {
      throw new AppError(ErrorCode.FORBIDDEN, CAREER_ERRORS.FORBIDDEN_ROLE_TRANSITION);
    }

    // Enforce 7-status state machine transitions
    switch (currentStatus) {
      case JobStatus.DRAFT:
        if (targetStatus === JobStatus.IN_REVIEW) {
          break;
        }
        if (targetStatus === JobStatus.PUBLISHED || targetStatus === JobStatus.OPEN) {
          if (!isAdminOrOwner) {
            throw new AppError(ErrorCode.BAD_REQUEST, CAREER_ERRORS.RECRUITER_APPROVAL_REQUIRED);
          }
          break;
        }
        throw new AppError(
          ErrorCode.BAD_REQUEST,
          `Illegal transition from ${currentStatus} to ${targetStatus}`,
        );

      case JobStatus.IN_REVIEW:
        if (!isAdminOrOwner) {
          throw new AppError(ErrorCode.FORBIDDEN, CAREER_ERRORS.FORBIDDEN_ROLE_APPROVE);
        }
        if (targetStatus === JobStatus.SCHEDULED) {
          if (!existing.publishAt) {
            throw new AppError(ErrorCode.BAD_REQUEST, CAREER_ERRORS.CANNOT_SCHEDULE_WITHOUT_DATE);
          }
          break;
        }
        if (
          targetStatus === JobStatus.PUBLISHED ||
          targetStatus === JobStatus.OPEN ||
          targetStatus === JobStatus.DRAFT
        ) {
          break;
        }
        throw new AppError(
          ErrorCode.BAD_REQUEST,
          `Illegal transition from ${currentStatus} to ${targetStatus}`,
        );

      case JobStatus.SCHEDULED:
        if (
          targetStatus === JobStatus.PUBLISHED ||
          targetStatus === JobStatus.OPEN ||
          targetStatus === JobStatus.DRAFT
        ) {
          break;
        }
        throw new AppError(
          ErrorCode.BAD_REQUEST,
          `Illegal transition from ${currentStatus} to ${targetStatus}`,
        );

      case JobStatus.PUBLISHED:
      case JobStatus.OPEN:
        if (targetStatus === JobStatus.PAUSED || targetStatus === JobStatus.CLOSED) {
          break;
        }
        throw new AppError(
          ErrorCode.BAD_REQUEST,
          `Illegal transition from ${currentStatus} to ${targetStatus}`,
        );

      case JobStatus.PAUSED:
        if (
          targetStatus === JobStatus.PUBLISHED ||
          targetStatus === JobStatus.OPEN ||
          targetStatus === JobStatus.CLOSED
        ) {
          break;
        }
        throw new AppError(
          ErrorCode.BAD_REQUEST,
          `Illegal transition from ${currentStatus} to ${targetStatus}`,
        );

      case JobStatus.CLOSED:
        if (!isAdminOrOwner) {
          throw new AppError(ErrorCode.FORBIDDEN, CAREER_ERRORS.FORBIDDEN_ROLE_REOPEN);
        }
        if (
          targetStatus === JobStatus.ARCHIVED ||
          targetStatus === JobStatus.DRAFT ||
          targetStatus === JobStatus.PUBLISHED ||
          targetStatus === JobStatus.OPEN
        ) {
          break;
        }
        throw new AppError(
          ErrorCode.BAD_REQUEST,
          `Illegal transition from ${currentStatus} to ${targetStatus}`,
        );

      case JobStatus.ARCHIVED:
      default:
        throw new AppError(
          ErrorCode.BAD_REQUEST,
          `Illegal transition from ${currentStatus} to ${targetStatus}`,
        );
    }

    // Build status-specific fields
    const updates: Partial<InsertJob> = {
      status: targetStatus,
    };

    if (targetStatus === JobStatus.PUBLISHED || targetStatus === JobStatus.OPEN) {
      updates.publishedAt = existing.publishedAt || new Date();
      updates.approvalStatus = JobApprovalStatus.APPROVED;
      updates.closedAt = null;
    } else if (targetStatus === JobStatus.SCHEDULED) {
      updates.approvalStatus = JobApprovalStatus.APPROVED;
    } else if (targetStatus === JobStatus.CLOSED) {
      updates.closedAt = new Date();
    } else if (targetStatus === JobStatus.DRAFT && currentStatus === JobStatus.IN_REVIEW) {
      updates.approvalStatus = JobApprovalStatus.RETURNED;
      if (comment) {
        updates.approvalComment = comment;
      }
    } else if (targetStatus === JobStatus.DRAFT && currentStatus === JobStatus.CLOSED) {
      updates.approvalStatus = JobApprovalStatus.PENDING;
      updates.closedAt = null;
    } else if (targetStatus === JobStatus.IN_REVIEW) {
      updates.approvalStatus = JobApprovalStatus.PENDING;
    }

    return this.updateJob(jobId, updates, actor.userId, ipAddress);
  }

  async publishJob(id: string, actorId?: string, ipAddress?: string): Promise<Job> {
    return this.updateJob(
      id,
      {
        status: JobStatus.OPEN,
      },
      actorId,
      ipAddress,
    );
  }

  async closeJob(id: string, actorId?: string, ipAddress?: string): Promise<Job> {
    return this.updateJob(
      id,
      {
        status: JobStatus.CLOSED,
      },
      actorId,
      ipAddress,
    );
  }

  async deleteJob(id: string, actorId?: string, ipAddress?: string): Promise<boolean> {
    const existing = await this.getJobById(id);
    if (!existing) {
      return false;
    }

    const auditData = {
      actorId,
      action: CAREER_AUDIT_ACTIONS.JOB_DELETE,
      entityType: "job",
      entityId: id,
      beforeState: existing as unknown as Record<string, unknown>,
      ipAddress,
    };

    const deleted = await this.jobsRepo.deleteJobWithAudit(id, auditData);
    if (deleted) {
      this.revalidateJobCache(existing.slug);
    }
    return deleted;
  }

  async approveJob(
    jobId: string,
    actorId?: string,
    comment?: string,
    ipAddress?: string,
  ): Promise<Job> {
    const existing = await this.getJobById(jobId);
    if (!existing) {
      throw new AppError(ErrorCode.NOT_FOUND, CAREER_ERRORS.JOB_NOT_FOUND);
    }

    const isFuturePublish =
      existing.publishAt && new Date(existing.publishAt).getTime() > Date.now();
    const targetStatus = isFuturePublish ? JobStatus.SCHEDULED : JobStatus.PUBLISHED;
    const nextVersionId = (existing.versionId || 1) + 1;

    const updates = {
      status: targetStatus,
      approvalStatus: JobApprovalStatus.APPROVED,
      approvalComment: comment || null,
      publishedAt: targetStatus === JobStatus.PUBLISHED ? new Date() : null,
      versionId: nextVersionId,
      updatedAt: new Date(),
    };

    const auditData = {
      actorId,
      action: CAREER_AUDIT_ACTIONS.JOB_APPROVE,
      entityType: "job",
      entityId: jobId,
      beforeState: existing as unknown as Record<string, unknown>,
      ipAddress,
    };

    const versionData = {
      entityType: "job",
      entityId: jobId,
      changedBy: actorId,
    };

    const updated = await this.jobsRepo.updateJobWithAudit(jobId, updates, auditData, versionData);
    if (!updated) {
      throw new AppError(ErrorCode.NOT_FOUND, CAREER_ERRORS.JOB_NOT_FOUND);
    }

    this.revalidateJobCache(updated.slug);
    return updated;
  }

  async returnJob(
    jobId: string,
    comment: string,
    actorId?: string,
    ipAddress?: string,
  ): Promise<Job> {
    if (!comment || !comment.trim()) {
      throw new AppError(ErrorCode.BAD_REQUEST, CAREER_ERRORS.RETURN_FEEDBACK_REQUIRED);
    }

    const existing = await this.getJobById(jobId);
    if (!existing) {
      throw new AppError(ErrorCode.NOT_FOUND, CAREER_ERRORS.JOB_NOT_FOUND);
    }

    const nextVersionId = (existing.versionId || 1) + 1;
    const updates = {
      status: JobStatus.DRAFT,
      approvalStatus: JobApprovalStatus.RETURNED,
      approvalComment: comment.trim(),
      versionId: nextVersionId,
      updatedAt: new Date(),
    };

    const auditData = {
      actorId,
      action: CAREER_AUDIT_ACTIONS.JOB_RETURN,
      entityType: "job",
      entityId: jobId,
      beforeState: existing as unknown as Record<string, unknown>,
      ipAddress,
    };

    const versionData = {
      entityType: "job",
      entityId: jobId,
      changedBy: actorId,
    };

    const updated = await this.jobsRepo.updateJobWithAudit(jobId, updates, auditData, versionData);
    if (!updated) {
      throw new AppError(ErrorCode.NOT_FOUND, CAREER_ERRORS.JOB_NOT_FOUND);
    }

    this.revalidateJobCache(updated.slug);
    return updated;
  }

  async listVersions(jobId: string): Promise<ContentVersion[]> {
    return this.jobsRepo.listJobVersions(jobId);
  }

  async restoreVersion(
    jobId: string,
    versionId: string,
    actorId?: string,
    ipAddress?: string,
  ): Promise<Job> {
    const existing = await this.getJobById(jobId);
    if (!existing) {
      throw new AppError(ErrorCode.NOT_FOUND, CAREER_ERRORS.JOB_NOT_FOUND);
    }

    const versions = await this.listVersions(jobId);
    const targetVersion = versions.find((v) => v.id === versionId);
    if (!targetVersion || !targetVersion.snapshot) {
      throw new AppError(ErrorCode.NOT_FOUND, `Version "${versionId}" not found for job "${jobId}"`);
    }

    const snapshot = targetVersion.snapshot as Record<string, unknown>;
    const nextVersionId = (existing.versionId || 1) + 1;

    const { id: _id, createdAt: _c, updatedAt: _u, ...restSnapshot } = snapshot;
    const updates = {
      ...restSnapshot,
      versionId: nextVersionId,
      updatedAt: new Date(),
    };

    const auditData = {
      actorId,
      action: CAREER_AUDIT_ACTIONS.JOB_RESTORE_VERSION,
      entityType: "job",
      entityId: jobId,
      beforeState: existing as unknown as Record<string, unknown>,
      ipAddress,
    };

    const versionData = {
      entityType: "job",
      entityId: jobId,
      changedBy: actorId,
    };

    const updated = await this.jobsRepo.updateJobWithAudit(jobId, updates, auditData, versionData);
    if (!updated) {
      throw new AppError(ErrorCode.NOT_FOUND, CAREER_ERRORS.JOB_NOT_FOUND);
    }

    this.revalidateJobCache(updated.slug);
    return updated;
  }

  private revalidateJobCache(slug?: string): void {
    try {
      revalidateTag("jobs", "default");
      if (slug) {
        revalidateTag(`job:${slug}`, "default");
      }
    } catch {
      // Degrades safely outside Next.js request context
    }
  }
}
