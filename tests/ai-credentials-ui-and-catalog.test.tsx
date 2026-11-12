import React from "react";
import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import {
  PROVIDER_CATALOG,
  isImageCredentialModel,
} from "@/lib/constants/ai-providers.constants";
import AiCredentialsPage from "@/app/admin/ai/credentials/page";
import { ChangeModelModal } from "@/components/admin/ai/ChangeModelModal";
import { ReplaceCredentialModal } from "@/components/admin/ai/ReplaceCredentialModal";
import { DeleteCredentialDialog } from "@/components/admin/ai/DeleteCredentialDialog";

describe("AI Credentials Vault UI & Provider Catalog Integrity", () => {
  it("excludes decommissioned or incompatible models from PROVIDER_CATALOG", () => {
    const allModelIds = PROVIDER_CATALOG.flatMap((entry) => entry.models.map((m) => m.id));

    expect(allModelIds).not.toContain("mixtral-8x7b-32768");
    expect(allModelIds).not.toContain("deepseek-r1-distill-llama-70b");
    expect(allModelIds).not.toContain("canopylabs/orpheus-v1-english");
    expect(allModelIds).not.toContain("models/imagen-3.0-generate-002");

    const groqEntry = PROVIDER_CATALOG.find((p) => p.id === "groq");
    expect(groqEntry?.models.map((m) => m.id)).toEqual([
      "openai/gpt-oss-120b",
      "openai/gpt-oss-20b",
      "qwen/qwen3.8-27b",
    ]);

    const openAiImg = PROVIDER_CATALOG.find((p) => p.id === "openai" && p.category === "image");
    expect(openAiImg?.defaultModel).toBe("gpt-image-1.5");
  });

  it("correctly differentiates text LLM models vs image models including Cloudflare LLMs", () => {
    expect(isImageCredentialModel("cloudflare", "@cf/black-forest-labs/flux-1-schnell")).toBe(true);
    expect(isImageCredentialModel("cloudflare", "@cf/meta/llama-3.3-70b-instruct-fp8-fast")).toBe(
      false,
    );
    expect(isImageCredentialModel("openai", "gpt-4o")).toBe(false);
    expect(isImageCredentialModel("openai", "gpt-image-1.5")).toBe(true);
    expect(isImageCredentialModel("gemini", "gemini-3.5-flash-lite")).toBe(false);
    expect(isImageCredentialModel("gemini", "models/gemini-3.1-flash-image")).toBe(true);
    expect(isImageCredentialModel("pollinations", "black-forest-labs/flux.1-schnell")).toBe(true);
  });

  it("renders AiCredentialsPage and modal components cleanly without runtime errors", () => {
    const sampleCred = {
      id: "3d80f126-62e4-452f-854d-209752751891",
      accountId: null,
      provider: "cloudflare",
      model: "@cf/black-forest-labs/flux-1-schnell",
      label: "CF account :Manish.vg",
      last4: "3b23",
      keyVersion: 1,
      status: "active",
      priority: 10,
      dailyBudgetUsd: "10.00",
      spentTodayUsd: "0",
      cooldownUntil: null,
      lastErrorKind: null,
      lastUsedAt: null,
      isCanary: false,
      createdAt: "2026-11-11T00:00:00.000Z",
    };

    const pageHtml = renderToString(<AiCredentialsPage />);
    expect(pageHtml).toContain("AI Control Center &amp; Vault");

    const modelHtml = renderToString(
      <ChangeModelModal
        credential={sampleCred}
        open={false}
        onOpenChange={() => {}}
        onSuccess={() => {}}
      />,
    );
    expect(typeof modelHtml).toBe("string");

    const replaceHtml = renderToString(
      <ReplaceCredentialModal
        credential={sampleCred}
        open={false}
        onOpenChange={() => {}}
        onSuccess={() => {}}
      />,
    );
    expect(typeof replaceHtml).toBe("string");

    const deleteHtml = renderToString(
      <DeleteCredentialDialog
        credential={sampleCred}
        open={false}
        onOpenChange={() => {}}
        onSuccess={() => {}}
      />,
    );
    expect(typeof deleteHtml).toBe("string");
  });
});
