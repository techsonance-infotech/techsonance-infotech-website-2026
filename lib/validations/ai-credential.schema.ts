import { z } from "zod";
import { AI_PROVIDER_VALUES } from "@/lib/constants/enums/ai.enum";

export const addCredentialSchema = z
  .strictObject({
    provider: z
      .enum(AI_PROVIDER_VALUES)
      .or(z.string().trim().min(1, { error: "Provider is required" }).max(50)),
    model: z.string().trim().min(1).max(100).optional(),
    label: z.string().trim().min(1, { error: "Label is required" }).max(100),
    apiKey: z.string().trim().min(5, { error: "API key must be at least 5 characters" }).max(500),
    accountId: z.string().uuid({ error: "Invalid account ID" }).optional(),
    dailyBudgetUsd: z.coerce.number().min(0).max(10000).optional(),
    priority: z.coerce.number().int().min(1).max(1000).optional().default(100),
  })
  .superRefine((data, ctx) => {
    if (data.provider.toLowerCase() === "cloudflare") {
      const raw = data.apiKey.trim();
      let accountIdPart: string | undefined;
      if (raw.includes(":")) {
        accountIdPart = raw.split(":")[0]?.trim();
      } else if (raw.startsWith("{")) {
        try {
          const parsed = JSON.parse(raw);
          accountIdPart = parsed.accountId || parsed.CF_ACCOUNT_ID;
        } catch {
          // JSON parse handled elsewhere
        }
      }
      if (accountIdPart && !/^[0-9a-fA-F]{32}$/.test(accountIdPart)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Cloudflare Account ID must be a 32-character hexadecimal string (0-9, a-f). Found invalid identifier.",
          path: ["apiKey"],
        });
      }
    }
  });

export type AddCredentialInput = z.input<typeof addCredentialSchema>;
export type AddCredentialOutput = z.output<typeof addCredentialSchema>;

export const replaceCredentialSchema = z
  .strictObject({
    credentialId: z.string().uuid({ error: "Valid credential ID is required" }),
    newApiKey: z
      .string()
      .trim()
      .min(5, { error: "Replacement API key must be at least 5 characters" })
      .max(500),
    reason: z.string().trim().min(3).max(250).optional(),
  })
  .superRefine((data, ctx) => {
    const raw = data.newApiKey.trim();
    if (raw.includes(":")) {
      const accountIdPart = raw.split(":")[0]?.trim();
      if (accountIdPart && accountIdPart.length === 32 && !/^[0-9a-fA-F]{32}$/.test(accountIdPart)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Cloudflare Account ID must be a 32-character hexadecimal string (0-9, a-f). Found invalid identifier.",
          path: ["newApiKey"],
        });
      }
    }
  });

export type ReplaceCredentialInput = z.input<typeof replaceCredentialSchema>;
export type ReplaceCredentialOutput = z.output<typeof replaceCredentialSchema>;

export const killSwitchSchema = z.strictObject({
  credentialId: z.string().uuid({ error: "Valid credential ID is required" }),
  reason: z
    .string()
    .trim()
    .min(3, { error: "A justification of at least 3 characters is required" })
    .max(250),
});

export type KillSwitchInput = z.input<typeof killSwitchSchema>;
export type KillSwitchOutput = z.output<typeof killSwitchSchema>;

export const reactivateCredentialSchema = z.strictObject({
  credentialId: z.string().uuid({ error: "Valid credential ID is required" }),
});

export type ReactivateCredentialInput = z.input<typeof reactivateCredentialSchema>;
export type ReactivateCredentialOutput = z.output<typeof reactivateCredentialSchema>;

export const deactivateCredentialSchema = z.strictObject({
  credentialId: z.string().uuid({ error: "Valid credential ID is required" }),
  reason: z.string().trim().min(3).max(250).optional(),
});

export type DeactivateCredentialInput = z.input<typeof deactivateCredentialSchema>;
export type DeactivateCredentialOutput = z.output<typeof deactivateCredentialSchema>;

export const deleteCredentialSchema = z.strictObject({
  credentialId: z.string().uuid({ error: "Valid credential ID is required" }),
});

export type DeleteCredentialInput = z.input<typeof deleteCredentialSchema>;
export type DeleteCredentialOutput = z.output<typeof deleteCredentialSchema>;

export const testConnectionSchema = z.strictObject({
  provider: z.string().trim().min(1, { error: "Provider is required" }),
  apiKey: z.string().trim().min(5, { error: "API key must be at least 5 characters" }),
});

export type TestConnectionInput = z.input<typeof testConnectionSchema>;
export type TestConnectionOutput = z.output<typeof testConnectionSchema>;

export const updateCredentialModelSchema = z.strictObject({
  credentialId: z.string().uuid({ error: "Valid credential ID is required" }),
  model: z.string().trim().min(1, { error: "Model identifier is required" }).max(100),
});

export type UpdateCredentialModelInput = z.input<typeof updateCredentialModelSchema>;
export type UpdateCredentialModelOutput = z.output<typeof updateCredentialModelSchema>;
