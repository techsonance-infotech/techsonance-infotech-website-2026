import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getJobSource } from "@/lib/content/jobs";
import { BASE_URL } from "@/lib/seo-aeo-geo-config";
import JobPostingJsonLd from "@/components/careers/JobPostingJsonLd";
import JobDetailClient from "./JobDetailClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const jobSource = getJobSource();
  const job = await jobSource.get(slug);

  if (!job) {
    return {
      title: "Job Opening Not Found | TechSonance Careers",
      description: "The requested career opening could not be located.",
    };
  }

  const title = job.seoTitle || `${job.title} | Careers at TechSonance Infotech`;
  const description =
    job.seoDescription ||
    job.summary ||
    `Join TechSonance Infotech as a ${job.title} in ${job.location}. Explore role overview, key responsibilities, qualifications, and apply online today.`;
  const canonical = `${BASE_URL}/careers/${job.slug}`;

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
        : [{ url: `${BASE_URL}/images/og/careers.png` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function JobDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const jobSource = getJobSource();
  const job = await jobSource.get(slug);

  if (!job) {
    notFound();
  }

  // Unpublished internal workflow states return 404
  if (
    job.status === "DRAFT" ||
    job.status === "IN_REVIEW" ||
    job.status === "ARCHIVED"
  ) {
    notFound();
  }

  // Fetch similar active jobs for recommendations
  const allJobs = await jobSource.list();
  const similarJobs = allJobs.filter(
    (j) =>
      j.department.toLowerCase() === job.department.toLowerCase() &&
      j.slug !== job.slug &&
      (j.status === "OPEN" || j.status === "PUBLISHED"),
  );

  return (
    <>
      <JobPostingJsonLd job={job} />
      <JobDetailClient job={job} similarJobs={similarJobs} />
    </>
  );
}
