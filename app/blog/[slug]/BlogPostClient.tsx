"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { LazyMotion, domAnimation, m, useScroll, useSpring } from "motion/react";
import SiteHeader from "@/app/components/home/SiteHeader";
import SiteFooter from "@/app/components/home/SiteFooter";
import { Icon } from "@/app/components/icons/Icon";
import type { BlogPost } from "@/lib/content/types";
import { trackBlogPostView } from "@/lib/analytics";

interface BlogPostClientProps {
  post: BlogPost;
  relatedPosts: BlogPost[];
}

export default function BlogPostClient({ post, relatedPosts }: BlogPostClientProps) {
  useEffect(() => {
    if (post?.slug) {
      trackBlogPostView(post.slug, post.title || "Post", post.category || "General");
    }
  }, [post?.slug, post?.title, post?.category]);

  // Scroll Progress Hook
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const authors =
    Array.isArray(post.authors) && post.authors.length > 0
      ? post.authors
      : [{ name: "TechSonance Team", role: "Engineering", avatar: "TS" }];

  const tags = Array.isArray(post.tags) ? post.tags : [];
  const safeRelatedPosts = Array.isArray(relatedPosts) ? relatedPosts.filter(Boolean) : [];

  return (
    <LazyMotion features={domAnimation} strict>
      <SiteHeader transparent={true} />

      {/* Sticky Top Progress Bar */}
      <m.div
        className="fixed top-0 right-0 left-0 z-[60] h-[3px] origin-left bg-linear-to-r from-[#1155CC] to-[#22B6F6]"
        style={{ scaleX }}
      />

      <main className="relative min-h-screen overflow-hidden bg-[#FAFBFD] pt-24 pb-20">
        {/* Custom Unique Background: Resonance Waves */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 left-0 h-[600px] bg-gradient-to-tr from-[#FAFBFD] via-[#EEF5FF] to-[#F5F9FF] opacity-90" />
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `
                linear-gradient(45deg, #1155cc 0.5px, transparent 0.5px), 
                linear-gradient(-45deg, #1155cc 0.5px, transparent 0.5px)
              `,
              backgroundSize: "60px 60px",
            }}
          />
          <div className="absolute top-20 left-[10%] h-[350px] w-[350px] rounded-full bg-[#1155CC]/3 blur-[80px]" />
          <div className="absolute top-40 right-[15%] h-[400px] w-[400px] rounded-full bg-[#22B6F6]/3 blur-[100px]" />
        </div>

        {/* Hero Section */}
        <section className="relative z-10 border-b border-slate-100/80 py-16 sm:py-24">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            {/* Back Button */}
            <Link
              href="/blog"
              className="group mb-6 inline-flex items-center gap-2 text-xs font-bold text-slate-400 transition-colors hover:text-[#1155CC]"
            >
              <Icon
                name="arrow"
                className="h-4 w-4 rotate-180 transition-transform group-hover:-translate-x-0.5"
              />
              Back to Blog
            </Link>

            <span className="mb-3 block text-[10px] font-black tracking-wider text-[#1155CC] uppercase">
              {post.category || "Software Engineering"}
            </span>

            <h1 className="mb-6 font-sora text-3xl leading-tight font-black tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
              {post.title || "Untitled Article"}
            </h1>

            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-slate-400">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2 overflow-hidden">
                  {authors.map((auth, index) => (
                    <div
                      key={auth.name || String(index)}
                      className="relative flex h-8 w-8 items-center justify-center rounded-full border border-white bg-[#1155CC] text-xs font-bold text-white shadow-inner"
                      style={{ zIndex: 10 - index }}
                    >
                      {auth.avatar || "TS"}
                    </div>
                  ))}
                </div>
                <span className="text-slate-700">
                  {authors.map((a) => a.name || "TechSonance Team").join(" & ")}
                </span>
              </div>
              <span>&bull;</span>
              <span>{post.date || ""}</span>
              <span>&bull;</span>
              <span className="rounded-full bg-[#1155CC]/5 px-2.5 py-0.5 text-[#1155CC]">
                {post.readTime || "5 min read"}
              </span>
            </div>
          </div>
        </section>

        {/* Main Content Layout */}
        <section className="relative z-10 mx-auto mt-12 max-w-7xl px-4 sm:mt-16 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
            {/* Sticky Share Sidebar (Desktop Only) */}
            <div className="sticky top-28 hidden space-y-6 lg:col-span-3 lg:block">
              <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_15px_30px_rgba(17,85,204,0.02)]">
                <span className="mb-4 block border-b border-slate-50 pb-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  AUTHOR
                </span>
                {authors.map((auth, idx) => (
                  <div
                    key={auth.name || String(idx)}
                    className="mb-4 flex items-center gap-3 border-b border-slate-50 pb-3 last:mb-0 last:border-b-0 last:pb-0"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 font-bold text-[#1155CC]">
                      {auth.avatar || "TS"}
                    </div>
                    <div>
                      <h4 className="mb-0.5 text-xs leading-tight font-black text-slate-800">
                        {auth.name || "TechSonance Team"}
                      </h4>
                      <p className="text-[10px] font-semibold text-slate-400">
                        {auth.role || "Engineering"}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="text-[11px] leading-relaxed font-medium text-slate-500">
                  Shares development tips and enterprise architectural principles at TechSonance.
                </div>
              </div>

              {tags.length > 0 && (
                <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_15px_30px_rgba(17,85,204,0.02)]">
                  <span className="mb-4 block border-b border-slate-50 pb-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    TAGS
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1 text-[9px] font-bold text-slate-500"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Post Content */}
            <div className="col-span-1 rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_15px_35px_rgba(17,85,204,0.02)] sm:p-10 lg:col-span-9">
              {/* Main Content Render */}
              <div
                className="max-w-none leading-relaxed text-slate-700 [&>a]:text-[#1155CC] [&>a]:hover:underline [&>h1]:font-sora [&>h1]:font-medium [&>h2]:font-sora [&>h2]:font-medium [&>h3]:font-sora [&>h3]:font-medium [&>p]:leading-relaxed [&>p]:text-slate-600"
                dangerouslySetInnerHTML={{ __html: post.content || "" }}
              />

              {/* FAQ Section (AEO & FAQPage Schema Alignment) */}
              {Array.isArray(post.faqs) && post.faqs.length > 0 && (
                <div className="mt-12 border-t border-slate-100 pt-8">
                  <div className="mb-6 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#1155CC]" />
                    <h3 className="font-sora text-xl font-medium text-slate-900">
                      Frequently Asked Questions
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {post.faqs.map((faq, idx) => (
                      <div
                        key={faq.question || String(idx)}
                        className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5 transition-colors hover:border-slate-200"
                      >
                        <h4 className="mb-2 flex items-start gap-2 font-sora text-sm font-bold text-slate-900 sm:text-base">
                          <span className="shrink-0 font-mono text-[#1155CC]">Q{idx + 1}.</span>
                          <span>{faq.question}</span>
                        </h4>
                        <p className="pl-6 text-xs leading-relaxed text-slate-600 sm:text-sm">
                          {faq.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tag section (Mobile Only) */}
              {tags.length > 0 && (
                <div className="mt-8 flex flex-wrap gap-1.5 border-t border-slate-50 pt-6 lg:hidden">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1 text-[9px] font-bold text-slate-500"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Related Posts Section */}
        {safeRelatedPosts.length > 0 && (
          <section className="relative z-10 mx-auto mt-20 max-w-7xl border-t border-slate-100 px-4 pt-16 sm:px-6 lg:px-8">
            <h3 className="mb-8 text-center font-sora text-lg font-medium text-slate-900 sm:text-left">
              Keep Reading
            </h3>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {safeRelatedPosts.map((rPost, idx) => (
                <div
                  key={rPost.slug || String(idx)}
                  className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_10px_25px_rgba(17,85,204,0.01)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(17,85,204,0.03)]"
                >
                  <div className="p-6">
                    <span className="mb-2 block text-[9px] font-black tracking-wider text-[#1155CC] uppercase">
                      {rPost.category || "Software Engineering"}
                    </span>
                    <Link href={`/blog/${rPost.slug || "post"}`}>
                      <h4 className="mb-2.5 line-clamp-2 font-sora text-base font-medium text-slate-900 transition-colors hover:text-[#1155CC] sm:text-lg">
                        {rPost.title || "Untitled Article"}
                      </h4>
                    </Link>
                    <p className="line-clamp-2 text-xs leading-relaxed font-semibold text-slate-500">
                      {rPost.excerpt || ""}
                    </p>
                  </div>
                  <div className="flex items-center justify-between p-6 pt-0">
                    <span className="text-[10px] font-bold text-slate-400">{rPost.date || ""}</span>
                    <Link
                      href={`/blog/${rPost.slug || "post"}`}
                      className="group/link flex items-center gap-1 text-xs font-bold text-[#1155CC] hover:underline"
                    >
                      Read Article
                      <Icon
                        name="arrow"
                        className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-0.5"
                      />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </LazyMotion>
  );
}
