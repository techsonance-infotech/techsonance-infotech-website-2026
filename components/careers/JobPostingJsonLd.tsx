import React from "react";
import type { JobPosting } from "@/lib/content/types";
import { BASE_URL } from "@/lib/seo-aeo-geo-config";

function mapEmploymentType(type?: string): string {
  if (!type) return "FULL_TIME";
  const normalized = type.toLowerCase().trim();
  if (normalized.includes("full")) return "FULL_TIME";
  if (normalized.includes("part")) return "PART_TIME";
  if (normalized.includes("intern")) return "INTERN";
  if (normalized.includes("contract")) return "CONTRACTOR";
  if (normalized.includes("temporary") || normalized.includes("temp")) return "TEMPORARY";
  if (normalized.includes("commission") || normalized.includes("project")) return "OTHER";
  return normalized.toUpperCase().replace(/[\s/-]+/g, "_");
}

export function generateJobPostingJsonLd(job: JobPosting): Record<string, unknown> {
  const isRemote = Boolean(
    (job.workMode && job.workMode.toLowerCase() === "remote") ||
    (job.location && job.location.toLowerCase().includes("remote")),
  );

  const siteUrl = BASE_URL || "https://www.techsonance.co.in";

  const jsonLd: Record<string, unknown> = {
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
    employmentType: mapEmploymentType(job.type),
    hiringOrganization: {
      "@type": "Organization",
      name: "TechSonance Infotech",
      sameAs: siteUrl,
      logo: `${siteUrl}/icons/icon-512x512.png`,
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

  if (job.status === "PAUSED") {
    jsonLd.validThrough = job.closesAt || "1970-01-01T00:00:00.000Z";
  } else if (job.closesAt) {
    jsonLd.validThrough = job.closesAt;
  }

  if (isRemote) {
    jsonLd.jobLocationType = "TELECOMMUTE";
    jsonLd.applicantLocationRequirements = {
      "@type": "Country",
      name: job.remoteEligibility || "India",
    };
  }

  if (job.showSalaryPublicly && (job.salaryMin !== undefined || job.salaryMax !== undefined)) {
    const period = (job.salaryPeriod || "year").toUpperCase();
    const unitText = period === "HOUR" ? "HOUR" : period === "MONTH" ? "MONTH" : "YEAR";

    const valueObj: Record<string, unknown> = {
      "@type": "QuantitativeValue",
      unitText,
    };
    if (job.salaryMin !== undefined) {
      valueObj.minValue = job.salaryMin;
    }
    if (job.salaryMax !== undefined) {
      valueObj.maxValue = job.salaryMax;
    }

    jsonLd.baseSalary = {
      "@type": "MonetaryAmount",
      currency: job.salaryCurrency || "INR",
      value: valueObj,
    };
  }

  if (job.skills && job.skills.length > 0) {
    jsonLd.skills = job.skills.join(", ");
  }

  if (job.responsibilities && job.responsibilities.length > 0) {
    jsonLd.responsibilities = job.responsibilities.join("\n");
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
