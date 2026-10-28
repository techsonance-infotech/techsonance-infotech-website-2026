import type { Metadata } from "next";
import BlogClient from "./BlogClient";
import JsonLd from "@/app/components/JsonLd";
import { BASE_URL, SEO_METADATA } from "@/lib/seo-aeo-geo-config";
import { blogPosts } from "@/data/blog";

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
  const blogUrl = `${BASE_URL}/blog`;

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Blog",
        "@id": `${blogUrl}#blog`,
        name: "TechSonance Engineering & Architecture Blog",
        description: SEO_METADATA.blog.description,
        url: blogUrl,
        publisher: {
          "@type": "Organization",
          "@id": `${BASE_URL}/#organization`,
          name: "TechSonance Infotech LLP",
        },
        blogPost: blogPosts.map((post) => ({
          "@type": "BlogPosting",
          "@id": `${BASE_URL}/blog/${post.slug}`,
          headline: post.title,
          description: post.excerpt,
          url: `${BASE_URL}/blog/${post.slug}`,
          datePublished: post.date,
        })),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${blogUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: BASE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Blog",
            item: blogUrl,
          },
        ],
      },
    ],
  };

  return (
    <>
      <JsonLd schema={schema} />
      <BlogClient />
    </>
  );
}
