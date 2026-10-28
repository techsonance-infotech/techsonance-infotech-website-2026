import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { blogPosts, getPostBySlug } from "@/data/blog";
import BlogPostClient from "./BlogPostClient";
import JsonLd, { getArticleSchema } from "@/app/components/JsonLd";
import { BASE_URL } from "@/lib/seo-aeo-geo-config";

interface BlogDetailPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return { title: "Post Not Found | TechSonance Blog" };
  }

  const canonicalUrl = `${BASE_URL}/blog/${post.slug}`;
  const heroImageUrl = post.heroImage.startsWith("http")
    ? post.heroImage
    : `${BASE_URL}${post.heroImage}`;

  let publishedTime: string;
  try {
    publishedTime = new Date(post.date).toISOString();
  } catch {
    publishedTime = new Date("2026-10-14T00:00:00.000Z").toISOString();
  }

  return {
    title: `${post.title} | TechSonance Blog`,
    description: post.excerpt,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      url: canonicalUrl,
      publishedTime,
      authors: post.authors.map((a) => a.name),
      images: [
        {
          url: heroImageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} | TechSonance Blog`,
      description: post.excerpt,
      images: [heroImageUrl],
    },
  };
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = blogPosts
    .filter((p) => p.slug !== post.slug)
    .slice(0, 2);

  const heroImageUrl = post.heroImage.startsWith("http")
    ? post.heroImage
    : `${BASE_URL}${post.heroImage}`;

  let publishedTime: string;
  try {
    publishedTime = new Date(post.date).toISOString();
  } catch {
    publishedTime = new Date("2026-10-14T00:00:00.000Z").toISOString();
  }

  const postUrl = `${BASE_URL}/blog/${post.slug}`;

  const articleSchema = getArticleSchema(
    post.title,
    post.excerpt,
    heroImageUrl,
    publishedTime,
    post.authors.map((a) => a.name).join(" & "),
    postUrl
  );

  const breadcrumbSchema = {
    "@type": "BreadcrumbList",
    "@id": `${postUrl}#breadcrumb`,
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": BASE_URL,
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Blog",
        "item": `${BASE_URL}/blog`,
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": post.title,
        "item": postUrl,
      },
    ],
  };

  const faqSchema = post.faqs && post.faqs.length > 0 ? {
    "@type": "FAQPage",
    "@id": `${postUrl}#faq`,
    "mainEntity": post.faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
      },
    })),
  } : null;

  const unifiedSchema = {
    "@context": "https://schema.org",
    "@graph": [
      articleSchema,
      breadcrumbSchema,
      ...(faqSchema ? [faqSchema] : []),
    ],
  };

  return (
    <>
      <JsonLd schema={unifiedSchema} />
      <BlogPostClient post={post} relatedPosts={relatedPosts} />
    </>
  );
}
