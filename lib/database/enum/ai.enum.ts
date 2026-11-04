export enum AiJobStatus {
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  WAITING_QUOTA = 'WAITING_QUOTA',
  NEEDS_REVIEW = 'NEEDS_REVIEW',
  FAILED = 'FAILED',
}

export enum AiJobStep {
  OUTLINE = 'outline',
  SECTIONS = 'sections',
  META = 'meta',
  IMAGE = 'image',
  VALIDATE = 'validate',
  SAVE_PENDING = 'save-pending',
  COMPLETED = 'completed',
}

export enum AiStepStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  DONE = 'DONE',
  FAILED = 'FAILED',
}

export enum AiApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  IMPROVE = 'IMPROVE',
  EXPIRED = 'EXPIRED',
}

export enum AiApprovalDecision {
  APPROVE = 'approve',
  REJECT = 'reject',
  IMPROVE = 'improve',
}

export enum AiTopicStatus {
  SUGGESTED = 'SUGGESTED',
  ACCEPTED = 'ACCEPTED',
  QUEUED = 'QUEUED',
  GENERATED = 'GENERATED',
  REJECTED = 'REJECTED',
}

export enum AiProviderStatus {
  ACTIVE = 'ACTIVE',
  EXHAUSTED = 'EXHAUSTED',
  DISABLED = 'DISABLED',
  COOLDOWN = 'COOLDOWN',
}
