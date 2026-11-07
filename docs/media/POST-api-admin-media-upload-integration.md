# Frontend Integration Guide: POST /api/admin/media/upload

## 1. Overview & Business Purpose
The `POST /api/admin/media/upload` endpoint provides authenticated asset ingestion for blog post cover images, infographics, author avatars, and rich media content across the agency platform. It enforces multi-tier security defenses:
- **Origin Validation**: Guards against unauthorized cross-site requests.
- **RBAC Authorization**: Restricted to content creators (`author`, `editor`, `admin`, `owner`).
- **Deep Binary Magic-Byte Inspection**: Validates binary headers to prevent disguised executables or script injection.
- **Size Bounding**: Enforces a strict 10MB limit per uploaded asset.
- **CDN Cloudinary Integration**: Ingests files into organized folders (`blog/thumbnails`, `blog/media`, etc.) and returns optimized CDN URLs.

---

## 2. Endpoint Specification

### POST /api/admin/media/upload
Uploads a binary image file via multipart form data.

- **Method**: `POST`
- **Path**: `/api/admin/media/upload`
- **Constant**: `API_ENDPOINTS.ADMIN.MEDIA_UPLOAD`
- **Contract**: `uploadMediaContract` in `@/lib/contracts/media.contract`
- **Authentication**: Required (`author`, `editor`, `admin`, `owner`)
- **Content-Type**: `multipart/form-data`

#### Multipart Form Fields
| Field Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `file` | `File` (Binary) | Yes | Image file (JPEG, PNG, WebP, GIF, AVIF, SVG). Max 10MB. |
| `folder` | `string` | No | Target folder path (e.g. `"blog/thumbnails"`, `"blog/media"`). Defaults to `"blog/media"`. |

---

## 3. Response Envelopes & Status Codes

### Success Response (HTTP 201 Created)
```json
{
  "ok": true,
  "data": {
    "secureUrl": "https://res.cloudinary.com/techsonance/image/upload/v1731000000/blog/thumbnails/hero-nextjs.webp",
    "publicId": "blog/thumbnails/hero-nextjs",
    "format": "webp",
    "width": 1200,
    "height": 630,
    "bytes": 1048576
  },
  "secureUrl": "https://res.cloudinary.com/techsonance/image/upload/v1731000000/blog/thumbnails/hero-nextjs.webp",
  "publicId": "blog/thumbnails/hero-nextjs",
  "format": "webp",
  "width": 1200,
  "height": 630,
  "bytes": 1048576,
  "message": "Media asset uploaded successfully"
}
```

### Error Responses

#### 400 Bad Request (Missing File)
```json
{
  "ok": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "No file was provided in the upload request.",
    "requestId": "174013ba-7772-4fa7-8e72-9c6c44b01d87"
  },
  "code": "BAD_REQUEST"
}
```

#### 401 Unauthorized (No Session)
```json
{
  "ok": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Unauthorized access. Please log in as an administrator.",
    "requestId": "608e5737-2661-4213-af98-44d1fd7804f8"
  },
  "code": "UNAUTHENTICATED"
}
```

#### 403 Forbidden (Viewer Role / Origin Mismatch)
```json
{
  "ok": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Forbidden: your account does not have permission to upload media assets.",
    "requestId": "08b194e2-a1cf-44f5-b36a-24b2459ad03e"
  },
  "code": "FORBIDDEN"
}
```

#### 413 Payload Too Large (Exceeds 10MB)
```json
{
  "ok": false,
  "error": {
    "code": "PAYLOAD_TOO_LARGE",
    "message": "File size exceeds the maximum allowed limit of 10MB.",
    "requestId": "7eab6452-d71b-4df4-a935-533ccd8cfd80"
  },
  "code": "PAYLOAD_TOO_LARGE"
}
```

#### 415 Unsupported Media (Disguised File or Bad MIME)
```json
{
  "ok": false,
  "error": {
    "code": "UNSUPPORTED_MEDIA",
    "message": "File content does not match its declared image format. Magic byte inspection failed.",
    "requestId": "565b5bbe-5c45-4181-a091-ebe9774ffc86"
  },
  "code": "UNSUPPORTED_MEDIA"
}
```

---

## 4. TypeScript Client Implementation

```typescript
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";

export interface MediaUploadResult {
  secureUrl: string;
  publicId: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
}

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
    throw new Error(json.error?.message || "Failed to upload image");
  }

  return json.data || {
    secureUrl: json.secureUrl,
    publicId: json.publicId,
    format: json.format,
    width: json.width,
    height: json.height,
  };
}
```
