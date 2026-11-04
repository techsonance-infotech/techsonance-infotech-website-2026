import { getContainer } from "../di/container";
import {
  LLMHealthService,
  type HealthState,
  type ProviderHealthRecord,
} from "../services/llm-health.service";
import type { QuotaError } from "./types";

export type { HealthState, ProviderHealthRecord };

export const health = {
  getRecord(id: string): Promise<ProviderHealthRecord> {
    return getContainer().get(LLMHealthService).getRecord(id);
  },
  setRecord(id: string, rec: ProviderHealthRecord, ttlSec?: number): Promise<void> {
    return getContainer().get(LLMHealthService).setRecord(id, rec, ttlSec);
  },
  isUsable(id: string, now = Date.now()): Promise<boolean> {
    return getContainer().get(LLMHealthService).isUsable(id, now);
  },
  markOk(id: string): Promise<void> {
    return getContainer().get(LLMHealthService).markOk(id);
  },
  mark(id: string, error: QuotaError, now = Date.now()): Promise<void> {
    return getContainer().get(LLMHealthService).mark(id, error, now);
  },
  earliestRetryAt(): Promise<number | undefined> {
    return getContainer().get(LLMHealthService).earliestRetryAt();
  },
  reset(): void {
    getContainer().get(LLMHealthService).reset();
  },
};
