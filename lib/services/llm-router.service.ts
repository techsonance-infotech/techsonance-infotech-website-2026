import { routeChat } from "../llm/router";
import type { LLMChatRequest, LLMProvider } from "../llm/types";

export class LLMRouterService {
  routeChat(
    req: LLMChatRequest,
    customProviders?: LLMProvider[]
  ): AsyncIterable<string> {
    return routeChat(req, customProviders);
  }
}
