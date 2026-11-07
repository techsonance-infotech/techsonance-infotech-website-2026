"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import SiteHeader from "@/app/components/home/SiteHeader";
import SiteFooter from "@/app/components/home/SiteFooter";
import { Icon } from "@/app/components/icons/Icon";
import { blogPosts } from "@/data/blog";
import type { BlogPost } from "@/lib/content/types";

const categories = ["All", "Software Engineering", "AI & Automation", "Product Design"];

interface BlogClientProps {
  initialPosts?: BlogPost[];
}

export default function BlogClient({ initialPosts }: BlogClientProps) {
  const posts = initialPosts ?? blogPosts;
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredPosts =
    selectedCategory === "All" ? posts : posts.filter((post) => post.category === selectedCategory);

  // Use the first post as featured
  const featuredPost = posts[0];
  const gridPosts = filteredPosts.filter(
    (post) => post.slug !== featuredPost?.slug || selectedCategory !== "All",
  );

  return (
    <>
      <SiteHeader transparent={true} />
      <main className="relative min-h-screen overflow-hidden bg-[#FAFBFD] pt-24 pb-20">
        {/* Custom Unique Background: Resonance Mesh & Wave Lines */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Mesh gradient */}
          <div className="absolute top-0 right-0 left-0 h-[600px] bg-gradient-to-tr from-[#FAFBFD] via-[#EEF5FF] to-[#F5F9FF] opacity-90" />

          {/* Subtle diagonal grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(45deg, #1155cc 0.5px, transparent 0.5px), 
                linear-gradient(-45deg, #1155cc 0.5px, transparent 0.5px)
              `,
              backgroundSize: "60px 60px",
            }}
          />

          {/* Glowing neon ambient orbs */}
          <div
            className="absolute top-20 left-[10%] h-[350px] w-[350px] animate-pulse rounded-full bg-[#1155CC]/5 blur-[80px]"
            style={{ animationDuration: "10s" }}
          />
          <div
            className="absolute top-40 right-[15%] h-[400px] w-[400px] animate-pulse rounded-full bg-[#22B6F6]/5 blur-[100px]"
            style={{ animationDuration: "14s" }}
          />

          {/* SVG Resonance Waves - Unique Theme Background */}
          <svg
            className="absolute top-[10%] left-0 h-[300px] w-full text-[#1155CC] opacity-[0.06]"
            viewBox="0 0 1440 300"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <motion.path
              d="M0 150 C300 280, 600 20, 900 280 C1200 140, 1350 20, 1440 150"
              stroke="currentColor"
              strokeWidth="2"
              animate={{
                d: [
                  "M0 150 C300 280, 600 20, 900 280 C1200 140, 1350 20, 1440 150",
                  "M0 150 C300 20, 600 280, 900 20 C1200 280, 1350 140, 1440 150",
                  "M0 150 C300 280, 600 20, 900 280 C1200 140, 1350 20, 1440 150",
                ],
              }}
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.path
              d="M0 150 C200 80, 500 220, 800 80 C1100 220, 1300 80, 1440 150"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              animate={{
                d: [
                  "M0 150 C200 80, 500 220, 800 80 C1100 220, 1300 80, 1440 150",
                  "M0 150 C200 220, 500 80, 800 220 C1100 80, 1300 220, 1440 150",
                  "M0 150 C200 80, 500 220, 800 80 C1100 220, 1300 80, 1440 150",
                ],
              }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            />
          </svg>
        </div>

        {/* Hero Content */}
        <section className="relative z-10 mx-auto max-w-7xl px-4 pt-10 pb-12 text-center sm:px-6 sm:pt-16 lg:px-8">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-4 inline-block rounded-full border border-[#1155CC]/10 bg-[#1155CC]/5 px-3 py-1.5 text-[10px] font-black tracking-[0.25em] text-[#1155CC] uppercase"
          >
            Insights & Engineering Culture
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-sora text-4xl font-black tracking-tight text-slate-900 sm:text-5xl md:text-6xl"
          >
            The TechSonance{" "}
            <span className="bg-gradient-to-r from-[#1155CC] to-[#22B6F6] bg-clip-text text-transparent">
              Blog
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-4 max-w-2xl text-sm font-semibold text-slate-500 sm:text-base"
          >
            Engineering strategies, design practices, and operational insights from our custom
            software development team.
          </motion.p>
        </section>

        {/* Blog Directory & Filtering */}
        <section className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Categories Filters bar */}
          <div className="mb-12 flex flex-wrap items-center justify-center gap-2 border-b border-slate-100 pb-6">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  selectedCategory === category
                    ? "bg-[#1155CC] text-white shadow-md shadow-[#1155CC]/15"
                    : "text-slate-600 hover:text-[#1155CC] bg-white border border-slate-100 hover:border-[#1155CC]/20"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Featured Post Card (only shown when category is 'All') */}
          {selectedCategory === "All" && featuredPost && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="group mb-16 grid grid-cols-1 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_15px_45px_rgba(17,85,204,0.02)] transition-all duration-300 hover:shadow-[0_25px_60px_rgba(17,85,204,0.05)] lg:grid-cols-12"
            >
              {/* Image box */}
              <div className="relative flex h-64 min-h-[280px] items-center justify-center overflow-hidden border-b border-slate-100 bg-gradient-to-br from-[#1155CC]/10 to-[#22B6F6]/10 sm:h-80 lg:col-span-6 lg:h-full lg:border-r lg:border-b-0">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#1155CC]/20 via-transparent to-[#22B6F6]/20 opacity-50 transition-all duration-500 group-hover:scale-105" />
                <Icon
                  name="code"
                  className="h-16 w-16 text-[#1155CC]/30 transition-all duration-500 group-hover:scale-110"
                />
                <span className="absolute top-4 left-4 rounded-lg bg-[#1155CC] px-3 py-1.5 text-[10px] font-black tracking-wider text-white uppercase shadow-sm">
                  Featured
                </span>
              </div>

              {/* Content box */}
              <div className="flex flex-col justify-between p-6 sm:p-8 lg:col-span-6">
                <div>
                  <span className="mb-2 block text-[10px] font-black tracking-wider text-[#1155CC] uppercase">
                    {featuredPost.category}
                  </span>
                  <Link href={`/blog/${featuredPost.slug}`}>
                    <h3 className="mb-4 font-sora text-xl leading-tight font-medium text-slate-900 transition-colors hover:text-[#1155CC] sm:text-2xl">
                      {featuredPost.title}
                    </h3>
                  </Link>
                  <p className="mb-6 text-xs leading-relaxed font-medium text-slate-500 sm:text-sm">
                    {featuredPost.excerpt}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-4">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2.5 overflow-hidden">
                      {featuredPost.authors.map((auth, index) => (
                        <div
                          key={auth.name}
                          className="relative flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#1155CC] text-xs font-bold text-white shadow-inner"
                          style={{ zIndex: 10 - index }}
                        >
                          {auth.avatar}
                        </div>
                      ))}
                    </div>
                    <div>
                      <span className="mb-1 block text-xs leading-none font-bold text-slate-800">
                        {featuredPost.authors.map((a) => a.name).join(" & ")}
                      </span>
                      <span className="block text-[10px] leading-none font-medium text-slate-400">
                        {featuredPost.authors.map((a) => a.role).join(" / ")}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="mb-1 block text-[10px] leading-none font-bold text-slate-400">
                      {featuredPost.date}
                    </span>
                    <span className="rounded-full bg-[#1155CC]/5 px-2 py-0.5 text-[10px] font-semibold text-[#1155CC]">
                      {featuredPost.readTime}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Blog posts list grid */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {gridPosts.map((post) => (
                <motion.article
                  key={post.slug}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_12px_30px_rgba(17,85,204,0.01)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(17,85,204,0.04)]"
                >
                  <div>
                    {/* Card Image area */}
                    <div className="relative flex h-48 items-center justify-center overflow-hidden border-b border-slate-50 bg-gradient-to-br from-[#1155CC]/5 to-[#22B6F6]/5">
                      <div className="absolute inset-0 bg-gradient-to-tr from-[#1155CC]/10 via-transparent to-[#22B6F6]/10 opacity-30 transition-all duration-500 group-hover:scale-105" />
                      <Icon
                        name="monitor"
                        className="h-12 w-12 text-[#1155CC]/25 transition-all duration-500 group-hover:scale-110"
                      />
                      <span className="absolute top-4 left-4 rounded-lg border border-slate-100 bg-white/90 px-2.5 py-1 text-[9px] font-black tracking-wider text-[#1155CC] uppercase backdrop-blur-sm">
                        {post.category}
                      </span>
                    </div>

                    {/* Card details */}
                    <div className="p-6">
                      <Link href={`/blog/${post.slug}`}>
                        <h4 className="mb-2.5 line-clamp-2 font-sora text-base leading-snug font-medium text-slate-900 transition-colors hover:text-[#1155CC] sm:text-lg">
                          {post.title}
                        </h4>
                      </Link>
                      <p className="line-clamp-3 text-xs leading-relaxed font-semibold text-slate-500">
                        {post.excerpt}
                      </p>
                    </div>
                  </div>

                  {/* Card bottom meta */}
                  <div className="p-6 pt-0">
                    <div className="mt-2 flex items-center justify-between border-t border-slate-50/50 pt-4">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2 overflow-hidden">
                          {post.authors.map((auth, index) => (
                            <div
                              key={auth.name}
                              className="relative flex h-8 w-8 items-center justify-center rounded-full border border-white bg-[#1155CC]/5 text-[10px] font-bold text-[#1155CC] shadow-sm"
                              style={{ zIndex: 10 - index }}
                            >
                              {auth.avatar}
                            </div>
                          ))}
                        </div>
                        <div>
                          <span className="block text-[10px] leading-tight font-bold text-slate-800">
                            {post.authors.map((a) => a.name).join(" & ")}
                          </span>
                          <span className="mt-0.5 block text-[9px] leading-none font-medium text-slate-400">
                            {post.authors.map((a) => a.role).join(" / ")}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="mb-0.5 block text-[9px] font-bold text-slate-400">
                          {post.date}
                        </span>
                        <span className="text-[9px] font-semibold text-[#1155CC]">
                          {post.readTime}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.article>
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
    </>
  );
}
