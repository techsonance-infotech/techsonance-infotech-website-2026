import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";

export interface MediaUploadResult {
  secureUrl: string;
  publicId: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
}

/**
 * Uploads a binary media asset (cover image, thumbnail, avatar) to CDN storage.
 * Endpoint: POST /api/admin/media/upload
 * Contract: uploadMediaContract
 */
export async function uploadMediaAsset(
  file: File,
  folder: string = "blog/media",
): Promise<MediaUploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const res = await fetch(API_ENDPOINTS.ADMIN.MEDIA_UPLOAD, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  const json = await res.json();
  if (!res.ok || !json.ok) {
    const errorMsg = json.error?.message || json.message || "Failed to upload image";
    throw new Error(errorMsg);
  }

  return (
    json.data || {
      secureUrl: json.secureUrl,
      publicId: json.publicId,
      format: json.format,
      width: json.width,
      height: json.height,
      bytes: json.bytes,
    }
  );
}
