import { getEnv } from "./env";

export function sanitizeInput(text: string): string {
  if (!text) return "";
  return text
    .replace(/<[^>]*>?/gm, "") // Strip HTML tags
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Strip non-printable ASCII
    .trim();
}

export function escapeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function isAllowedOrigin(originHeader: string | null): boolean {
  if (!originHeader) return true; // Server-side or direct invocation

  let allowedList = ["http://localhost:3000", "https://www.techsonance.co.in", "https://techsonance.co.in"];
  try {
    const env = getEnv();
    if (env.ALLOWED_ORIGINS) {
      allowedList = env.ALLOWED_ORIGINS.split(",").map((s) => s.trim().toLowerCase());
    }
  } catch {
    // fallback
  }

  const cleanOrigin = originHeader.trim().toLowerCase();
  return (
    allowedList.includes(cleanOrigin) ||
    cleanOrigin.includes("localhost") ||
    cleanOrigin.includes("127.0.0.1") ||
    cleanOrigin.includes("techsonance.co.in")
  );
}
