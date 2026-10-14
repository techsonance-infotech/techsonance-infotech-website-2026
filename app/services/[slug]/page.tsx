import { notFound } from "next/navigation";
import { services, getFullServiceBySlug } from "@/data/services";
import ServicePageClient from "@/app/components/services/ServicePageClient";
import { SEO_METADATA, BASE_URL, getAeoFaqsForSlug } from "@/lib/seo-aeo-geo-config";
import JsonLd, { getServiceSchema, getFaqSchema, getBreadcrumbSchema } from "@/app/components/JsonLd";

// Map requested aliases to internal slugs
const slugMap: Record<string, string> = {
  "saas-development": "saas-product-development",
  "web-app-development": "web-development",
  "mobile-app-development": "mobile-development",
  "api-integration": "api-integrations",
};

export function generateStaticParams() {
  const baseParams = services.map((service) => ({
    slug: service.slug,
  }));
  const aliasParams = Object.keys(slugMap).map((alias) => ({
    slug: alias,
  }));
  return [...baseParams, ...aliasParams];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const mappedSlug = slugMap[slug] || slug;
  const service = getFullServiceBySlug(mappedSlug);
  if (!service) return { title: "Service Not Found" };

  const seo = SEO_METADATA[mappedSlug];
  const canonicalUrl = `${BASE_URL}/services/${mappedSlug}`;
  return {
    title: seo ? seo.title : `${service.name} - TechSonance InfoTech LLP`,
    description: seo ? seo.description : service.quickSummary,
    keywords: seo ? seo.keywords : [],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: seo ? seo.ogTitle : service.name,
      description: seo ? seo.ogDescription : service.quickSummary,
      url: canonicalUrl,
      images: [{ url: seo ? seo.ogImage : "/images/logo-icon.png" }],
    },
    twitter: {
      card: "summary_large_image",
      title: seo ? seo.ogTitle : service.name,
      description: seo ? seo.ogDescription : service.quickSummary,
      images: [seo ? seo.ogImage : "/images/logo-icon.png"],
    }
  };
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const mappedSlug = slugMap[slug] || slug;
  const service = getFullServiceBySlug(mappedSlug);

  if (!service) {
    notFound();
  }

  // Compile FAQs from single source of truth (AEO_FAQS matching visible UI)
  const aeoFaqs = getAeoFaqsForSlug(mappedSlug);
  const serviceFaqItems = aeoFaqs.length > 0
    ? aeoFaqs.map((f) => ({
        question: f.question,
        answer: `${f.directAnswer} ${f.expandedExplanation}`,
      }))
    : service.faqs.map((f) => ({
        question: f.question,
        answer: f.answer,
      }));

  // Create dynamic schemas
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: BASE_URL },
    { name: "Services", url: `${BASE_URL}/services` },
    { name: service.name, url: `${BASE_URL}/services/${mappedSlug}` },
  ]);

  const serviceSchema = getServiceSchema(service.name, service.quickSummary, BASE_URL);
  const faqSchema = getFaqSchema(serviceFaqItems);

  return (
    <>
      <JsonLd schema={breadcrumbSchema} />
      <JsonLd schema={serviceSchema} />
      <JsonLd schema={faqSchema} />
      <ServicePageClient service={service} />
    </>
  );
}

