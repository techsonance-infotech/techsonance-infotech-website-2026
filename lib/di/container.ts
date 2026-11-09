import "server-only";
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
import { getDrizzleDb } from "../database";
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
import { MediaService } from "../services/media.service";
import { AdminPostsService } from "../services/admin-posts.service";
import { AdminJobsService } from "../services/admin-jobs.service";
import { BookingRepository } from "../repositories/booking.repository";
import { CareerApplicationsRepository } from "../repositories/career-applications.repository";
import { AdminApplicationsRepository } from "../repositories/admin-applications.repository";
import { AdminJobsRepository } from "../repositories/admin-jobs.repository";
import { AdminPostsRepository } from "../repositories/admin-posts.repository";
import { AdminUsersRepository } from "../repositories/admin-users.repository";
import { GenerationJobsRepository } from "../repositories/generation-jobs.repository";
import { AdminTopicsRepository } from "../repositories/admin-topics.repository";
import { AdminPromptsRepository } from "../repositories/admin-prompts.repository";
import { AdminTelemetryRepository } from "../repositories/admin-telemetry.repository";
import { ApprovalRequestsRepository } from "../repositories/approval-requests.repository";
import { PublicContentRepository } from "../repositories/public-content.repository";
import { AiCredentialsRepository } from "../repositories/ai-credentials.repository";
import { KeyBrokerService } from "../services/ai/key-broker.service";
import { CareerApplyService } from "../services/career-apply.service";
import { ApplicationsService } from "../services/applications.service";
import { AdminAuthService } from "../services/admin-auth.service";
import { ImageStepService } from "../services/image/image-step.service";
import { AIWriterService } from "../services/ai-writer.service";
import { ApprovalService } from "../services/approval.service";
import { JobOrchestratorService } from "../services/job-orchestrator.service";
import { AdminTopicsService } from "../services/admin-topics.service";
import { AdminPromptsService } from "../services/admin-prompts.service";
import { AdminTelemetryService } from "../services/admin-telemetry.service";

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
  container.bind(MediaService);
  container.bind(AdminPostsService);
  container.bind(AdminJobsService);
  container.bind(BookingRepository);
  container.bind(CareerApplicationsRepository);
  container.bind(AdminApplicationsRepository);
  container.bind(AdminJobsRepository);
  container.bind(AdminPostsRepository);
  container.bind(AdminUsersRepository);
  container.bind(GenerationJobsRepository);
  container.bind(AdminTopicsRepository);
  container.bind(AdminPromptsRepository);
  container.bind(AdminTelemetryRepository);
  container.bind(ApprovalRequestsRepository);
  container.bind(PublicContentRepository);
  container.bind(AiCredentialsRepository);
  container.bind(KeyBrokerService);
  container.bind(CareerApplyService);
  container.bind(ApplicationsService);
  container.bind(AdminAuthService);
  container.bind(ImageStepService);
  container.bind(AIWriterService);
  container.bind(ApprovalService);
  container.bind(JobOrchestratorService);
  container.bind(AdminTopicsService);
  container.bind(AdminPromptsService);
  container.bind(AdminTelemetryService);
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
