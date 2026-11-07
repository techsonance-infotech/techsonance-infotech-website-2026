"use client";

import React from "react";
import Link from "next/link";
import { m } from "motion/react";
import { Icon } from "@/app/components/icons/Icon";
import type { BlogPost } from "@/lib/content/types";

interface BlogCardProps {
  post: BlogPost;
}

export function BlogCard({ post }: BlogCardProps): React.JSX.Element {
  const authors =
    Array.isArray(post.authors) && post.authors.length > 0
      ? post.authors
      : [{ name: "TechSonance Team", role: "Engineering", avatar: "TS" }];

  return (
    <m.article
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
      className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_12px_30px_rgba(17,85,204,0.01)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(17,85,204,0.04)]"
    >
      <div>
        {/* Card Image area */}
        <div className="relative flex h-48 items-center justify-center overflow-hidden border-b border-slate-50 bg-linear-to-br from-[#1155CC]/5 to-[#22B6F6]/5">
          <div className="absolute inset-0 bg-linear-to-tr from-[#1155CC]/10 via-transparent to-[#22B6F6]/10 opacity-30 transition-all duration-500 group-hover:scale-105" />
          <Icon
            name="monitor"
            className="h-12 w-12 text-[#1155CC]/25 transition-all duration-500 group-hover:scale-110"
          />
          <span className="absolute top-4 left-4 rounded-lg border border-slate-100 bg-white/90 px-2.5 py-1 text-[9px] font-black tracking-wider text-[#1155CC] uppercase backdrop-blur-sm">
            {post.category || "Software Engineering"}
          </span>
        </div>

        {/* Card details */}
        <div className="p-6">
          <Link href={`/blog/${post.slug || "post"}`}>
            <h4 className="mb-2.5 line-clamp-2 font-sora text-base leading-snug font-medium text-slate-900 transition-colors hover:text-[#1155CC] sm:text-lg">
              {post.title || "Untitled Article"}
            </h4>
          </Link>
          <p className="line-clamp-3 text-xs leading-relaxed font-semibold text-slate-500">
            {post.excerpt || "Read our technical analysis and architectural breakdown."}
          </p>
        </div>
      </div>

      {/* Card bottom meta */}
      <div className="p-6 pt-0">
        <div className="mt-2 flex items-center justify-between border-t border-slate-50/50 pt-4">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2 overflow-hidden">
              {authors.map((auth, index) => (
                <div
                  key={auth.name || String(index)}
                  className="relative flex h-8 w-8 items-center justify-center rounded-full border border-white bg-[#1155CC]/5 text-[10px] font-bold text-[#1155CC] shadow-sm"
                  style={{ zIndex: 10 - index }}
                >
                  {auth.avatar || "TS"}
                </div>
              ))}
            </div>
            <div>
              <span className="block text-[10px] leading-tight font-bold text-slate-800">
                {authors.map((a) => a.name || "TechSonance Team").join(" & ")}
              </span>
              <span className="mt-0.5 block text-[9px] leading-none font-medium text-slate-400">
                {authors.map((a) => a.role || "Engineering").join(" / ")}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="mb-0.5 block text-[9px] font-bold text-slate-400">
              {post.date || ""}
            </span>
            <span className="text-[9px] font-semibold text-[#1155CC]">
              {post.readTime || "5 min read"}
            </span>
          </div>
        </div>
      </div>
    </m.article>
  );
}
