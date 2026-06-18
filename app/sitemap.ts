import { MetadataRoute } from "next";
import { services } from "@/data/services";
import { projects } from "@/data/projects";
import { blogPosts } from "@/data/blog";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://techsonance.co.in";

// Map requested aliases to internal slugs
const aliasSlugs = [
  "saas-development",
  "web-app-development",
  "mobile-app-development",
  "api-integration",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/about",
    "/portfolio",
    "/blog",
    "/careers",
    "/contact",
    "/privacy-policy",
    "/terms",
    "/services",
  ];

  // Map primary static routes
  const staticUrls = routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  // Map service routes (canonical + aliases)
  const serviceSlugs = services.map((s) => s.slug);
  const allServiceSlugs = [...serviceSlugs, ...aliasSlugs];
  
  const serviceUrls = allServiceSlugs.map((slug) => ({
    url: `${BASE_URL}/services/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }));

  // Map portfolio project routes
  const projectUrls = projects.map((p) => ({
    url: `${BASE_URL}/portfolio/${p.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // Map blog post routes
  const blogUrls = blogPosts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.75,
  }));

  return [...staticUrls, ...serviceUrls, ...projectUrls, ...blogUrls];
}
