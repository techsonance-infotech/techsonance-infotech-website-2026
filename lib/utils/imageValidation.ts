/**
 * imageValidation.ts
 * Deep binary inspection and MIME verification for media assets.
 * Validates magic bytes to prevent disguised executable or malicious uploads.
 */

import {
  ALLOWED_IMAGE_MIME_TYPES,
  type AllowedImageMimeType,
} from "@/lib/constants/media.constants";

export interface ImageValidationResult {
  isValid: boolean;
  detectedFormat?: string;
  error?: string;
}

export function validateImageMagicBytes(
  buffer: Buffer | Uint8Array,
  declaredMimeType?: string,
): ImageValidationResult {
  if (!buffer || buffer.length < 4) {
    return { isValid: false, error: "File buffer is too small to be a valid image." };
  }

  const bytes = buffer instanceof Buffer ? buffer : Buffer.from(buffer);

  // 1. JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { isValid: true, detectedFormat: "jpeg" };
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { isValid: true, detectedFormat: "png" };
  }

  // 3. GIF: 47 49 46 38 ("GIF8")
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return { isValid: true, detectedFormat: "gif" };
  }

  // 4. WebP: RIFF....WEBP (52 49 46 46 .... 57 45 42 50)
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { isValid: true, detectedFormat: "webp" };
  }

  // 5. AVIF: ....ftypavif or ....ftypavis
  if (
    bytes.length >= 12 &&
    bytes[4] === 0x66 &&
    bytes[5] === 0x74 &&
    bytes[6] === 0x79 &&
    bytes[7] === 0x70
  ) {
    const brand = bytes.subarray(8, 12).toString("ascii");
    if (brand === "avif" || brand === "avis") {
      return { isValid: true, detectedFormat: "avif" };
    }
  }

  // 6. SVG: XML or <svg text tag
  const textPrefix = bytes.subarray(0, Math.min(bytes.length, 512)).toString("utf8").trimStart();
  if (
    textPrefix.startsWith("<svg") ||
    (textPrefix.startsWith("<?xml") && textPrefix.includes("<svg"))
  ) {
    return { isValid: true, detectedFormat: "svg" };
  }

  return {
    isValid: false,
    error: `Declared type "${declaredMimeType || "unknown"}" failed binary magic byte inspection.`,
  };
}

export function isAllowedImageMimeType(mimeType: string): mimeType is AllowedImageMimeType {
  return (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(mimeType.toLowerCase());
}
