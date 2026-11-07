"use client";

import React, { useState } from "react";
import { LazyMotion, domMax, AnimatePresence } from "motion/react";
import SiteHeader from "@/app/components/home/SiteHeader";
import SiteFooter from "@/app/components/home/SiteFooter";
import { Icon } from "@/app/components/icons/Icon";
import { blogPosts } from "@/data/blog";
import type { BlogPost } from "@/lib/content/types";
import { BlogResonanceBackground } from "@/app/components/blog/BlogResonanceBackground";
import { BlogHero } from "@/app/components/blog/BlogHero";
import { BlogFeaturedCard } from "@/app/components/blog/BlogFeaturedCard";
import { BlogCard } from "@/app/components/blog/BlogCard";

const CATEGORIES = ["All", "Software Engineering", "AI & Automation", "Product Design"] as const;

interface BlogClientProps {
  initialPosts?: BlogPost[];
}

export default function BlogClient({ initialPosts }: BlogClientProps): React.JSX.Element {
  const posts = initialPosts ?? blogPosts;
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const filteredPosts =
    selectedCategory === "All" ? posts : posts.filter((post) => post.category === selectedCategory);

  // Use the first post as featured
  const featuredPost = posts[0];
  const gridPosts = filteredPosts.filter(
    (post) => post.slug !== featuredPost?.slug || selectedCategory !== "All",
  );

  return (
    <LazyMotion features={domMax} strict>
      <SiteHeader transparent={true} />
      <main className="relative min-h-screen overflow-hidden bg-[#FAFBFD] pt-24 pb-20">
        <BlogResonanceBackground />
        <BlogHero />

        {/* Blog Directory & Filtering */}
        <section className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Categories Filters bar */}
          <div className="mb-12 flex flex-wrap items-center justify-center gap-2 border-b border-slate-100 pb-6">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  selectedCategory === category
                    ? "bg-[#1155CC] text-white shadow-md shadow-[#1155CC]/15"
                    : "border border-slate-100 bg-white text-slate-600 hover:border-[#1155CC]/20 hover:text-[#1155CC]"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Featured Post Card (only shown when category is 'All') */}
          {selectedCategory === "All" && featuredPost && <BlogFeaturedCard post={featuredPost} />}

          {/* Blog posts list grid */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {gridPosts.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </AnimatePresence>
          </div>

          {/* Empty fallback state */}
          {filteredPosts.length === 0 && (
            <div className="rounded-3xl border border-slate-100 bg-white py-20 text-center shadow-[0_15px_30px_rgba(17,85,204,0.01)]">
              <Icon name="beaker" className="mx-auto mb-4 h-12 w-12 text-[#1155CC]/30" />
              <h3 className="mb-1 text-base font-medium text-slate-900">No articles found</h3>
              <p className="text-xs font-semibold text-slate-400">
                Check back later or try selecting another category.
              </p>
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </LazyMotion>
  );
}
