import type { Metadata } from "next";
import BlogClient from "./BlogClient";
import { SEO_METADATA } from "@/lib/seo-aeo-geo-config";

export const metadata: Metadata = {
  title: SEO_METADATA.blog.title,
  description: SEO_METADATA.blog.description,
  keywords: SEO_METADATA.blog.keywords,
  alternates: {
    canonical: SEO_METADATA.blog.canonical,
  },
  openGraph: {
    title: SEO_METADATA.blog.ogTitle,
    description: SEO_METADATA.blog.ogDescription,
    url: SEO_METADATA.blog.canonical,
    images: [{ url: SEO_METADATA.blog.ogImage }],
  },
};

export default function BlogListingPage() {
  return <BlogClient />;
}
