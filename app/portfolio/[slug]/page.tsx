import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProjectBySlug, projects } from "@/data/projects";
import ProjectDetailClient from "./ProjectDetailClient";

export function generateStaticParams() {
  return projects.map((project) => ({
    slug: project.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return { title: "Project Not Found" };

  return {
    title: `${project.title} Case Study | TechSonance`,
    description: project.shortDescription,
    openGraph: {
      title: `${project.title} - Case Study`,
      description: project.shortDescription,
      type: "article",
      images: project.screenshotPath
        ? [
          {
            url: project.screenshotPath,
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
      images: project.screenshotPath ? [project.screenshotPath] : [],
    },
  };
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  return <ProjectDetailClient project={project} />;
}
