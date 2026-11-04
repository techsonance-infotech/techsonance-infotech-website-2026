import { Container, type Provider } from "@needle-di/core";
import { BOT_CONFIG } from "../config";
import { getEnv } from "../env";
import { BOT_CONFIG_TOKEN, ENV_CONFIG_TOKEN } from "./tokens";
import { RateLimiterService } from "../services/ratelimit.service";
import { EmailService } from "../services/email.service";
import { BookingService } from "../services/booking.service";
import { RAGService } from "../services/rag.service";
import { LLMRouterService } from "../services/llm-router.service";

let rootContainer: Container | null = null;

export function configureContainer(container: Container): Container {
  container.bind({ provide: BOT_CONFIG_TOKEN, useValue: BOT_CONFIG });
  container.bind({ provide: ENV_CONFIG_TOKEN, useFactory: () => getEnv() });
  container.bind(RateLimiterService);
  container.bind(EmailService);
  container.bind(BookingService);
  container.bind(RAGService);
  container.bind(LLMRouterService);
  return container;
}

export function getContainer(): Container {
  if (!rootContainer) {
    rootContainer = new Container();
    configureContainer(rootContainer);
  }
  return rootContainer;
}

export function createTestContainer(overrides: Provider<any>[] = []): Container {
  const container = new Container();
  configureContainer(container);
  for (const provider of overrides) {
    container.bind(provider);
  }
  return container;
}

export function resetRootContainer(): void {
  rootContainer = null;
}
