import { unstable_cache } from "next/cache";
import { getContainer } from "../di/container";
import { ContentDbService } from "../services/content-db.service";
import { getEnv } from "../env";
import type { JobPosting, JobSource } from "./types";

// ─── Cache helper that degrades safely outside of Next.js server runtime ─────
function safeCache<Args extends unknown[], R>(
  fn: (...args: Args) => Promise<R>,
  keyParts?: string[],
  options?: { revalidate?: number | false; tags?: string[] },
): (...args: Args) => Promise<R> {
  let cached: ((...args: Args) => Promise<R>) | null = null;
  try {
    cached = unstable_cache(
      fn as unknown as Parameters<typeof unstable_cache>[0],
      keyParts,
      options,
    ) as (...args: Args) => Promise<R>;
  } catch {
    return fn;
  }
  return async (...args: Args): Promise<R> => {
    try {
      if (cached) {
        return await cached(...args);
      }
    } catch {
      // Degrades when incrementalCache is missing (e.g. in vitest, scripts, or non-Next contexts)
    }
    return await fn(...args);
  };
}

// ─── Legacy In-Memory Jobs (from CareersClient.tsx) ──────────────────────────
export const legacyJobs: JobPosting[] = [
  {
    id: "legacy-bd-partner",
    slug: "business-development-partner",
    title: "Business Development Partner",
    department: "Business Development",
    location: "International Remote / Hybrid",
    type: "Commission / Project-Based",
    experienceLevel: "Partner",
    description:
      "We are looking for an entrepreneurial, results-driven Business Development Partner to spearhead client acquisition, enterprise technology partnerships, and high-value project deals. In this performance-driven role, you will connect with international startup founders, CTOs, and enterprises seeking custom AI automation, scalable SaaS platforms, and modern web/mobile systems, earning uncapped commissions and project-based revenue shares on every deal closed.",
    responsibilities: [
      "Prospect, identify, and close new client deals for custom software, SaaS products, AI automation, and cloud engineering.",
      "Build and nurture relationships with international startup founders, CTOs, and enterprise executives across North America, Europe, UAE, and APAC.",
      "Pitch TechSonance's technical capabilities, case studies, and engineering delivery workflows to prospective clients.",
      "Collaborate with our solutions architecture team during technical scoping and contract negotiations.",
      "Drive recurring client retainers, strategic referral networks, and long-term agency partnerships.",
    ],
    requirements: [
      "Proven track record in B2B tech sales, software agency business development, consulting, or client acquisition.",
      "Strong professional network or outbound prospecting expertise targeting founders, CTOs, and C-level decision-makers.",
      "Solid understanding of software solutions (Next.js, React, Node.js, Cloud, AI/LLMs) to communicate technical credibility.",
      "Exceptional communication, presentation, negotiation, and contract closing abilities.",
      "High autonomy and hunger to unlock uncapped commission earnings on 5- and 6-figure technology projects.",
    ],
    benefits: [
      "Uncapped commission earnings and project revenue share",
      "Flexible international remote working schedule",
      "Direct collaboration with solutions architects and leadership",
      "Access to comprehensive agency case studies and pitch materials",
    ],
    status: "OPEN",
  },
  {
    id: "legacy-fs-intern",
    slug: "full-stack-developer-intern",
    title: "Full Stack Developer Intern",
    department: "Engineering",
    location: "Remote / Hybrid",
    type: "Internship",
    experienceLevel: "Entry / Internship",
    description:
      "We are looking for a highly motivated Full Stack Developer Intern who is passionate about web development, UI design, and cloud services. You will work side-by-side with senior developers to construct premium products, write production-ready code, and implement state-of-the-art APIs.",
    responsibilities: [
      "Design and build clean, responsive client-side UI components in React and Next.js.",
      "Develop scalable backend logic and RESTful API integrations in Node.js & TypeScript.",
      "Optimize databases (PostgreSQL/MongoDB) and manage state flow.",
      "Collaborate in Git workflows, code reviews, and project scoping processes.",
    ],
    requirements: [
      "Familiarity with JS/TS, React, Tailwind CSS, and HTML5 semantic markup.",
      "Basic understanding of database schemas and backend query models.",
      "Comfortable with Git command workflows and clean commit management.",
      "Strong willingness to receive feedback, learn fast, and solve complex problems.",
    ],
    benefits: [
      "Competitive internship stipend",
      "Mentorship from experienced senior full-stack engineers",
      "Hands-on experience with production Next.js 16 and Supabase architecture",
      "Certificate of internship & potential PPO opportunity",
    ],
    status: "CLOSED",
  },
];

// ─── Legacy Job Source ───────────────────────────────────────────────────────
export const legacyJobSource: JobSource = {
  async list(opts?: { status?: string }): Promise<JobPosting[]> {
    if (opts?.status) {
      return legacyJobs.filter((j) => j.status === opts.status);
    }
    return legacyJobs;
  },

  async get(slug: string): Promise<JobPosting | null> {
    const job = legacyJobs.find((j) => j.slug === slug);
    return job || null;
  },

  async slugs(): Promise<string[]> {
    return legacyJobs.map((j) => j.slug);
  },
};

// ─── CMS Database Fetchers (Delegates to ContentDbService via DI) ────────────
async function fetchCmsJobsRaw(status?: string): Promise<JobPosting[]> {
  try {
    const db = getContainer().get(ContentDbService);
    return await db.fetchJobs(status as any);
  } catch {
    return [];
  }
}

async function fetchCmsJobBySlugRaw(slug: string): Promise<JobPosting | null> {
  try {
    const db = getContainer().get(ContentDbService);
    return await db.fetchJobBySlug(slug);
  } catch {
    return null;
  }
}

async function fetchCmsJobSlugsRaw(): Promise<string[]> {
  try {
    const db = getContainer().get(ContentDbService);
    return await db.fetchJobSlugs();
  } catch {
    return [];
  }
}

// ─── Cached CMS Fetchers with Next.js Tags ───────────────────────────────────
const getCachedCmsJobs = safeCache(fetchCmsJobsRaw, ["cms-jobs-list"], {
  tags: ["jobs"],
  revalidate: 3600,
});

const getCachedCmsJobBySlug = safeCache(fetchCmsJobBySlugRaw, ["cms-job-by-slug"], {
  tags: ["jobs"],
  revalidate: 3600,
});

const getCachedCmsJobSlugs = safeCache(fetchCmsJobSlugsRaw, ["cms-jobs-slugs"], {
  tags: ["jobs"],
  revalidate: 3600,
});

// ─── CMS Job Source ──────────────────────────────────────────────────────────
export const cmsJobSource: JobSource = {
  async list(opts?: { status?: string }): Promise<JobPosting[]> {
    return getCachedCmsJobs(opts?.status);
  },

  async get(slug: string): Promise<JobPosting | null> {
    return getCachedCmsJobBySlug(slug);
  },

  async slugs(): Promise<string[]> {
    return getCachedCmsJobSlugs();
  },
};

// ─── Factory: Source Selector ────────────────────────────────────────────────
export function getJobSource(): JobSource {
  try {
    const env = getEnv();
    if (env.CONTENT_SOURCE_CAREERS === "cms") {
      return cmsJobSource;
    }
  } catch {
    if (process.env.CONTENT_SOURCE_CAREERS === "cms") {
      return cmsJobSource;
    }
  }
  return legacyJobSource;
}
