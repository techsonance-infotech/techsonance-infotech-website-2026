export function reportClientError(error: Error, metadata: Record<string, unknown> = {}): void {
  // Redacted client error logging
  if (process.env.NODE_ENV !== "production") {
    console.error("[reportClientError]", error, metadata);
  }
}
