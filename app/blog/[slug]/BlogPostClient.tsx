"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { LazyMotion, domAnimation, m, useScroll, useSpring } from "motion/react";
import SiteHeader from "@/app/components/home/SiteHeader";
import SiteFooter from "@/app/components/home/SiteFooter";
import { Icon } from "@/app/components/icons/Icon";
import type { BlogPost } from "@/lib/content/types";
import { trackBlogPostView } from "@/lib/analytics";

interface TocItem {
  id: string;
  text: string;
  depth: number;
}

interface BlogPostClientProps {
  post: BlogPost;
  relatedPosts: BlogPost[];
  tocItems?: TocItem[];
}

export default function BlogPostClient({ post, relatedPosts, tocItems = [] }: BlogPostClientProps) {
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

  // Clipboard copy handler for code blocks and diagrams
  useEffect(() => {
    const handleCopyClick = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement)?.closest(".copy-code-btn");
      if (!btn) return;

      const codeAttr = btn.getAttribute("data-code");
      if (!codeAttr) return;

      const code = decodeURIComponent(codeAttr);
      navigator.clipboard
        .writeText(code)
        .then(() => {
          const copyText = btn.querySelector(".copy-text");
          if (copyText) {
            const original = copyText.textContent;
            copyText.textContent = "Copied!";
            btn.classList.add("bg-emerald-600", "text-white", "border-emerald-500");
            setTimeout(() => {
              copyText.textContent = original;
              btn.classList.remove("bg-emerald-600", "text-white", "border-emerald-500");
            }, 2000);
          }
        })
        .catch(() => {});
    };

    document.addEventListener("click", handleCopyClick);
    return () => document.removeEventListener("click", handleCopyClick);
  }, []);

  // Diagram Engine Tab Switcher (Nomnoml vs Mermaid parallel view)
  useEffect(() => {
    const handleTabClick = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement)?.closest(".diagram-engine-tabs button");
      if (!btn) return;

      const card = btn.closest(".mermaid-diagram-card");
      if (!card) return;

      const mode = btn.getAttribute("data-mode");
      const nomnomlView = card.querySelector(".nomnoml-diagram-view");
      const mermaidView = card.querySelector(".mermaid-diagram-view");
      const nomnomlBtn = card.querySelector(".tab-nomnoml-btn");
      const mermaidBtn = card.querySelector(".tab-mermaid-btn");

      if (mode === "nomnoml") {
        nomnomlView?.classList.remove("hidden");
        mermaidView?.classList.add("hidden");
        nomnomlBtn?.classList.add("bg-[#1155CC]", "text-white", "shadow-xs");
        nomnomlBtn?.classList.remove("text-slate-500");
        mermaidBtn?.classList.remove("bg-[#1155CC]", "text-white", "shadow-xs");
        mermaidBtn?.classList.add("text-slate-500");
      } else if (mode === "mermaid") {
        nomnomlView?.classList.add("hidden");
        mermaidView?.classList.remove("hidden");
        mermaidBtn?.classList.add("bg-[#1155CC]", "text-white", "shadow-xs");
        mermaidBtn?.classList.remove("text-slate-500");
        nomnomlBtn?.classList.remove("bg-[#1155CC]", "text-white", "shadow-xs");
        nomnomlBtn?.classList.add("text-slate-500");
      }
    };

    document.addEventListener("click", handleTabClick);
    return () => document.removeEventListener("click", handleTabClick);
  }, []);

  // Dynamic Mermaid Diagram Renderer (runs in parallel for the Mermaid tab)
  useEffect(() => {
    let isMounted = true;

    async function renderMermaidDiagrams() {
      const mermaidContainers = document.querySelectorAll<HTMLElement>(
        ".mermaid-diagram[data-mermaid]",
      );
      if (mermaidContainers.length === 0) return;

      try {
        const mermaidModule = await import("mermaid");
        const mermaid = mermaidModule.default || mermaidModule;

        if (typeof document !== "undefined" && "fonts" in document) {
          try {
            await document.fonts.ready;
          } catch {}
        }

        mermaid.initialize({
          startOnLoad: false,
          theme: "base",
          flowchart: {
            htmlLabels: true,
            curve: "basis",
            nodeSpacing: 45,
            rankSpacing: 55,
            padding: 15,
            useMaxWidth: true,
          },
          themeVariables: {
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            fontSize: "13px",
            primaryColor: "#EEF5FF",
            primaryBorderColor: "#1155CC",
            primaryTextColor: "#0F172A",
            lineColor: "#1155CC",
            secondaryColor: "#F8FAFC",
            tertiaryColor: "#FFFFFF",
            mainBkg: "#F8FAFC",
            nodeBorder: "#1155CC",
            clusterBkg: "#F1F5F9",
            clusterBorder: "#CBD5E1",
            defaultLinkColor: "#1155CC",
            edgeLabelBackground: "#FFFFFF",
          },
          securityLevel: "loose",
          suppressErrorRendering: true,
        });

        for (let i = 0; i < mermaidContainers.length; i++) {
          if (!isMounted) break;
          const container = mermaidContainers[i];
          if (container.getAttribute("data-rendered") === "true") continue;

          const rawCode = container.getAttribute("data-mermaid");
          if (!rawCode) continue;

          const code = decodeURIComponent(rawCode).trim();
          const id = `mermaid-chart-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`;

          try {
            const { svg } = await mermaid.render(id, code);
            if (isMounted) {
              container.innerHTML = svg;
              container.setAttribute("data-rendered", "true");
              const svgEl = container.querySelector("svg");
              if (svgEl) {
                svgEl.classList.add("mx-auto", "max-w-full", "h-auto");
                svgEl.style.maxWidth = "100%";
                svgEl.style.height = "auto";
              }
            }
          } catch {
            if (isMounted) {
              // Parse node transitions into a sleek visual architecture flow
              const lines = code.split("\n");
              const steps: { from: string; to: string; label?: string }[] = [];

              for (const line of lines) {
                const trimmed = line.trim();
                if (
                  !trimmed ||
                  trimmed.startsWith("flowchart") ||
                  trimmed.startsWith("graph") ||
                  trimmed.startsWith("style ")
                )
                  continue;

                const match = trimmed.match(/^(.+?)\s*-->\s*(?:\|([^|]+)\|\s*)?(.+)$/);
                if (match) {
                  const cleanNode = (n: string) =>
                    n
                      .replace(/^[A-Za-z0-9_]+\s*\["?(.*?)"?\]$/, "$1")
                      .replace(/[[\]"']/g, "")
                      .trim();
                  steps.push({
                    from: cleanNode(match[1]),
                    to: cleanNode(match[3]),
                    label: match[2]?.trim(),
                  });
                }
              }

              if (steps.length > 0) {
                const stepsHtml = steps
                  .map(
                    (step, idx) => `
                      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-blue-300 transition-colors shadow-2xs">
                        <div class="flex items-center gap-3">
                          <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-[#1155CC]">${idx + 1}</span>
                          <span class="text-xs font-bold text-slate-800">${step.from}</span>
                        </div>
                        <div class="flex items-center gap-2 px-2">
                          ${step.label ? `<span class="rounded-md bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-200 shadow-2xs">${step.label}</span>` : ""}
                          <svg class="h-4 w-4 text-[#1155CC] shrink-0 rotate-90 sm:rotate-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </div>
                        <div class="text-xs font-bold text-[#1155CC] bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">${step.to}</div>
                      </div>
                    `,
                  )
                  .join("");

                container.innerHTML = `
                    <div class="w-full space-y-2 py-2">
                      ${stepsHtml}
                    </div>
                  `;
              } else {
                container.innerHTML = `
                    <div class="w-full text-left font-mono text-xs text-slate-700 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
                      <pre class="overflow-x-auto whitespace-pre p-3 bg-white rounded-lg border border-slate-200/80 text-slate-700 text-[12px] leading-relaxed">${code}</pre>
                    </div>
                  `;
              }
              container.setAttribute("data-rendered", "true");
            }
          }
        }
      } catch {
        // Fallback if mermaid module cannot be loaded
      }
    }

    void renderMermaidDiagrams();

    return () => {
      isMounted = false;
    };
  }, [post.content]);

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

            <h1 className="mb-6 font-sora text-[clamp(1.85rem,1.4rem+1.8vw,3.25rem)] leading-[1.18] font-black tracking-tight text-slate-900">
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
        <section className="relative z-10 mx-auto mt-10 w-full max-w-7xl px-4 sm:mt-14 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 xl:gap-12">
            {/* Sticky Share Sidebar (Desktop Only) */}
            <div className="sticky top-28 hidden min-w-0 space-y-6 lg:col-span-4 lg:block xl:col-span-3">
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

              {/* Table of Contents (Sticky Navigation) */}
              {tocItems.length > 0 && (
                <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_15px_30px_rgba(17,85,204,0.02)]">
                  <span className="mb-4 flex items-center gap-2 border-b border-slate-50 pb-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#1155CC]"></span>
                    ON THIS PAGE
                  </span>
                  <nav className="max-h-[320px] space-y-2.5 overflow-y-auto pr-1 text-xs">
                    {tocItems.map((item, idx) => (
                      <a
                        key={`${item.id}-${idx}`}
                        href={`#${item.id}`}
                        className={`block transition-colors hover:text-[#1155CC] ${
                          item.depth === 2
                            ? "font-bold text-slate-700"
                            : "pl-3 text-[11px] font-medium text-slate-500 hover:text-[#1155CC]"
                        }`}
                      >
                        {item.text}
                      </a>
                    ))}
                  </nav>
                </div>
              )}

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

            {/* Post Content — Responsive Fluid Constraints (max-w-3xl / max-w-prose centered) */}
            <div className="col-span-1 min-w-0 rounded-3xl border border-slate-100/90 bg-white p-6 shadow-[0_15px_35px_rgba(17,85,204,0.02)] sm:p-10 lg:col-span-8 xl:col-span-9">
              {/* Hero Featured Image with Responsive Containment */}
              {post.heroImage && (
                <div className="relative mb-10 w-full max-w-full overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 shadow-sm">
                  <img
                    src={post.heroImage}
                    alt={post.title || "Article Banner"}
                    className="aspect-video h-auto w-full max-w-full object-cover"
                  />
                </div>
              )}

              {/* Main Content Render with Fluid Typography & Spacing */}
              <div
                className="article-content mx-auto w-full min-w-0 max-w-3xl text-base leading-relaxed text-slate-700
                  [&_a]:font-semibold [&_a]:text-[#1155CC] [&_a]:underline [&_a:hover]:text-[#0d419d]
                  [&_figure]:my-8 [&_figure]:w-full [&_figure]:max-w-full
                  [&_img]:my-8 [&_img]:h-auto [&_img]:w-full [&_img]:max-w-full [&_img]:rounded-2xl [&_img]:border [&_img]:border-slate-100 [&_img]:object-cover [&_img]:shadow-md
                  [&_li]:leading-relaxed
                  [&_ol]:mb-6 [&_ol]:list-decimal [&_ol]:space-y-3 [&_ol]:pl-6 [&_ol]:text-slate-600
                  [&_p]:mb-6 [&_p]:text-[clamp(0.975rem,0.925rem+0.25vw,1.075rem)] [&_p]:leading-[1.75] [&_p]:text-slate-600 [&_p]:break-words
                  [&_pre]:w-full [&_pre]:max-w-full [&_pre]:overflow-x-auto
                  [&_strong]:font-bold [&_strong]:text-slate-900
                  [&_sub]:align-sub [&_sub]:text-[0.72em] [&_sub]:font-semibold [&_sub]:text-slate-800
                  [&_sup]:align-super [&_sup]:text-[0.72em] [&_sup]:font-semibold [&_sup]:text-slate-800
                  [&_table]:w-full [&_table]:max-w-full
                  [&_ul]:mb-6 [&_ul]:list-disc [&_ul]:space-y-3 [&_ul]:pl-6 [&_ul]:text-slate-600"
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
                <Link
                  key={rPost.slug || String(idx)}
                  href={`/blog/${rPost.slug || "post"}`}
                  aria-label={`Read article: ${rPost.title || "article"}`}
                  className="group flex cursor-pointer flex-col justify-between overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_10px_25px_rgba(17,85,204,0.01)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(17,85,204,0.03)]"
                >
                  <div className="p-6">
                    <span className="mb-2 block text-[9px] font-black tracking-wider text-[#1155CC] uppercase">
                      {rPost.category || "Software Engineering"}
                    </span>
                    <h4 className="mb-2.5 line-clamp-2 font-sora text-base font-medium text-slate-900 transition-colors group-hover:text-[#1155CC] sm:text-lg">
                      {rPost.title || "Untitled Article"}
                    </h4>
                    <p className="line-clamp-2 text-xs leading-relaxed font-semibold text-slate-500">
                      {rPost.excerpt || ""}
                    </p>
                  </div>
                  <div className="flex items-center justify-between p-6 pt-0">
                    <span className="text-[10px] font-bold text-slate-400">{rPost.date || ""}</span>
                    <span className="flex items-center gap-1 text-xs font-bold text-[#1155CC] group-hover:underline">
                      Read Article
                      <Icon
                        name="arrow"
                        className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
                      />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </LazyMotion>
  );
}
