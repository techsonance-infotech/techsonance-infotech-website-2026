export enum AiJobStatus {
  QUEUED = "QUEUED",
  RUNNING = "RUNNING",
  COMPLETED = "COMPLETED",
  WAITING_QUOTA = "WAITING_QUOTA",
  NEEDS_REVIEW = "NEEDS_REVIEW",
  FAILED = "FAILED",
}

export enum AiJobStep {
  OUTLINE = "outline",
  SECTIONS = "sections",
  META = "meta",
  IMAGE = "image",
  VALIDATE = "validate",
  SAVE_PENDING = "save-pending",
  COMPLETED = "completed",
}

export enum AiStepStatus {
  PENDING = "PENDING",
  RUNNING = "RUNNING",
  DONE = "DONE",
  FAILED = "FAILED",
}

export enum AiApprovalStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  IMPROVE = "IMPROVE",
  EXPIRED = "EXPIRED",
}

export enum AiApprovalDecision {
  APPROVE = "approve",
  REJECT = "reject",
  IMPROVE = "improve",
}

export enum AiTopicStatus {
  SUGGESTED = "SUGGESTED",
  ACCEPTED = "ACCEPTED",
  QUEUED = "QUEUED",
  GENERATED = "GENERATED",
  REJECTED = "REJECTED",
}

export enum AiProviderStatus {
  ACTIVE = "ACTIVE",
  EXHAUSTED = "EXHAUSTED",
  DISABLED = "DISABLED",
  COOLDOWN = "COOLDOWN",
}

export enum AiCredentialStatus {
  ACTIVE = "active",
  COOLING_DOWN = "cooling_down",
  EXHAUSTED = "exhausted",
  DISABLED = "disabled",
  COMPROMISED = "compromised",
}

export enum AiAccountBillingMode {
  PREPAID = "prepaid",
  POSTPAID = "postpaid",
  FREE_TIER = "free_tier",
}

export enum AiCredentialEventKind {
  CREATED = "created",
  USED = "used",
  FAILED = "failed",
  COOLED = "cooled",
  EXHAUSTED = "exhausted",
  DISABLED = "disabled",
  COMPROMISED = "compromised",
  ROTATED = "rotated",
  WIPED = "wiped",
}

export enum AiAlertSeverity {
  INFO = "info",
  WARNING = "warning",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum AiProviderId {
  GROQ = "groq",
  GEMINI = "gemini",
  OPENAI = "openai",
  ANTHROPIC = "anthropic",
  CEREBRAS = "cerebras",
  OPENROUTER = "openrouter",
  MISTRAL = "mistral",
  XAI = "xai",
  DEEPSEEK = "deepseek",
  COHERE = "cohere",
  TOGETHER = "together",
  PERPLEXITY = "perplexity",
  CLOUDFLARE = "cloudflare",
  POLLINATIONS = "pollinations",
  REPLICATE = "replicate",
  STABILITY = "stability",
  GITHUB = "github",
}

export type AiProvider = `${AiProviderId}`;
export const AI_PROVIDER_VALUES = Object.values(AiProviderId) as [AiProviderId, ...AiProviderId[]];

