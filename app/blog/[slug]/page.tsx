import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPostSource } from "@/lib/content/posts";
import BlogPostClient from "./BlogPostClient";
import JsonLd, { getArticleSchema } from "@/app/components/JsonLd";
import { BASE_URL } from "@/lib/seo-aeo-geo-config";
import type { BlogPost } from "@/lib/content/types";
import { renderMarkdownToHtml, extractTableOfContents } from "@/lib/utils/markdown";
import {
  publicBlogPostBoundarySchema,
  publicBlogListBoundarySchema,
} from "@/lib/validations/public-blog-boundary.schema";

interface BlogDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const source = getPostSource();
    const slugs = await source.slugs();
    return slugs.map((slug) => ({
      slug,
    }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const source = getPostSource();
    const rawPost = await source.get(slug);

    if (!rawPost) {
      return { title: "Post Not Found | TechSonance Blog" };
    }

    const post = publicBlogPostBoundarySchema.parse(rawPost);
    const canonicalUrl = `${BASE_URL}/blog/${post.slug}`;
    const rawHero = post.heroImage || "";
    const heroImageUrl = rawHero.startsWith("http")
      ? rawHero
      : rawHero
        ? `${BASE_URL}${rawHero}`
        : `${BASE_URL}/images/og/blog.png`;

    let publishedTime: string;
    const parsedTimestamp = new Date(post.date).getTime();
    if (Number.isFinite(parsedTimestamp)) {
      publishedTime = new Date(parsedTimestamp).toISOString();
    } else {
      publishedTime = new Date().toISOString();
    }

    const authorNames =
      Array.isArray(post.authors) && post.authors.length > 0
        ? post.authors.map((a) => a?.name || "TechSonance Team")
        : ["TechSonance Team"];

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
        authors: authorNames,
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
  } catch {
    return { title: "TechSonance Engineering Blog" };
  }
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  let post: BlogPost;
  let relatedPosts: BlogPost[] = [];
  let tocItems: { id: string; text: string; depth: number }[] = [];

  try {
    const source = getPostSource();
    const rawPost = await source.get(slug);

    if (!rawPost) {
      notFound();
    }

    post = publicBlogPostBoundarySchema.parse(rawPost);

    // Extract Table of Contents from raw markdown before HTML conversion
    const rawContent = post.content || "";
    tocItems = extractTableOfContents(rawContent);

    // Transform Markdown to clean, semantic HTML on the server for SSR and SEO
    post = {
      ...post,
      content: renderMarkdownToHtml(rawContent),
    };

    const allPostsRaw = await source.list();
    const allPosts = publicBlogListBoundarySchema.parse(allPostsRaw);
    relatedPosts = allPosts.filter((p) => p.slug !== post.slug).slice(0, 2);
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "digest" in err) {
      const digest = String((err as { digest?: string }).digest || "");
      if (digest.includes("NEXT_NOT_FOUND") || digest.includes("NEXT_REDIRECT")) {
        throw err;
      }
    }
    throw err;
  }

  const rawHero = post.heroImage || "";
  const heroImageUrl = rawHero.startsWith("http")
    ? rawHero
    : rawHero
      ? `${BASE_URL}${rawHero}`
      : `${BASE_URL}/images/og/blog.png`;

  let publishedTime: string;
  const parsedTimestamp = new Date(post.date).getTime();
  if (Number.isFinite(parsedTimestamp)) {
    publishedTime = new Date(parsedTimestamp).toISOString();
  } else {
    publishedTime = new Date().toISOString();
  }

  const postUrl = `${BASE_URL}/blog/${post.slug}`;
  const authorsString =
    Array.isArray(post.authors) && post.authors.length > 0
      ? post.authors.map((a) => a?.name || "TechSonance Team").join(" & ")
      : "TechSonance Team";

  const articleSchema = getArticleSchema(
    post.title,
    post.excerpt,
    heroImageUrl,
    publishedTime,
    authorsString,
    postUrl,
  );

  const breadcrumbSchema = {
    "@type": "BreadcrumbList",
    "@id": `${postUrl}#breadcrumb`,
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
        item: `${BASE_URL}/blog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: postUrl,
      },
    ],
  };

  const faqSchema =
    Array.isArray(post.faqs) && post.faqs.length > 0
      ? {
          "@type": "FAQPage",
          "@id": `${postUrl}#faq`,
          mainEntity: post.faqs
            .filter((faq) => faq && faq.question && faq.answer)
            .map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer,
              },
            })),
        }
      : null;

  const unifiedSchema = {
    "@context": "https://schema.org",
    "@graph": [articleSchema, breadcrumbSchema, ...(faqSchema ? [faqSchema] : [])],
  };

  return (
    <>
      <JsonLd schema={unifiedSchema} />
      <BlogPostClient post={post} relatedPosts={relatedPosts} tocItems={tocItems} />
    </>
  );
}
