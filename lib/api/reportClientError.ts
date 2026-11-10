import { logger } from "@/lib/logger";

export function reportClientError(error: Error, metadata: Record<string, unknown> = {}): void {
  // Redacted client error logging
  if (process.env.NODE_ENV !== "production") {
    logger.error("[reportClientError] " + error.message, { ...metadata, error });
  }
}
