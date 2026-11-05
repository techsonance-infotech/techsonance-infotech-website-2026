import { inject } from "@needle-di/core";
import { DRIZZLE_DB_TOKEN } from "../di/tokens";
import type { Database } from "../database/index";
import type {
  BlogPost,
  BlogPostStatus,
  JobPosting,
} from "../content/types";
import { JobStatus } from "../database/enum";

/**
 * Production Content Database Service
 * Fully type-safe Drizzle ORM query service with compile-time relation joins
 * and Needle DI container injection.
 */
export class ContentDbService {
  constructor(private db: Database = inject(DRIZZLE_DB_TOKEN)) {}

  getDb(): Database {
    return this.db;
  }

  async fetchPublishedPosts(category?: string): Promise<BlogPost[]> {
    try {
      const postsData = await this.db.query.postsTable.findMany({
        where: {
          status: "PUBLISHED",
        },
        with: {
          category: true,
        },
        orderBy: {
          publishedAt: "desc",
        },
      });

      if (!postsData || postsData.length === 0) return [];

      const authorsData = await this.db.query.authorsTable.findMany();
      const authorMap = new Map<
        string,
        { name: string; role: string; avatar: string }
      >();
      for (const a of authorsData) {
        authorMap.set(a.id, {
          name: a.name,
          role: a.role || "Team TechSonance",
          avatar: a.avatar || "TS",
        });
      }

      const posts: BlogPost[] = postsData.map((row) => {
        const catName = row.category?.name || "Software Engineering";
        const resolvedAuthors = Array.isArray(row.authorIds)
          ? row.authorIds
              .map((id) => authorMap.get(id))
              .filter(
                (a): a is { name: string; role: string; avatar: string } => !!a,
              )
          : [];

        const authors =
          resolvedAuthors.length > 0
            ? resolvedAuthors
            : [{ name: "TechSonance Team", role: "Engineering", avatar: "TS" }];

        const publishedDate = row.publishedAt || row.createdAt;
        const formattedDate = publishedDate
          ? new Date(publishedDate).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })
          : "Recent";

        return {
          slug: row.slug,
          title: row.title,
          excerpt: row.excerpt || "",
          content: row.content,
          category: catName,
          date: formattedDate,
          readTime: row.readTime || "5 min read",
          authors,
          heroImage: row.heroImage || "/images/blog/default.jpg",
          tags: Array.isArray(row.tags) ? row.tags : [],
          faqs: Array.isArray(row.faqs)
            ? (row.faqs as Array<{ question: string; answer: string }>)
            : undefined,
          status: row.status as BlogPostStatus,
          publishedAt: row.publishedAt
            ? row.publishedAt.toISOString()
            : row.createdAt
              ? row.createdAt.toISOString()
              : undefined,
          seo: row.seo as BlogPost["seo"],
        };
      });

      if (category) {
        const target = category.toLowerCase().trim();
        return posts.filter((p) => p.category.toLowerCase().trim() === target);
      }

      return posts;
    } catch {
      return [];
    }
  }

  async fetchPostBySlug(slug: string): Promise<BlogPost | null> {
    try {
      const row = await this.db.query.postsTable.findFirst({
        where: {
          slug,
        },
        with: {
          category: true,
        },
      });

      if (!row) return null;

      const authorsData = await this.db.query.authorsTable.findMany();
      const authorMap = new Map<
        string,
        { name: string; role: string; avatar: string }
      >();
      for (const a of authorsData) {
        authorMap.set(a.id, {
          name: a.name,
          role: a.role || "Team TechSonance",
          avatar: a.avatar || "TS",
        });
      }

      const resolvedAuthors = Array.isArray(row.authorIds)
        ? row.authorIds
            .map((id) => authorMap.get(id))
            .filter(
              (a): a is { name: string; role: string; avatar: string } => !!a,
            )
        : [];

      const authors =
        resolvedAuthors.length > 0
          ? resolvedAuthors
          : [{ name: "TechSonance Team", role: "Engineering", avatar: "TS" }];

      const publishedDate = row.publishedAt || row.createdAt;
      const formattedDate = publishedDate
        ? new Date(publishedDate).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        : "Recent";

      return {
        slug: row.slug,
        title: row.title,
        excerpt: row.excerpt || "",
        content: row.content,
        category: row.category?.name || "Software Engineering",
        date: formattedDate,
        readTime: row.readTime || "5 min read",
        authors,
        heroImage: row.heroImage || "/images/blog/default.jpg",
        tags: Array.isArray(row.tags) ? row.tags : [],
        faqs: Array.isArray(row.faqs)
          ? (row.faqs as Array<{ question: string; answer: string }>)
          : undefined,
        status: row.status as BlogPostStatus,
        publishedAt: row.publishedAt
          ? row.publishedAt.toISOString()
          : row.createdAt
            ? row.createdAt.toISOString()
            : undefined,
        seo: row.seo as BlogPost["seo"],
      };
    } catch {
      return null;
    }
  }

  async fetchPostSlugs(): Promise<string[]> {
    try {
      const posts = await this.db.query.postsTable.findMany({
        where: {
          status: "PUBLISHED",
        },
        columns: {
          slug: true,
        },
      });
      return posts.map((p) => p.slug);
    } catch {
      return [];
    }
  }

  async fetchJobs(status?: JobStatus): Promise<JobPosting[]> {
    try {
      const targetStatus = status || JobStatus.OPEN;
      const jobs = await this.db.query.jobsTable.findMany({
        where: {
          status: targetStatus as any,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return jobs.map((row) => ({
        id: row.id,
        slug: row.slug,
        title: row.title,
        referenceCode: row.referenceCode || undefined,
        department: row.department,
        location: row.location,
        workMode: row.workMode,
        remoteEligibility: row.remoteEligibility || undefined,
        visaSupport: row.visaSupport || undefined,
        type: row.type,
        experienceLevel: row.experienceLevel || "mid",
        summary: row.summary,
        description: row.description,
        responsibilities: Array.isArray(row.responsibilities)
          ? row.responsibilities
          : [],
        requirements: Array.isArray(row.requirements) ? row.requirements : [],
        preferredQualifications: Array.isArray(row.preferredQualifications)
          ? row.preferredQualifications
          : [],
        skills: Array.isArray(row.skills) ? row.skills : [],
        benefits: Array.isArray(row.benefits) ? row.benefits : [],
        aboutTeam: row.aboutTeam || undefined,
        hiringProcess: Array.isArray(row.hiringProcess) ? (row.hiringProcess as any) : [],
        equalOpportunityStatement: row.equalOpportunityStatement || undefined,
        salaryMin: row.salaryMin ?? undefined,
        salaryMax: row.salaryMax ?? undefined,
        salaryCurrency: row.salaryCurrency || "INR",
        salaryPeriod: row.salaryPeriod || "year",
        showSalaryPublicly: row.showSalaryPublicly,
        compensationNotes: row.compensationNotes || undefined,
        applicationMethod: row.applicationMethod,
        externalApplyUrl: row.externalApplyUrl || undefined,
        resumeRequired: row.resumeRequired,
        coverLetterRequirement: row.coverLetterRequirement,
        screeningQuestions: Array.isArray(row.screeningQuestions) ? row.screeningQuestions : [],
        closesAt: row.closesAt ? row.closesAt.toISOString() : undefined,
        status: row.status as JobStatus,
        publishedAt: row.publishedAt ? row.publishedAt.toISOString() : undefined,
        seoTitle: row.seoTitle || undefined,
        seoDescription: row.seoDescription || undefined,
        ogImage: row.ogImage || undefined,
      }));
    } catch {
      return [];
    }
  }

  async fetchJobBySlug(slug: string): Promise<JobPosting | null> {
    try {
      const row = await this.db.query.jobsTable.findFirst({
        where: {
          slug,
        },
      });

      if (!row) return null;

      return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        referenceCode: row.referenceCode || undefined,
        department: row.department,
        location: row.location,
        workMode: row.workMode,
        remoteEligibility: row.remoteEligibility || undefined,
        visaSupport: row.visaSupport || undefined,
        type: row.type,
        experienceLevel: row.experienceLevel || "mid",
        summary: row.summary,
        description: row.description,
        responsibilities: Array.isArray(row.responsibilities)
          ? row.responsibilities
          : [],
        requirements: Array.isArray(row.requirements) ? row.requirements : [],
        preferredQualifications: Array.isArray(row.preferredQualifications)
          ? row.preferredQualifications
          : [],
        skills: Array.isArray(row.skills) ? row.skills : [],
        benefits: Array.isArray(row.benefits) ? row.benefits : [],
        aboutTeam: row.aboutTeam || undefined,
        hiringProcess: Array.isArray(row.hiringProcess) ? (row.hiringProcess as any) : [],
        equalOpportunityStatement: row.equalOpportunityStatement || undefined,
        salaryMin: row.salaryMin ?? undefined,
        salaryMax: row.salaryMax ?? undefined,
        salaryCurrency: row.salaryCurrency || "INR",
        salaryPeriod: row.salaryPeriod || "year",
        showSalaryPublicly: row.showSalaryPublicly,
        compensationNotes: row.compensationNotes || undefined,
        applicationMethod: row.applicationMethod,
        externalApplyUrl: row.externalApplyUrl || undefined,
        resumeRequired: row.resumeRequired,
        coverLetterRequirement: row.coverLetterRequirement,
        screeningQuestions: Array.isArray(row.screeningQuestions) ? row.screeningQuestions : [],
        closesAt: row.closesAt ? row.closesAt.toISOString() : undefined,
        status: row.status as JobStatus,
        publishedAt: row.publishedAt ? row.publishedAt.toISOString() : undefined,
        seoTitle: row.seoTitle || undefined,
        seoDescription: row.seoDescription || undefined,
        ogImage: row.ogImage || undefined,
      };
    } catch {
      return null;
    }
  }

  async fetchJobSlugs(): Promise<string[]> {
    try {
      const jobs = await this.db.query.jobsTable.findMany({
        where: {
          status: "OPEN" as any,
        },
        columns: {
          slug: true,
        },
      });
      return jobs.map((j) => j.slug);
    } catch {
      return [];
    }
  }
}
