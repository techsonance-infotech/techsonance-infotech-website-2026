import { notFound } from "next/navigation";
import { services, getFullServiceBySlug } from "@/data/services";
import ServicePageClient from "@/app/components/services/ServicePageClient";

export function generateStaticParams() {
  return services.map((service) => ({
    slug: service.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = getFullServiceBySlug(slug);
  if (!service) return { title: "Service Not Found" };

  return {
    title: `${service.name} - TechSonance InfoTech LLP`,
    description: service.quickSummary,
  };
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = getFullServiceBySlug(slug);

  if (!service) {
    notFound();
  }

  return <ServicePageClient service={service} />;
}
