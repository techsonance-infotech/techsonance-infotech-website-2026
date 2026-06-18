import type { Metadata } from "next";
import TermsClient from "./TermsClient";
import { SEO_METADATA } from "@/lib/seo-aeo-geo-config";

export const metadata: Metadata = {
  title: SEO_METADATA.terms.title,
  description: SEO_METADATA.terms.description,
  keywords: SEO_METADATA.terms.keywords,
  alternates: {
    canonical: SEO_METADATA.terms.canonical,
  },
  openGraph: {
    title: SEO_METADATA.terms.ogTitle,
    description: SEO_METADATA.terms.ogDescription,
    url: SEO_METADATA.terms.canonical,
    images: [{ url: SEO_METADATA.terms.ogImage }],
  },
};

export default function TermsConditionsPage() {
  return <TermsClient />;
}
