import type { Metadata } from "next";
import PricingClient from "./PricingClient";
import { SEO_METADATA } from "@/lib/seo-aeo-geo-config";

export const metadata: Metadata = {
  title: SEO_METADATA.pricing.title,
  description: SEO_METADATA.pricing.description,
  keywords: SEO_METADATA.pricing.keywords,
  alternates: {
    canonical: SEO_METADATA.pricing.canonical,
  },
  openGraph: {
    title: SEO_METADATA.pricing.ogTitle,
    description: SEO_METADATA.pricing.ogDescription,
    url: SEO_METADATA.pricing.canonical,
    images: [{ url: SEO_METADATA.pricing.ogImage }],
  },
};

export default function PricingPage() {
  return <PricingClient />;
}
