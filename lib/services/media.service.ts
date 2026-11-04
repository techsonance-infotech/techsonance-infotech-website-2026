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

export class MediaService {
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
}
