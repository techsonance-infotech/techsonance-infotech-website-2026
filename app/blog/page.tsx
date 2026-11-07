import type { Metadata } from "next";
import { Suspense } from "react";
import BlogClient from "./BlogClient";
import JsonLd from "@/app/components/JsonLd";
import { BASE_URL, SEO_METADATA } from "@/lib/seo-aeo-geo-config";
import { getPostSource } from "@/lib/content/posts";
import type { BlogPost } from "@/lib/content/types";
import { publicBlogListBoundarySchema } from "@/lib/validations/public-blog-boundary.schema";
import BlogLoading from "./loading";

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

export default async function BlogListingPage() {
  let posts: BlogPost[] = [];

  try {
    const source = getPostSource();
    const rawPosts = await source.list();
    posts = publicBlogListBoundarySchema.parse(rawPosts);
  } catch {
    posts = [];
  }

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
        blogPost: posts.map((post) => ({
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
      <Suspense fallback={<BlogLoading />}>
        <BlogClient initialPosts={posts} />
      </Suspense>
    </>
  );
}
