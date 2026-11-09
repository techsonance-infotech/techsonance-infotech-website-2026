import "server-only";
import { inject } from "@needle-di/core";
import crypto from "node:crypto";
import { getEnv, type Env } from "../env";
import { ENV_CONFIG_TOKEN } from "../di/tokens";

export interface MediaUploadOptions {
  folder?: string;
  publicId?: string;
  tags?: string[];
  eager?: string;
}

export interface MediaUploadResult {
  secureUrl: string;
  publicId: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
}

export interface BinnedMediaItem {
  publicId: string;
  binnedAt: string;
  purgeAt: string;
  retentionDays: number;
  reason?: string;
  status: "in_bin" | "purged" | "restored";
}

export interface TrashCleanupResult {
  checkedCount: number;
  purgedCount: number;
  purgedIds: string[];
}

export interface DeleteImageOptions {
  immediate?: boolean;
  retentionDays?: 15 | 30 | number;
  reason?: string;
}

export class MediaService {
  private static binnedLedger = new Map<string, BinnedMediaItem>();

  constructor(private env: Env = inject(ENV_CONFIG_TOKEN)) {}

  private getEffectiveEnv(): Env {
    return this.env || getEnv();
  }

  /**
   * Upload an image buffer or base64 data to Cloudinary via REST API.
   * Supports unsigned preset or signed upload when api_key + secret are available.
   */
  async uploadImage(
    fileBuffer: Buffer,
    options: MediaUploadOptions = {},
  ): Promise<MediaUploadResult> {
    const env = this.getEffectiveEnv();
    const cloudName = env.CLOUDINARY_CLOUD_NAME;

    if (!cloudName) {
      throw new Error("Cloudinary cloud name is not configured in CLOUDINARY_CLOUD_NAME");
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const form = new FormData();

    form.append("file", new Blob([new Uint8Array(fileBuffer)], { type: "image/jpeg" }));
    form.append("timestamp", timestamp.toString());

    if (options.folder) {
      form.append("folder", options.folder);
    }
    if (options.publicId) {
      form.append("public_id", options.publicId);
    }
    if (options.tags && options.tags.length > 0) {
      form.append("tags", options.tags.join(","));
    }
    if (options.eager) {
      form.append("eager", options.eager);
    }

    // Signed vs Unsigned upload
    if (env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
      form.append("api_key", env.CLOUDINARY_API_KEY);

      // Sign the params according to Cloudinary spec:
      // sorted alphabetically, key=val joined by &, then appended with api_secret
      const paramsToSign: Record<string, string> = {
        timestamp: timestamp.toString(),
      };
      if (options.folder) paramsToSign.folder = options.folder;
      if (options.publicId) paramsToSign.public_id = options.publicId;
      if (options.tags && options.tags.length > 0) paramsToSign.tags = options.tags.join(",");
      if (options.eager) paramsToSign.eager = options.eager;

      const sortedQuery = Object.keys(paramsToSign)
        .toSorted()
        .map((k) => `${k}=${paramsToSign[k]}`)
        .join("&");

      const stringToSign = `${sortedQuery}${env.CLOUDINARY_API_SECRET}`;
      const signature = crypto.createHash("sha1").update(stringToSign).digest("hex");
      form.append("signature", signature);
    } else {
      // Fallback to unsigned preset
      form.append("upload_preset", "blog_thumbnails");
    }

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Cloudinary upload failed (HTTP ${res.status}): ${errorText}`);
    }

    const data = (await res.json()) as {
      secure_url: string;
      public_id: string;
      format?: string;
      width?: number;
      height?: number;
      bytes?: number;
    };

    return {
      secureUrl: data.secure_url,
      publicId: data.public_id,
      format: data.format,
      width: data.width,
      height: data.height,
      bytes: data.bytes,
    };
  }

  /**
   * Moves an image to the recycle bin with a 15-day or 30-day retention period (default: 30 days).
   * Tags the asset in Cloudinary with 'bin' and records purge schedule before permanent cleanup.
   */
  async moveToBin(
    publicId: string,
    options: { retentionDays?: 15 | 30 | number; reason?: string } = {},
  ): Promise<boolean> {
    if (!publicId || !publicId.trim()) return false;

    const env = this.getEffectiveEnv();
    const cloudName = env.CLOUDINARY_CLOUD_NAME;

    const retentionDays = options.retentionDays === 15 ? 15 : (options.retentionDays ?? 30);
    const binnedAt = new Date();
    const purgeAt = new Date(binnedAt.getTime() + retentionDays * 24 * 60 * 60 * 1000);

    // Record into the recycle bin ledger
    MediaService.binnedLedger.set(publicId, {
      publicId,
      binnedAt: binnedAt.toISOString(),
      purgeAt: purgeAt.toISOString(),
      retentionDays,
      reason: options.reason || "Rejected or replaced blog image",
      status: "in_bin",
    });

    if (!cloudName || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
      // In development or when Cloudinary is not configured, ledger update succeeds
      return false;
    }

    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const tag = "bin";
      const command = "add";

      const paramsToSign = `command=${command}&public_ids=${publicId}&tag=${tag}&timestamp=${timestamp}${env.CLOUDINARY_API_SECRET}`;
      const signature = crypto.createHash("sha1").update(paramsToSign).digest("hex");

      const form = new FormData();
      form.append("command", command);
      form.append("tag", tag);
      form.append("public_ids", publicId);
      form.append("timestamp", timestamp.toString());
      form.append("api_key", env.CLOUDINARY_API_KEY);
      form.append("signature", signature);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/tags`, {
        method: "POST",
        body: form,
      });

      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Restores an image from the recycle bin back to active status.
   */
  async restoreFromBin(publicId: string): Promise<boolean> {
    if (!publicId || !publicId.trim()) return false;

    const env = this.getEffectiveEnv();
    const cloudName = env.CLOUDINARY_CLOUD_NAME;

    const item = MediaService.binnedLedger.get(publicId);
    if (item) {
      item.status = "restored";
      MediaService.binnedLedger.set(publicId, item);
    }

    if (!cloudName || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
      return false;
    }

    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const tag = "bin";
      const command = "remove";

      const paramsToSign = `command=${command}&public_ids=${publicId}&tag=${tag}&timestamp=${timestamp}${env.CLOUDINARY_API_SECRET}`;
      const signature = crypto.createHash("sha1").update(paramsToSign).digest("hex");

      const form = new FormData();
      form.append("command", command);
      form.append("tag", tag);
      form.append("public_ids", publicId);
      form.append("timestamp", timestamp.toString());
      form.append("api_key", env.CLOUDINARY_API_KEY);
      form.append("signature", signature);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/tags`, {
        method: "POST",
        body: form,
      });

      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Permanently hard-deletes an asset from Cloudinary (called after retention period expires).
   */
  async hardDeleteImage(publicId: string): Promise<boolean> {
    if (!publicId || !publicId.trim()) return false;

    const env = this.getEffectiveEnv();
    const cloudName = env.CLOUDINARY_CLOUD_NAME;

    if (!cloudName || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
      return false;
    }

    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}${env.CLOUDINARY_API_SECRET}`;
      const signature = crypto.createHash("sha1").update(paramsToSign).digest("hex");

      const form = new FormData();
      form.append("public_id", publicId);
      form.append("timestamp", timestamp.toString());
      form.append("api_key", env.CLOUDINARY_API_KEY);
      form.append("signature", signature);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
        method: "POST",
        body: form,
      });

      if (res.ok) {
        const item = MediaService.binnedLedger.get(publicId);
        if (item) {
          item.status = "purged";
          MediaService.binnedLedger.set(publicId, item);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Deletes an image with two-stage retention:
   * By default, safely moves the asset to the recycle bin for 15 or 30 days (default: 30 days).
   * If options.immediate is true, performs an immediate hard delete.
   */
  async deleteImage(publicId: string, options: DeleteImageOptions = {}): Promise<boolean> {
    if (options.immediate) {
      return this.hardDeleteImage(publicId);
    }
    return this.moveToBin(publicId, options);
  }

  /**
   * Sweeps the recycle bin and permanently destroys all images that have passed their 15 or 30-day retention window.
   */
  async cleanupExpiredTrash(): Promise<TrashCleanupResult> {
    const now = new Date();
    const purgedIds: string[] = [];
    let checkedCount = 0;

    for (const [id, item] of MediaService.binnedLedger.entries()) {
      if (item.status === "in_bin") {
        checkedCount++;
        const purgeDate = new Date(item.purgeAt);
        if (now >= purgeDate) {
          const success = await this.hardDeleteImage(id);
          if (success) {
            purgedIds.push(id);
          }
        }
      }
    }

    return {
      checkedCount,
      purgedCount: purgedIds.length,
      purgedIds,
    };
  }

  /**
   * Lists all media currently residing in the recycle bin.
   */
  listBin(): BinnedMediaItem[] {
    return Array.from(MediaService.binnedLedger.values()).filter(
      (item) => item.status === "in_bin",
    );
  }
}
