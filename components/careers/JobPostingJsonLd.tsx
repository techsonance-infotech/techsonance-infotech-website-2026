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

function safeIsoDate(dateString?: string): string {
  if (!dateString) return new Date().toISOString();
  try {
    const timestamp = new Date(dateString).getTime();
    if (Number.isFinite(timestamp)) {
      return new Date(timestamp).toISOString();
    }
  } catch {
    // Ignore error
  }
  return new Date().toISOString();
}

export function generateJobPostingJsonLd(job: JobPosting): Record<string, unknown> {
  if (!job || typeof job !== "object") {
    return {};
  }

  const isRemote = Boolean(
    (job.workMode && job.workMode.toLowerCase() === "remote") ||
    (job.location && job.location.toLowerCase().includes("remote")),
  );

  const siteUrl = BASE_URL || "https://www.techsonance.co.in";

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title || "Career Opening",
    description: job.description || "",
    identifier: {
      "@type": "PropertyValue",
      name: "TechSonance Infotech",
      value: job.referenceCode || job.slug || "job",
    },
    datePosted: safeIsoDate(job.publishedAt),
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
        addressLocality: job.location || "Remote, India",
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

  const isMinValid = typeof job.salaryMin === "number" && Number.isFinite(job.salaryMin);
  const isMaxValid = typeof job.salaryMax === "number" && Number.isFinite(job.salaryMax);
  if (job.showSalaryPublicly && (isMinValid || isMaxValid)) {
    const period = (job.salaryPeriod || "year").toUpperCase();
    const unitText = period === "HOUR" ? "HOUR" : period === "MONTH" ? "MONTH" : "YEAR";

    const valueObj: Record<string, unknown> = {
      "@type": "QuantitativeValue",
      unitText,
    };
    if (isMinValid) {
      valueObj.minValue = job.salaryMin;
    }
    if (isMaxValid) {
      valueObj.maxValue = job.salaryMax;
    }

    jsonLd.baseSalary = {
      "@type": "MonetaryAmount",
      currency: job.salaryCurrency || "INR",
      value: valueObj,
    };
  }

  if (Array.isArray(job.skills) && job.skills.length > 0) {
    jsonLd.skills = job.skills.filter(Boolean).join(", ");
  }

  if (Array.isArray(job.responsibilities) && job.responsibilities.length > 0) {
    jsonLd.responsibilities = job.responsibilities.filter(Boolean).join("\n");
  }

  return jsonLd;
}

export function JobPostingJsonLd({ job }: { job: JobPosting }) {
  const jsonLd = generateJobPostingJsonLd(job);
  if (!jsonLd || Object.keys(jsonLd).length === 0) {
    return null;
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default JobPostingJsonLd;
