import type { Metadata } from "next";
import ServicesClient from "./ServicesClient";
import { SEO_METADATA } from "@/lib/seo-aeo-geo-config";

export const metadata: Metadata = {
  title: SEO_METADATA.services.title,
  description: SEO_METADATA.services.description,
  keywords: SEO_METADATA.services.keywords,
  alternates: {
    canonical: SEO_METADATA.services.canonical,
  },
  openGraph: {
    title: SEO_METADATA.services.ogTitle,
    description: SEO_METADATA.services.ogDescription,
    url: SEO_METADATA.services.canonical,
    images: [{ url: SEO_METADATA.services.ogImage }],
  },
};

export default function ServicesPage() {
  return <ServicesClient />;
}
