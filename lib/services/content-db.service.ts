import "server-only";
import { inject } from "@needle-di/core";
import { PublicContentRepository } from "../repositories/public-content.repository";
import type { BlogPost, BlogPostStatus, JobPosting } from "../content/types";
import { JobStatus } from "../database/enum";

/**
 * Production Content Database Service
 * Maps database entities to public blog and job posting models.
 */
export class ContentDbService {
  constructor(private contentRepo: PublicContentRepository = inject(PublicContentRepository)) {}

  async fetchPublishedPosts(category?: string): Promise<BlogPost[]> {
    try {
      const postsData = await this.contentRepo.findPublishedPosts();
      if (!postsData || postsData.length === 0) return [];

      const authorsData = await this.contentRepo.findAllAuthors();
      const authorMap = new Map<string, { name: string; role: string; avatar: string }>();
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
              .filter((a): a is { name: string; role: string; avatar: string } => !!a)
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
      const row = await this.contentRepo.findPostBySlug(slug);
      if (!row) return null;

      const authorsData = await this.contentRepo.findAllAuthors();
      const authorMap = new Map<string, { name: string; role: string; avatar: string }>();
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
            .filter((a): a is { name: string; role: string; avatar: string } => !!a)
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
      return await this.contentRepo.findPostSlugs();
    } catch {
      return [];
    }
  }

  async fetchJobs(status?: JobStatus): Promise<JobPosting[]> {
    try {
      const jobs = await this.contentRepo.findPublishedJobs(status || JobStatus.OPEN);

      return jobs
        .map((row) => {
          const isExpired = Boolean(row.closesAt && new Date(row.closesAt).getTime() < Date.now());
          const effectiveStatus = isExpired ? JobStatus.CLOSED : (row.status as JobStatus);

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
            responsibilities: Array.isArray(row.responsibilities) ? row.responsibilities : [],
            requirements: Array.isArray(row.requirements) ? row.requirements : [],
            preferredQualifications: Array.isArray(row.preferredQualifications)
              ? row.preferredQualifications
              : [],
            skills: Array.isArray(row.skills) ? row.skills : [],
            benefits: Array.isArray(row.benefits) ? row.benefits : [],
            aboutTeam: row.aboutTeam || undefined,
            hiringProcess: Array.isArray(row.hiringProcess)
              ? (row.hiringProcess as Array<{ step: string; title: string; desc?: string }>)
              : [],
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
            status: effectiveStatus,
            publishedAt: row.publishedAt ? row.publishedAt.toISOString() : undefined,
            seoTitle: row.seoTitle || undefined,
            seoDescription: row.seoDescription || undefined,
            ogImage: row.ogImage || undefined,
          };
        })
        .filter((job) => {
          if (status && (status === JobStatus.PUBLISHED || status === JobStatus.OPEN)) {
            return job.status === status;
          }
          return true;
        });
    } catch {
      return [];
    }
  }

  async fetchJobBySlug(slug: string): Promise<JobPosting | null> {
    try {
      const row = await this.contentRepo.findJobBySlug(slug);
      if (!row) return null;

      const isExpired = Boolean(row.closesAt && new Date(row.closesAt).getTime() < Date.now());
      const effectiveStatus = isExpired ? JobStatus.CLOSED : (row.status as JobStatus);

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
        responsibilities: Array.isArray(row.responsibilities) ? row.responsibilities : [],
        requirements: Array.isArray(row.requirements) ? row.requirements : [],
        preferredQualifications: Array.isArray(row.preferredQualifications)
          ? row.preferredQualifications
          : [],
        skills: Array.isArray(row.skills) ? row.skills : [],
        benefits: Array.isArray(row.benefits) ? row.benefits : [],
        aboutTeam: row.aboutTeam || undefined,
        hiringProcess: Array.isArray(row.hiringProcess)
          ? (row.hiringProcess as Array<{ step: string; title: string; desc?: string }>)
          : [],
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
        status: effectiveStatus,
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
      return await this.contentRepo.findJobSlugs();
    } catch {
      return [];
    }
  }
}
