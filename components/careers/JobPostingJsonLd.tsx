import React from "react";
import type { JobPosting } from "@/lib/content/types";

export function generateJobPostingJsonLd(job: JobPosting): Record<string, any> {
  const isRemote =
    (job.workMode && job.workMode.toLowerCase() === "remote") ||
    job.location.toLowerCase().includes("remote");

  const jsonLd: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    identifier: {
      "@type": "PropertyValue",
      name: "TechSonance Infotech",
      value: job.referenceCode || job.slug,
    },
    datePosted: job.publishedAt || new Date().toISOString(),
    employmentType: (job.type || "full_time").toUpperCase(),
    hiringOrganization: {
      "@type": "Organization",
      name: "TechSonance Infotech",
      sameAs: "https://techsonance.com",
      logo: "https://techsonance.com/icons/icon-512x512.png",
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.location,
        addressCountry: "IN",
      },
    },
  };

  if (job.closesAt) {
    jsonLd.validThrough = job.closesAt;
  }

  if (isRemote) {
    jsonLd.jobLocationType = "TELECOMMUTE";
  }

  if (job.showSalaryPublicly && (job.salaryMin !== undefined || job.salaryMax !== undefined)) {
    const period = (job.salaryPeriod || "year").toUpperCase();
    const unitText = period === "HOUR" ? "HOUR" : period === "MONTH" ? "MONTH" : "YEAR";

    jsonLd.baseSalary = {
      "@type": "MonetaryAmount",
      currency: job.salaryCurrency || "INR",
      value: {
        "@type": "QuantitativeValue",
        ...(job.salaryMin !== undefined ? { minValue: job.salaryMin } : {}),
        ...(job.salaryMax !== undefined ? { maxValue: job.salaryMax } : {}),
        unitText,
      },
    };
  }

  return jsonLd;
}

export function JobPostingJsonLd({ job }: { job: JobPosting }) {
  const jsonLd = generateJobPostingJsonLd(job);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default JobPostingJsonLd;
