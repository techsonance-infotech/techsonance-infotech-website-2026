import "server-only";
import { Client, Receiver } from "@upstash/qstash";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

let qstashClient: Client | null = null;
let qstashReceiver: Receiver | null = null;

export function getQStashClient(): Client | null {
  if (qstashClient) return qstashClient;

  const env = getEnv();
  const token = env.QSTASH_TOKEN;
  if (!token) {
    return null;
  }

  qstashClient = new Client({ token });
  return qstashClient;
}

export function getQStashReceiver(): Receiver | null {
  if (qstashReceiver) return qstashReceiver;

  const env = getEnv();
  const currentSigningKey = env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey = env.QSTASH_NEXT_SIGNING_KEY;

  if (!currentSigningKey || !nextSigningKey) {
    return null;
  }

  qstashReceiver = new Receiver({
    currentSigningKey,
    nextSigningKey,
  });
  return qstashReceiver;
}

export interface DispatchJobStepOptions {
  jobId: string;
  step?: string;
  delaySeconds?: number;
}

/**
 * Dispatches an AI blog generation step to /api/worker/step via Upstash QStash.
 * If QStash is not configured (e.g. local dev), falls back to direct asynchronous invocation.
 */
export async function dispatchJobStep(
  options: DispatchJobStepOptions,
  fallbackExecutor?: () => Promise<unknown>,
): Promise<{ dispatched: boolean; messageId?: string; fallback: boolean }> {
  const client = getQStashClient();
  const env = getEnv();
  const siteUrl = env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const targetUrl = `${siteUrl.replace(/\/$/, "")}/api/worker/step`;

  if (client) {
    try {
      const res = await client.publishJSON({
        url: targetUrl,
        body: {
          jobId: options.jobId,
          step: options.step,
        },
        headers: {
          "x-worker-secret": env.REVALIDATE_SECRET || "",
        },
        delay: options.delaySeconds ?? 0,
      });

      logger.info("Dispatched generation job step via Upstash QStash", {
        jobId: options.jobId,
        step: options.step,
        messageId: res.messageId,
      });

      return { dispatched: true, messageId: res.messageId, fallback: false };
    } catch (err) {
      logger.warn("QStash step dispatch failed, falling back to direct invocation", {
        jobId: options.jobId,
        error: String(err),
      });
    }
  }

  // Fallback for environments without QSTASH_TOKEN
  if (fallbackExecutor) {
    // Execute non-blocking in development
    fallbackExecutor().catch((err) => {
      logger.error("Fallback step execution failed", {
        jobId: options.jobId,
        error: String(err),
      });
    });
  }

  return { dispatched: true, fallback: true };
}
