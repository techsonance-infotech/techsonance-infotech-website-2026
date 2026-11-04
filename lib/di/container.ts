import { Container, type Provider } from "@needle-di/core";
import { BOT_CONFIG } from "../config";
import { getEnv } from "../env";
import {
  BOT_CONFIG_TOKEN,
  ENV_CONFIG_TOKEN,
  SUPABASE_CLIENT_TOKEN,
  DRIZZLE_DB_TOKEN,
} from "./tokens";
import { getSharedSupabaseClient } from "../supabase/db-client";
import { getDrizzleDb } from "../db/drizzle";
import { RateLimiterService } from "../services/ratelimit.service";
import { EmailService } from "../services/email.service";
import { BookingService } from "../services/booking.service";
import { KBSearchService } from "../services/kb-search.service";
import { RAGService } from "../services/rag.service";
import { LLMHealthService } from "../services/llm-health.service";
import { LLMProviderService } from "../services/llm-provider.service";
import { LLMRouterService } from "../services/llm-router.service";
import { ChatStorageService } from "../services/chat-storage.service";
import { AnalyticsService } from "../services/analytics.service";
import { ContentDbService } from "../services/content-db.service";

let rootContainer: Container | null = null;

export function configureContainer(container: Container): Container {
  container.bind({ provide: BOT_CONFIG_TOKEN, useValue: BOT_CONFIG });
  container.bind({ provide: ENV_CONFIG_TOKEN, useFactory: () => getEnv() });
  container.bind({ provide: SUPABASE_CLIENT_TOKEN, useFactory: () => getSharedSupabaseClient() });
  container.bind({ provide: DRIZZLE_DB_TOKEN, useFactory: () => getDrizzleDb() });
  container.bind(RateLimiterService);
  container.bind(EmailService);
  container.bind(BookingService);
  container.bind(KBSearchService);
  container.bind(RAGService);
  container.bind(LLMHealthService);
  container.bind(LLMProviderService);
  container.bind(LLMRouterService);
  container.bind(ChatStorageService);
  container.bind(AnalyticsService);
  container.bind(ContentDbService);
  return container;
}

export function getContainer(): Container {
  if (!rootContainer) {
    rootContainer = new Container();
    configureContainer(rootContainer);
  }
  return rootContainer;
}

export function createTestContainer(overrides: Provider<unknown>[] = []): Container {
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
