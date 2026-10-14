import { MetadataRoute } from "next";
import { services } from "@/data/services";
import { projects } from "@/data/projects";
import { blogPosts } from "@/data/blog";
import { landingPages } from "@/data/landing-pages";
import { BASE_URL } from "@/lib/seo-aeo-geo-config";

const STATIC_LAST_MOD = new Date("2026-10-14T00:00:00.000Z");

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
    lastModified: STATIC_LAST_MOD,
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  // Map programmatic landing pages (locations, technology, specialized pages)
  const landingPageUrls = Object.values(landingPages).map((lp) => ({
    url: `${BASE_URL}${lp.route}`,
    lastModified: STATIC_LAST_MOD,
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }));

  // Map service routes (primary canonical slugs only, no aliases)
  const serviceUrls = services.map((s) => ({
    url: `${BASE_URL}/services/${s.slug}`,
    lastModified: STATIC_LAST_MOD,
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }));

  // Map portfolio project routes
  const projectUrls = projects.map((p) => ({
    url: `${BASE_URL}/portfolio/${p.slug}`,
    lastModified: STATIC_LAST_MOD,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // Map blog post routes with real post dates
  const blogUrls = blogPosts.map((post) => {
    let postDate: Date;
    try {
      postDate = new Date(post.date);
      if (isNaN(postDate.getTime())) {
        postDate = STATIC_LAST_MOD;
      }
    } catch {
      postDate = STATIC_LAST_MOD;
    }

    return {
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: postDate,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    };
  });

  return [...staticUrls, ...landingPageUrls, ...serviceUrls, ...projectUrls, ...blogUrls];
}


