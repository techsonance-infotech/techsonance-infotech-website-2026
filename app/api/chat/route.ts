import { z } from "zod";
import { BOT_CONFIG } from "@/lib/config";
import { getContainer } from "@/lib/di/container";
import { RateLimiterService } from "@/lib/services/ratelimit.service";
import { RAGService } from "@/lib/services/rag.service";
import { LLMRouterService } from "@/lib/services/llm-router.service";
import { buildSystemPrompt } from "@/lib/prompt";
import { filterOutput } from "@/lib/rag/filter";
import { AllExhaustedError } from "@/lib/llm/types";
import { sanitizeInput, isAllowedOrigin } from "@/lib/text";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

const chatRequestSchema = z.object({
  sessionId: z.string().max(64),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(BOT_CONFIG.thresholds.maxInputChars),
      }),
    )
    .min(1)
    .max(BOT_CONFIG.thresholds.maxHistoryMessages),
});

export async function POST(req: Request) {
  const container = getContainer();
  const rateLimiter = container.get(RateLimiterService);
  const ragService = container.get(RAGService);
  const routerService = container.get(LLMRouterService);
  // 1. Origin Check
  const origin = req.headers.get("origin");
  if (!isAllowedOrigin(origin)) {
    return new Response(JSON.stringify({ error: "Forbidden origin" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2. IP Rate Limiting (20 msgs / 10 mins)
  const clientIp = rateLimiter.getClientIp(req);
  const rateCheck = await rateLimiter.check(`chat:${clientIp}`, BOT_CONFIG.rateLimits.chat);
  if (!rateCheck.success) {
    return new Response(
      JSON.stringify({
        error: "Too many messages. Please wait a moment or book a consultation call directly.",
        retryAfter: rateCheck.retryAfter,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(rateCheck.retryAfter || 60),
        },
      },
    );
  }

  // 3. Payload Validation
  let bodyJson: unknown;
  try {
    bodyJson = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parseResult = chatRequestSchema.safeParse(bodyJson);
  if (!parseResult.success) {
    return new Response(
      JSON.stringify({
        error: "Invalid request schema",
        details: parseResult.error.format(),
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const { messages } = parseResult.data;
  const lastUserMsgObj = messages.toReversed().find((m) => m.role === "user");

  if (!lastUserMsgObj) {
    return new Response(JSON.stringify({ error: "No user message found" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const cleanQuery = sanitizeInput(lastUserMsgObj.content);

  // 4. Relevance Gate Evaluation
  const gateResult = ragService.evaluateGate(cleanQuery);

  // Setup SSE stream response
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const sendSSE = async (event: string, data: unknown) => {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    await writer.write(encoder.encode(payload));
  };

  (async () => {
    try {
      if (gateResult.decision !== "IN_SCOPE") {
        // Fast Direct / Canned / Refusal Path (Zero token cost)
        const cannedText = gateResult.cannedReply || BOT_CONFIG.refusalText;
        const tokens = cannedText.match(/\r\n|\n|\S+|\s+/g) || [cannedText];

        for (const token of tokens) {
          await sendSSE("token", token);
          // Simulated natural streaming typing delay (8ms)
          await new Promise((r) => setTimeout(r, 8));
        }

        await sendSSE("meta", {
          chips: BOT_CONFIG.quickReplies,
          showBooking: gateResult.showBooking ?? false,
          mode: "normal",
        });
        await sendSSE("done", {});
        await writer.close();
        return;
      }

      // IN_SCOPE Path -> LLM Router
      const systemPrompt = buildSystemPrompt(gateResult.chunks || []);
      const llmMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
        { role: "system", content: systemPrompt },
        ...messages.slice(-6).map((m) => ({
          role: m.role,
          content: sanitizeInput(m.content),
        })),
      ];

      let rawOutput = "";
      try {
        let streamBuffer = "";
        for await (const chunk of routerService.routeChat({ messages: llmMessages })) {
          rawOutput += chunk;
          streamBuffer += chunk;

          // Suppress [[BOOKING]] token fragment while streaming
          if (streamBuffer.includes("[[") && !streamBuffer.includes("]]")) {
            continue; // Wait for complete tag before flushing
          }

          if (streamBuffer.includes("[[BOOKING]]")) {
            streamBuffer = streamBuffer.replace(/\[\[BOOKING\]\]/g, "");
          }

          if (streamBuffer.length > 0) {
            await sendSSE("token", streamBuffer);
            streamBuffer = "";
          }
        }

        // Flush any remaining buffered characters
        if (streamBuffer.length > 0) {
          const cleanTail = streamBuffer.replace(/\[\[BOOKING\]\]/g, "");
          if (cleanTail.length > 0) {
            await sendSSE("token", cleanTail);
          }
        }

        const filtered = filterOutput(rawOutput);
        await sendSSE("meta", {
          chips: BOT_CONFIG.quickReplies,
          showBooking: gateResult.showBooking || filtered.showBooking,
          mode: "normal",
        });
        await sendSSE("done", {});
      } catch (err: unknown) {
        if (err instanceof AllExhaustedError) {
          // Fallback to FAQ-only mode
          logger.warn("Chat LLM providers exhausted, entering FAQ-only mode", {
            earliestRetryAt: err.earliestRetryAt,
          });
          const fallbackText = `I am currently in direct-answer mode. ${BOT_CONFIG.exhaustedMessage}`;
          await sendSSE("token", fallbackText);
          await sendSSE("meta", {
            chips: BOT_CONFIG.quickReplies,
            showBooking: false,
            mode: "faq_only",
            retryAt: err.earliestRetryAt,
          });
          await sendSSE("done", {});
        } else {
          logger.error("Chat LLM router invocation unexpected error", {
            error: err instanceof Error ? err.message : String(err),
          });
          const errText = `I encountered an unexpected issue. Feel free to ask again or select an option below.`;
          await sendSSE("token", errText);
          await sendSSE("meta", {
            chips: BOT_CONFIG.quickReplies,
            showBooking: false,
            mode: "normal",
          });
          await sendSSE("done", {});
        }
      }
    } catch (streamErr) {
      // Catch any unexpected stream write errors
      logger.error("Chat SSE stream write error", {
        error: streamErr instanceof Error ? streamErr.message : String(streamErr),
      });
    } finally {
      try {
        await writer.close();
      } catch {
        // already closed
      }
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
