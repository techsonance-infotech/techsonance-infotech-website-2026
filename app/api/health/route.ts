import { getContainer } from "@/lib/di/container";
import { LLMHealthService } from "@/lib/services/llm-health.service";
import { LLMProviderService } from "@/lib/services/llm-provider.service";
import { RAGService } from "@/lib/services/rag.service";
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

  const container = getContainer();
  const healthService = container.get(LLMHealthService);
  const providerService = container.get(LLMProviderService);
  const ragService = container.get(RAGService);

  const providers = providerService.getProviders();
  const providerStatuses = [];

  for (const p of providers) {
    const enabled = p.enabled();
    const rec = await healthService.getRecord(p.id);
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

  const kbStats = ragService.getKBStats();

  return new Response(
    JSON.stringify({
      status: "healthy",
      timestampIST: istTime,
      knowledgeBase: kbStats,
      providers: providerStatuses,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
