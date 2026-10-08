import { health } from "./health";
import { getProviders } from "./providers";
import {
  AllExhaustedError,
  QuotaError,
  type LLMChatRequest,
  type LLMProvider,
} from "./types";

export async function* routeChat(
  req: LLMChatRequest,
  customProviders?: LLMProvider[]
): AsyncIterable<string> {
  const now = Date.now();
  const allProviders = customProviders || getProviders();

  // Filter for enabled and usable providers
  const usablePool: LLMProvider[] = [];
  for (const p of allProviders) {
    if (p.enabled() && (await health.isUsable(p.id, now))) {
      usablePool.push(p);
    }
  }

  if (usablePool.length === 0) {
    const earliest = await health.earliestRetryAt();
    throw new AllExhaustedError(earliest);
  }

  // Single pass through usable pool (no while loop, no recursion)
  for (const provider of usablePool) {
    let yieldedAnyToken = false;
    try {
      for await (const chunk of provider.chat(req)) {
        yieldedAnyToken = true;
        yield chunk;
      }

      // Successful completion
      await health.markOk(provider.id);
      return;
    } catch (err: unknown) {
      if (err instanceof QuotaError) {
        await health.mark(provider.id, err);
      } else {
        await health.mark(provider.id, new QuotaError("server", 120, String(err)));
      }

      // If tokens were already sent to client, DO NOT switch providers mid-stream
      if (yieldedAnyToken) {
        yield "\n\n... Would you like to connect directly with our engineering team for a free consultation?";
        return;
      }

      // Continue to next provider in loop
    }
  }

  // All attempted providers failed
  const earliest = await health.earliestRetryAt();
  throw new AllExhaustedError(earliest);
}
