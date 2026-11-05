export const logger = {
  info: (message: string, context?: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== "test") {
      console.log(`[INFO] ${message}`, context ? JSON.stringify(context) : "");
    }
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    console.warn(`[WARN] ${message}`, context ? JSON.stringify(context) : "");
  },
  error: (message: string, context?: Record<string, unknown>) => {
    console.error(`[ERROR] ${message}`, context ? JSON.stringify(context) : "");
  },
  debug: (message: string, context?: Record<string, unknown>) => {
    if (process.env.DEBUG) {
      console.debug(`[DEBUG] ${message}`, context ? JSON.stringify(context) : "");
    }
  },
};
