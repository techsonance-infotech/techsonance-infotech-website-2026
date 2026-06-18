import type { Metadata } from "next";
import PortfolioClient from "./PortfolioClient";
import { SEO_METADATA } from "@/lib/seo-aeo-geo-config";

export const metadata: Metadata = {
  title: SEO_METADATA.portfolio.title,
  description: SEO_METADATA.portfolio.description,
  keywords: SEO_METADATA.portfolio.keywords,
  alternates: {
    canonical: SEO_METADATA.portfolio.canonical,
  },
  openGraph: {
    title: SEO_METADATA.portfolio.ogTitle,
    description: SEO_METADATA.portfolio.ogDescription,
    url: SEO_METADATA.portfolio.canonical,
    images: [{ url: SEO_METADATA.portfolio.ogImage }],
  },
};

export default function PortfolioPage() {
  return <PortfolioClient />;
}
