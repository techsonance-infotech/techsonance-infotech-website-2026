import type { Metadata } from "next";
import AboutClient from "./AboutClient";
import { SEO_METADATA } from "@/lib/seo-aeo-geo-config";

export const metadata: Metadata = {
  title: SEO_METADATA.about.title,
  description: SEO_METADATA.about.description,
  keywords: SEO_METADATA.about.keywords,
  alternates: {
    canonical: SEO_METADATA.about.canonical,
  },
  openGraph: {
    title: SEO_METADATA.about.ogTitle,
    description: SEO_METADATA.about.ogDescription,
    url: SEO_METADATA.about.canonical,
    images: [{ url: SEO_METADATA.about.ogImage }],
  },
};

export default function AboutPage() {
  return <AboutClient />;
}
