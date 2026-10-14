import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProjectBySlug, projects } from "@/data/projects";
import ProjectDetailClient from "./ProjectDetailClient";
import JsonLd from "@/app/components/JsonLd";
import { BASE_URL } from "@/lib/seo-aeo-geo-config";

export function generateStaticParams() {
  return projects.map((project) => ({
    slug: project.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return { title: "Project Not Found" };

  const canonicalUrl = `${BASE_URL}/portfolio/${project.slug}`;
  const screenshotUrl = project.screenshotPath
    ? (project.screenshotPath.startsWith("http") ? project.screenshotPath : `${BASE_URL}${project.screenshotPath}`)
    : undefined;

  return {
    title: `${project.title} Case Study | TechSonance`,
    description: project.shortDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${project.title} - Case Study`,
      description: project.shortDescription,
      type: "article",
      url: canonicalUrl,
      images: screenshotUrl
        ? [
          {
            url: screenshotUrl,
            width: 1200,
            height: 630,
            alt: `${project.title} Case Study Screenshot`,
          },
        ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${project.title} Case Study | TechSonance`,
      description: project.shortDescription,
      images: screenshotUrl ? [screenshotUrl] : [],
    },
  };
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const caseStudySchema = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "name": `${project.title} Case Study`,
    "headline": `${project.title}: ${project.shortDescription}`,
    "description": project.shortDescription,
    "url": `${BASE_URL}/portfolio/${project.slug}`,
    "author": {
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      "name": "TechSonance Infotech LLP"
    },
    "publisher": {
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      "name": "TechSonance Infotech LLP"
    }
  };

  return (
    <>
      <JsonLd schema={caseStudySchema} />
      <ProjectDetailClient project={project} />
    </>
  );
}

