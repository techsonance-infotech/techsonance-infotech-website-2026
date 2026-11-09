const SENSITIVE_KEY_PATTERN =
  /(api_?key|password|secret|token|authorization|bearer|ciphertext|iv|auth_?tag)/i;

function serializeLogValue(key: string, value: unknown): unknown {
  if (value === null || value === undefined) return value;

  // Redact secrets while allowing identifiers (e.g., accountId, keyVersion, requestId)
  if (
    SENSITIVE_KEY_PATTERN.test(key) &&
    typeof value === "string" &&
    value.length > 0 &&
    !key.toLowerCase().endsWith("id") &&
    key.toLowerCase() !== "keyversion"
  ) {
    return "[REDACTED]";
  }

  if (value instanceof Error) {
    const errorDetails: Record<string, unknown> = {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
    if ("code" in value) {
      errorDetails.code = (value as { code?: unknown }).code;
    }
    if ("cause" in value && value.cause) {
      errorDetails.cause =
        value.cause instanceof Error
          ? {
              name: value.cause.name,
              message: value.cause.message,
              stack: value.cause.stack,
            }
          : value.cause;
    }
    // Include enumerable properties (e.g. from AppError or PostgresError)
    for (const prop of Object.keys(value)) {
      if (!(prop in errorDetails)) {
        errorDetails[prop] = Reflect.get(value, prop);
      }
    }
    return errorDetails;
  }

  return value;
}

function formatContext(context?: Record<string, unknown>): string {
  if (!context) return "";
  try {
    return JSON.stringify(context, (k, v) => serializeLogValue(k, v));
  } catch {
    return String(context);
  }
}

export const logger = {
  info: (message: string, context?: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== "test") {
      console.log(`[INFO] ${message}`, formatContext(context));
    }
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    console.warn(`[WARN] ${message}`, formatContext(context));
  },
  error: (message: string, context?: Record<string, unknown>) => {
    console.error(`[ERROR] ${message}`, formatContext(context));
  },
  debug: (message: string, context?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === "development") {
      console.debug(`[DEBUG] ${message}`, formatContext(context));
    }
  },
};
