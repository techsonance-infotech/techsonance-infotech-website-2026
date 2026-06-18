import type { Metadata } from "next";
import CareersClient from "./CareersClient";
import { SEO_METADATA } from "@/lib/seo-aeo-geo-config";

export const metadata: Metadata = {
  title: SEO_METADATA.careers.title,
  description: SEO_METADATA.careers.description,
  keywords: SEO_METADATA.careers.keywords,
  alternates: {
    canonical: SEO_METADATA.careers.canonical,
  },
  openGraph: {
    title: SEO_METADATA.careers.ogTitle,
    description: SEO_METADATA.careers.ogDescription,
    url: SEO_METADATA.careers.canonical,
    images: [{ url: SEO_METADATA.careers.ogImage }],
  },
};

export default function CareersPage() {
  return <CareersClient />;
}
