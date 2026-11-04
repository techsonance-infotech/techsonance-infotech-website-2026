import { getContainer } from "../di/container";
import { LLMRouterService } from "../services/llm-router.service";
import type { LLMChatRequest, LLMProvider } from "./types";

export function routeChat(
  req: LLMChatRequest,
  customProviders?: LLMProvider[],
): AsyncIterable<string> {
  return getContainer().get(LLMRouterService).routeChat(req, customProviders);
}
