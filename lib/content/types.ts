// ─── TechSonance Content Abstraction Layer Types ────────────────────────────

export type BlogPostStatus = "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "ARCHIVED";

export interface BlogPostAuthor {
  name: string;
  role: string;
  avatar: string;
}

export interface BlogPostFaq {
  question: string;
  answer: string;
}

export interface BlogPostSeo {
  metaTitle?: string;
  metaDescription?: string;
  canonical?: string;
  ogImage?: string;
  noindex?: boolean;
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  date: string;
  readTime: string;
  authors: BlogPostAuthor[];
  heroImage: string;
  tags: string[];
  faqs?: BlogPostFaq[];
  status?: BlogPostStatus;
  publishedAt?: string;
  seo?: BlogPostSeo;
}

export type JobStatus =
  | "DRAFT"
  | "IN_REVIEW"
  | "SCHEDULED"
  | "PUBLISHED"
  | "OPEN"
  | "PAUSED"
  | "CLOSED"
  | "ARCHIVED";

export interface JobPosting {
  id?: string;
  slug: string;
  title: string;
  referenceCode?: string;
  department: string;
  location: string;
  workMode?: string;
  remoteEligibility?: string;
  visaSupport?: string;
  type: string;
  experienceLevel?: string;
  summary?: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  preferredQualifications?: string[];
  skills?: string[];
  benefits: string[];
  aboutTeam?: string;
  hiringProcess?: Array<{ step: string; title: string; desc?: string }>;
  equalOpportunityStatement?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: string;
  showSalaryPublicly?: boolean;
  compensationNotes?: string;
  applicationMethod?: string;
  externalApplyUrl?: string;
  resumeRequired?: boolean;
  coverLetterRequirement?: string;
  screeningQuestions?: any[];
  closesAt?: string;
  status: JobStatus;
  visibility?: string;
  publishedAt?: string;
  updatedAt?: string;
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: string;
}

export interface PostSource {
  list(opts?: { category?: string; status?: string }): Promise<BlogPost[]>;
  get(slug: string): Promise<BlogPost | null>;
  slugs(): Promise<string[]>;
}

export interface JobSource {
  list(opts?: { status?: string }): Promise<JobPosting[]>;
  get(slug: string): Promise<JobPosting | null>;
  slugs(): Promise<string[]>;
}
