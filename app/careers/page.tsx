import type { Metadata } from "next";
import { Suspense } from "react";
import CareersClient from "./CareersClient";
import { SEO_METADATA } from "@/lib/seo-aeo-geo-config";
import { getJobSource } from "@/lib/content/jobs";
import { JobStatus } from "@/lib/constants/enums";
import type { JobPosting } from "@/lib/content/types";
import { publicJobListBoundarySchema } from "@/lib/validations/public-careers-boundary.schema";
import CareersLoading from "./loading";

export const metadata: Metadata = {
  title: SEO_METADATA.careers.title,
  description: SEO_METADATA.careers.description,
  keywords: SEO_METADATA.careers.keywords,
  alternates: {
    canonical: SEO_METADATA.careers.canonical,
  },
  openGraph: {
    title: SEO_METADATA.careers.ogTitle,
    description: SEO_METADATA.careers.ogDescription,
    url: SEO_METADATA.careers.canonical,
    images: [{ url: SEO_METADATA.careers.ogImage }],
  },
};

export default async function CareersPage() {
  let jobs: JobPosting[] = [];

  try {
    const jobSource = getJobSource();
    let rawJobs = await jobSource.list({ status: JobStatus.PUBLISHED });
    if (!rawJobs || rawJobs.length === 0) {
      rawJobs = await jobSource.list({ status: JobStatus.OPEN });
    }
    jobs = publicJobListBoundarySchema.parse(rawJobs);
  } catch {
    // If DB is temporarily unavailable, fall back to empty array and let client show safe fallback
    jobs = [];
  }

  return (
    <Suspense fallback={<CareersLoading />}>
      <CareersClient initialJobs={jobs} />
    </Suspense>
  );
}
