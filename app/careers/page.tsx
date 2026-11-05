import type { Metadata } from "next";
import { Suspense } from "react";
import CareersClient from "./CareersClient";
import { SEO_METADATA } from "@/lib/seo-aeo-geo-config";
import { getJobSource } from "@/lib/content/jobs";

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
  const jobSource = getJobSource();
  let jobs = await jobSource.list({ status: "PUBLISHED" });
  if (!jobs || jobs.length === 0) {
    jobs = await jobSource.list({ status: "OPEN" });
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 dark:bg-slate-950" />}>
      <CareersClient initialJobs={jobs} />
    </Suspense>
  );
}
