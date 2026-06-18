"use client";

import React, { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { motion, useScroll, useSpring } from "framer-motion";
import SiteHeader from "@/app/components/home/SiteHeader";
import SiteFooter from "@/app/components/home/SiteFooter";
import { Icon } from "@/app/components/icons/Icon";
import { blogPosts, getPostBySlug } from "@/data/blog";

interface BlogDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default function BlogDetailPage({ params }: BlogDetailPageProps) {
  // Resolve params using React.use()
  const resolvedParams = use(params);
  const post = getPostBySlug(resolvedParams.slug);

  if (!post) {
    notFound();
  }

  // Scroll Progress Hook
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Get related posts (exclude current)
  const relatedPosts = blogPosts
    .filter((p) => p.slug !== post.slug)
    .slice(0, 2);

  return (
    <>
      <SiteHeader />
      
      {/* Sticky Top Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#1155CC] to-[#22B6F6] z-[60] origin-left"
        style={{ scaleX }}
      />

      <main className="bg-[#FAFBFD] min-h-screen pt-24 pb-20 relative overflow-hidden">
        {/* Custom Unique Background: Resonance Waves */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-tr from-[#FAFBFD] via-[#EEF5FF] to-[#F5F9FF] opacity-90" />
          <div 
            className="absolute inset-0 opacity-[0.02]" 
            style={{ 
              backgroundImage: `
                linear-gradient(45deg, #1155cc 0.5px, transparent 0.5px), 
                linear-gradient(-45deg, #1155cc 0.5px, transparent 0.5px)
              `, 
              backgroundSize: "60px 60px" 
            }} 
          />
          <div className="absolute top-20 left-[10%] w-[350px] h-[350px] bg-[#1155CC]/3 rounded-full blur-[80px]" />
          <div className="absolute top-40 right-[15%] w-[400px] h-[400px] bg-[#22B6F6]/3 rounded-full blur-[100px]" />
        </div>

        {/* Hero Section */}
        <section className="relative py-16 sm:py-24 border-b border-slate-100/80 z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            
            {/* Back Button */}
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-[#1155CC] transition-colors mb-6 group"
            >
              <Icon name="arrow" className="w-4 h-4 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
              Back to Blog
            </Link>

            <span className="text-[10px] font-black text-[#1155CC] uppercase tracking-wider block mb-3">
              {post.category}
            </span>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-sora text-slate-900 leading-tight tracking-tight mb-6">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-slate-400">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2 overflow-hidden">
                  {post.authors.map((auth, index) => (
                    <div
                      key={auth.name}
                      className="w-8 h-8 rounded-full bg-[#1155CC] text-white border border-white flex items-center justify-center font-bold text-xs shadow-inner relative"
                      style={{ zIndex: 10 - index }}
                    >
                      {auth.avatar}
                    </div>
                  ))}
                </div>
                <span className="text-slate-700">{post.authors.map((a) => a.name).join(" & ")}</span>
              </div>
              <span>&bull;</span>
              <span>{post.date}</span>
              <span>&bull;</span>
              <span className="text-[#1155CC] bg-[#1155CC]/5 px-2.5 py-0.5 rounded-full">{post.readTime}</span>
            </div>
          </div>
        </section>

        {/* Main Content Layout */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 sm:mt-16 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Sticky Share Sidebar (Desktop Only) */}
            <div className="hidden lg:block lg:col-span-3 sticky top-28 space-y-6">
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_15px_30px_rgba(17,85,204,0.02)]">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4 pb-2 border-b border-slate-50">
                  AUTHOR
                </span>
                {post.authors.map((auth) => (
                  <div key={auth.name} className="flex items-center gap-3 mb-4 last:mb-0 border-b border-slate-50 last:border-b-0 pb-3 last:pb-0">
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 text-[#1155CC] font-bold flex items-center justify-center shrink-0">
                      {auth.avatar}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-800 leading-tight mb-0.5">{auth.name}</h4>
                      <p className="text-[10px] font-semibold text-slate-400">{auth.role}</p>
                    </div>
                  </div>
                ))}
                <div className="text-[11px] font-medium text-slate-500 leading-relaxed">
                  Shares development tips and enterprise architectural principles at TechSonance.
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_15px_30px_rgba(17,85,204,0.02)]">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4 pb-2 border-b border-slate-50">
                  TAGS
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[9px] font-bold text-slate-500 bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Post Content */}
            <div className="col-span-1 lg:col-span-9 bg-white border border-slate-100 rounded-3xl p-6 sm:p-10 shadow-[0_15px_35px_rgba(17,85,204,0.02)]">
              
              {/* Main Content Render */}
              <div 
                className="prose prose-slate max-w-none prose-headings:font-sora prose-headings:font-extrabold prose-p:text-slate-600 prose-p:leading-relaxed prose-a:text-[#1155CC] hover:prose-a:underline"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Tag section (Mobile Only) */}
              <div className="flex flex-wrap gap-1.5 mt-8 pt-6 border-t border-slate-50 lg:hidden">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[9px] font-bold text-slate-500 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* Related Posts Section */}
        {relatedPosts.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 pt-16 border-t border-slate-100 relative z-10">
            <h3 className="text-lg font-extrabold text-slate-900 font-sora mb-8 text-center sm:text-left">
              Keep Reading
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {relatedPosts.map((rPost) => (
                <div
                  key={rPost.slug}
                  className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-[0_10px_25px_rgba(17,85,204,0.01)] hover:shadow-[0_20px_45px_rgba(17,85,204,0.03)] hover:-translate-y-0.5 transition-all group duration-300 flex flex-col justify-between"
                >
                  <div className="p-6">
                    <span className="text-[9px] font-black text-[#1155CC] uppercase tracking-wider block mb-2">
                      {rPost.category}
                    </span>
                    <Link href={`/blog/${rPost.slug}`}>
                      <h4 className="text-base sm:text-lg font-extrabold text-slate-900 font-sora hover:text-[#1155CC] transition-colors mb-2.5 line-clamp-2">
                        {rPost.title}
                      </h4>
                    </Link>
                    <p className="text-xs font-semibold text-slate-500 leading-relaxed line-clamp-2">
                      {rPost.excerpt}
                    </p>
                  </div>
                  <div className="p-6 pt-0 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400">{rPost.date}</span>
                    <Link
                      href={`/blog/${rPost.slug}`}
                      className="text-xs font-bold text-[#1155CC] hover:underline flex items-center gap-1 group/link"
                    >
                      Read Article
                      <Icon name="arrow" className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>
      <SiteFooter />
    </>
  );
}
