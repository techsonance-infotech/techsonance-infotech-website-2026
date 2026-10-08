import { health } from "@/lib/llm/health";
import { getProviders } from "@/lib/llm/providers";
import { kbChunks, faqList } from "@/lib/rag/kb";
import { getEnv } from "@/lib/env";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const secretParam = url.searchParams.get("secret");
  const secretHeader = req.headers.get("x-health-secret");

  try {
    const env = getEnv();
    if (env.HEALTH_SECRET) {
      if (secretParam !== env.HEALTH_SECRET && secretHeader !== env.HEALTH_SECRET) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
  } catch {
    // env not loaded
  }

  const providers = getProviders();
  const providerStatuses = [];

  for (const p of providers) {
    const enabled = p.enabled();
    const rec = await health.getRecord(p.id);
    providerStatuses.push({
      id: p.id,
      name: p.name,
      enabled,
      state: enabled ? rec.state : "DISABLED",
      nextTry: rec.nextTry > 0 ? new Date(rec.nextTry).toISOString() : null,
      consecutiveServerErrors: rec.consecutiveServerErrors,
    });
  }

  const istTime = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    dateStyle: "full",
    timeStyle: "medium",
  }).format(new Date());

  return new Response(
    JSON.stringify({
      status: "healthy",
      timestampIST: istTime,
      knowledgeBase: {
        totalChunks: kbChunks.length,
        faqCount: faqList.length,
      },
      providers: providerStatuses,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
