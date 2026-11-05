import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getJobSource } from "@/lib/content/jobs";
import { JobDetailClient } from "./JobDetailClient";
import { JobPostingJsonLd } from "@/components/careers/JobPostingJsonLd";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const jobSource = getJobSource();
  const job = await jobSource.get(slug);

  if (!job || job.status === "DRAFT" || job.status === "IN_REVIEW") {
    return {
      title: "Job Opening Not Found | TechSonance Careers",
    };
  }

  const title = job.seoTitle || `${job.title} | Careers at TechSonance Infotech`;
  const description =
    job.seoDescription ||
    job.summary ||
    `Join TechSonance Infotech as a ${job.title} in ${job.location}. Explore responsibilities, requirements, and apply today.`;
  const canonical = `https://techsonance.com/careers/${job.slug}`;

  return {
    title,
    description,
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
        : [{ url: "https://techsonance.com/og/careers.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: job.ogImage ? [job.ogImage] : ["https://techsonance.com/og/careers.png"],
    },
  };
}

export default async function JobDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const jobSource = getJobSource();
  const job = await jobSource.get(slug);

  // Draft and in-review positions are not publicly accessible
  if (!job || job.status === "DRAFT" || job.status === "IN_REVIEW") {
    notFound();
  }

  // Fetch similar active jobs in the same department for closed banners and recommendations
  const allJobs = await jobSource.list({ status: "OPEN" });
  const similarJobs = allJobs.filter(
    (j) => j.slug !== job.slug && j.department === job.department,
  );

  return (
    <>
      <JobPostingJsonLd job={job} />
      <JobDetailClient job={job} similarJobs={similarJobs} />
    </>
  );
}
