"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import SiteHeader from "@/app/components/home/SiteHeader";
import SiteFooter from "@/app/components/home/SiteFooter";
import { Icon } from "@/app/components/icons/Icon";
import { blogPosts, type BlogPost } from "@/data/blog";

const categories = ["All", "Software Engineering", "AI & Automation", "Product Design"];

export default function BlogClient() {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredPosts = selectedCategory === "All"
    ? blogPosts
    : blogPosts.filter((post) => post.category === selectedCategory);

  // Use the first post as featured
  const featuredPost = blogPosts[0];
  const gridPosts = filteredPosts.filter((post) => post.slug !== featuredPost.slug || selectedCategory !== "All");

  return (
    <>
      <SiteHeader transparent={true} />
      <main className="bg-[#FAFBFD] min-h-screen pt-24 pb-20 relative overflow-hidden">
        {/* Custom Unique Background: Resonance Mesh & Wave Lines */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Mesh gradient */}
          <div className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-tr from-[#FAFBFD] via-[#EEF5FF] to-[#F5F9FF] opacity-90" />
          
          {/* Subtle diagonal grid pattern */}
          <div 
            className="absolute inset-0 opacity-[0.03]" 
            style={{ 
              backgroundImage: `
                linear-gradient(45deg, #1155cc 0.5px, transparent 0.5px), 
                linear-gradient(-45deg, #1155cc 0.5px, transparent 0.5px)
              `, 
              backgroundSize: "60px 60px" 
            }} 
          />

          {/* Glowing neon ambient orbs */}
          <div className="absolute top-20 left-[10%] w-[350px] h-[350px] bg-[#1155CC]/5 rounded-full blur-[80px] animate-pulse" style={{ animationDuration: "10s" }} />
          <div className="absolute top-40 right-[15%] w-[400px] h-[400px] bg-[#22B6F6]/5 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: "14s" }} />

          {/* SVG Resonance Waves - Unique Theme Background */}
          <svg className="absolute top-[10%] left-0 w-full h-[300px] opacity-[0.06] text-[#1155CC]" viewBox="0 0 1440 300" fill="none" xmlns="http://www.w3.org/2000/svg">
            <motion.path 
              d="M0 150 C300 280, 600 20, 900 280 C1200 140, 1350 20, 1440 150" 
              stroke="currentColor" 
              strokeWidth="2"
              animate={{
                d: [
                  "M0 150 C300 280, 600 20, 900 280 C1200 140, 1350 20, 1440 150",
                  "M0 150 C300 20, 600 280, 900 20 C1200 280, 1350 140, 1440 150",
                  "M0 150 C300 280, 600 20, 900 280 C1200 140, 1350 20, 1440 150"
                ]
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
                  "M0 150 C200 80, 500 220, 800 80 C1100 220, 1300 80, 1440 150"
                ]
              }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            />
          </svg>
        </div>

        {/* Hero Content */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 pb-12 relative z-10 text-center">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-[10px] font-black tracking-[0.25em] text-[#1155CC] uppercase bg-[#1155CC]/5 px-3 py-1.5 rounded-full mb-4 inline-block border border-[#1155CC]/10"
          >
            Insights & Engineering Culture
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-black font-sora text-slate-900 tracking-tight"
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
            className="mt-4 text-sm sm:text-base font-semibold text-slate-500 max-w-2xl mx-auto"
          >
            Engineering strategies, design practices, and operational insights from our custom software development team.
          </motion.p>
        </section>

        {/* Blog Directory & Filtering */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Categories Filters bar */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-12 border-b border-slate-100 pb-6">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
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
              className="mb-16 bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-[0_15px_45px_rgba(17,85,204,0.02)] hover:shadow-[0_25px_60px_rgba(17,85,204,0.05)] transition-all group duration-300 grid grid-cols-1 lg:grid-cols-12"
            >
              {/* Image box */}
              <div className="lg:col-span-6 h-64 sm:h-80 lg:h-full min-h-[280px] bg-gradient-to-br from-[#1155CC]/10 to-[#22B6F6]/10 relative flex items-center justify-center overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-100">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#1155CC]/20 via-transparent to-[#22B6F6]/20 opacity-50 group-hover:scale-105 transition-all duration-500" />
                <Icon name="code" className="w-16 h-16 text-[#1155CC]/30 group-hover:scale-110 transition-all duration-500" />
                <span className="absolute top-4 left-4 bg-[#1155CC] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-sm">
                  Featured
                </span>
              </div>
              
              {/* Content box */}
              <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black text-[#1155CC] uppercase tracking-wider block mb-2">
                    {featuredPost.category}
                  </span>
                  <Link href={`/blog/${featuredPost.slug}`}>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-sora leading-tight hover:text-[#1155CC] transition-colors mb-4">
                      {featuredPost.title}
                    </h3>
                  </Link>
                  <p className="text-xs sm:text-sm font-medium text-slate-500 leading-relaxed mb-6">
                    {featuredPost.excerpt}
                  </p>
                </div>
                
                <div className="flex items-center justify-between border-t border-slate-50 pt-4 mt-4">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2.5 overflow-hidden">
                      {featuredPost.authors.map((auth, index) => (
                        <div
                          key={auth.name}
                          className="w-9 h-9 rounded-full bg-[#1155CC] text-white border-2 border-white font-bold text-xs flex items-center justify-center shadow-inner relative"
                          style={{ zIndex: 10 - index }}
                        >
                          {auth.avatar}
                        </div>
                      ))}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block leading-none mb-1">
                        {featuredPost.authors.map((a) => a.name).join(" & ")}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400 leading-none block">
                        {featuredPost.authors.map((a) => a.role).join(" / ")}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 block leading-none mb-1">{featuredPost.date}</span>
                    <span className="text-[10px] font-semibold text-[#1155CC] bg-[#1155CC]/5 px-2 py-0.5 rounded-full">{featuredPost.readTime}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Blog posts list grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {gridPosts.map((post) => (
                <motion.article
                  key={post.slug}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-[0_12px_30px_rgba(17,85,204,0.01)] hover:shadow-[0_20px_45px_rgba(17,85,204,0.04)] hover:-translate-y-1 transition-all group duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Card Image area */}
                    <div className="h-48 bg-gradient-to-br from-[#1155CC]/5 to-[#22B6F6]/5 relative flex items-center justify-center overflow-hidden border-b border-slate-50">
                      <div className="absolute inset-0 bg-gradient-to-tr from-[#1155CC]/10 via-transparent to-[#22B6F6]/10 opacity-30 group-hover:scale-105 transition-all duration-500" />
                      <Icon name="monitor" className="w-12 h-12 text-[#1155CC]/25 group-hover:scale-110 transition-all duration-500" />
                      <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm border border-slate-100 text-[#1155CC] text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg">
                        {post.category}
                      </span>
                    </div>

                    {/* Card details */}
                    <div className="p-6">
                      <Link href={`/blog/${post.slug}`}>
                        <h4 className="text-base sm:text-lg font-extrabold text-slate-900 font-sora leading-snug hover:text-[#1155CC] transition-colors mb-2.5 line-clamp-2">
                          {post.title}
                        </h4>
                      </Link>
                      <p className="text-xs font-semibold text-slate-500 leading-relaxed line-clamp-3">
                        {post.excerpt}
                      </p>
                    </div>
                  </div>

                  {/* Card bottom meta */}
                  <div className="p-6 pt-0">
                    <div className="flex items-center justify-between border-t border-slate-50/50 pt-4 mt-2">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2 overflow-hidden">
                          {post.authors.map((auth, index) => (
                            <div 
                              key={auth.name}
                              className="w-8 h-8 rounded-full bg-[#1155CC]/5 text-[#1155CC] border border-white font-bold text-[10px] flex items-center justify-center relative shadow-sm"
                              style={{ zIndex: 10 - index }}
                            >
                              {auth.avatar}
                            </div>
                          ))}
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-800 block leading-tight">
                            {post.authors.map((a) => a.name).join(" & ")}
                          </span>
                          <span className="text-[9px] font-medium text-slate-400 block mt-0.5 leading-none">
                            {post.authors.map((a) => a.role).join(" / ")}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-slate-400 block mb-0.5">{post.date}</span>
                        <span className="text-[9px] font-semibold text-[#1155CC]">{post.readTime}</span>
                      </div>
                    </div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>

          {/* Empty fallback state */}
          {filteredPosts.length === 0 && (
            <div className="text-center py-20 bg-white border border-slate-100 rounded-3xl shadow-[0_15px_30px_rgba(17,85,204,0.01)]">
              <Icon name="beaker" className="w-12 h-12 text-[#1155CC]/30 mx-auto mb-4" />
              <h3 className="text-base font-extrabold text-slate-900 mb-1">No articles found</h3>
              <p className="text-xs font-semibold text-slate-400">Check back later or try selecting another category.</p>
            </div>
          )}

        </section>
      </main>
      <SiteFooter />
    </>
  );
}
