import "server-only";
import { headers } from "next/headers";

export async function getRequestId(): Promise<string> {
  try {
    const h = await headers();
    const reqId = h.get("x-request-id");
    if (reqId) return reqId;
  } catch {
    // Falling back if called outside a request context
  }
  return crypto.randomUUID();
}
