import { z } from "zod";
import { BOT_CONFIG } from "@/lib/config";
import { evaluateGate } from "@/lib/rag/gate";
import { buildSystemPrompt } from "@/lib/prompt";
import { routeChat } from "@/lib/llm/router";
import { filterOutput } from "@/lib/rag/filter";
import { AllExhaustedError } from "@/lib/llm/types";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";
import { sanitizeInput, isAllowedOrigin } from "@/lib/text";

export const runtime = "nodejs";

const chatRequestSchema = z.object({
  sessionId: z.string().max(64),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(BOT_CONFIG.thresholds.maxInputChars),
      })
    )
    .min(1)
    .max(BOT_CONFIG.thresholds.maxHistoryMessages),
});

export async function POST(req: Request) {
  // 1. Origin Check
  const origin = req.headers.get("origin");
  if (!isAllowedOrigin(origin)) {
    return new Response(JSON.stringify({ error: "Forbidden origin" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2. IP Rate Limiting (20 msgs / 10 mins)
  const clientIp = getClientIp(req);
  const rateCheck = await checkRateLimit(`chat:${clientIp}`, BOT_CONFIG.rateLimits.chat);
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
      }
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
      }
    );
  }

  const { messages } = parseResult.data;
  const lastUserMsgObj = [...messages].reverse().find((m) => m.role === "user");

  if (!lastUserMsgObj) {
    return new Response(JSON.stringify({ error: "No user message found" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const cleanQuery = sanitizeInput(lastUserMsgObj.content);

  // 4. Relevance Gate Evaluation
  const gateResult = evaluateGate(cleanQuery);

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
        for await (const chunk of routeChat({ messages: llmMessages })) {
          rawOutput += chunk;
          await sendSSE("token", chunk);
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
    } catch {
      // Catch any unexpected stream write errors
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
