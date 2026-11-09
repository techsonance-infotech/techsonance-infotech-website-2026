import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getJobSource } from "@/lib/content/jobs";
import { BASE_URL } from "@/lib/seo-aeo-geo-config";
import { JobPostingJsonLd } from "@/components/careers/JobPostingJsonLd";
import JobDetailClient from "./JobDetailClient";
import { JobStatus } from "@/lib/constants/enums";
import type { JobPosting } from "@/lib/content/types";
import {
  publicJobPostingBoundarySchema,
  publicJobListBoundarySchema,
} from "@/lib/validations/public-careers-boundary.schema";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const jobSource = getJobSource();
    const rawJob = await jobSource.get(slug);

    if (!rawJob) {
      return {
        title: "Job Opening Not Found | TechSonance Careers",
        description: "The requested career opening could not be located.",
      };
    }

    const job = publicJobPostingBoundarySchema.parse(rawJob);
    const title = job.seoTitle || `${job.title} | Careers at TechSonance Infotech`;
    const description =
      job.seoDescription ||
      job.summary ||
      `Join TechSonance Infotech as a ${job.title} in ${job.location}. Explore role overview, key responsibilities, qualifications, and apply online today.`;
    const canonical = `${BASE_URL}/careers/${job.slug}`;

    const isNoIndex =
      (job.visibility && job.visibility.toLowerCase() === "unlisted") ||
      job.status === JobStatus.CLOSED ||
      job.status === JobStatus.ARCHIVED ||
      job.status === JobStatus.PAUSED;

    return {
      title,
      description,
      ...(isNoIndex ? { robots: { index: false, follow: false } } : {}),
      alternates: {
        canonical,
      },
      openGraph: {
        title,
        description,
        url: canonical,
        type: "website",
        images: job.ogImage
          ? [{ url: job.ogImage }]
          : [{ url: `${BASE_URL}/images/og/careers.png` }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
    };
  } catch {
    return {
      title: "Careers at TechSonance Infotech",
      description: "Explore engineering and technical career openings at TechSonance Infotech.",
    };
  }
}

export default async function JobDetailPage({ params }: PageProps) {
  const { slug } = await params;
  let job: JobPosting;
  let similarJobs: JobPosting[] = [];

  try {
    const jobSource = getJobSource();
    const rawJob = await jobSource.get(slug);

    if (!rawJob) {
      notFound();
    }

    job = publicJobPostingBoundarySchema.parse(rawJob);

    // Unpublished internal workflow states return 404
    if (
      job.status === JobStatus.DRAFT ||
      job.status === JobStatus.IN_REVIEW ||
      job.status === JobStatus.ARCHIVED
    ) {
      notFound();
    }

    // Fetch similar active jobs for recommendations
    const allJobsRaw = await jobSource.list();
    const allJobs = publicJobListBoundarySchema.parse(allJobsRaw);
    similarJobs = allJobs.filter(
      (j) =>
        (j.department || "").toLowerCase() === (job.department || "").toLowerCase() &&
        j.slug !== job.slug &&
        (j.status === JobStatus.OPEN || j.status === JobStatus.PUBLISHED),
    );
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "digest" in err) {
      const digest = String((err as { digest?: string }).digest || "");
      if (digest.includes("NEXT_NOT_FOUND") || digest.includes("NEXT_REDIRECT")) {
        throw err;
      }
    }
    throw err;
  }

  return (
    <>
      <JobPostingJsonLd job={job} />
      <JobDetailClient job={job} similarJobs={similarJobs} />
    </>
  );
}
