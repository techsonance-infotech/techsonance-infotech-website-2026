"use client";

import React from "react";
import Link from "next/link";
import { m } from "motion/react";
import { Icon } from "@/app/components/icons/Icon";
import type { BlogPost } from "@/lib/content/types";

interface BlogFeaturedCardProps {
  post: BlogPost;
}

export function BlogFeaturedCard({ post }: BlogFeaturedCardProps): React.JSX.Element {
  return (
    <m.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="group mb-16 grid grid-cols-1 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_15px_45px_rgba(17,85,204,0.02)] transition-all duration-300 hover:shadow-[0_25px_60px_rgba(17,85,204,0.05)] lg:grid-cols-12"
    >
      {/* Image box */}
      <div className="relative flex h-64 min-h-[280px] items-center justify-center overflow-hidden border-b border-slate-100 bg-linear-to-br from-[#1155CC]/10 to-[#22B6F6]/10 sm:h-80 lg:col-span-6 lg:h-full lg:border-r lg:border-b-0">
        <div className="absolute inset-0 bg-linear-to-tr from-[#1155CC]/20 via-transparent to-[#22B6F6]/20 opacity-50 transition-all duration-500 group-hover:scale-105" />
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
            {post.category}
          </span>
          <Link href={`/blog/${post.slug}`}>
            <h3 className="mb-4 font-sora text-xl leading-tight font-medium text-slate-900 transition-colors hover:text-[#1155CC] sm:text-2xl">
              {post.title}
            </h3>
          </Link>
          <p className="mb-6 text-xs leading-relaxed font-medium text-slate-500 sm:text-sm">
            {post.excerpt}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-4">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2.5 overflow-hidden">
              {post.authors.map((auth, index) => (
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
                {post.authors.map((a) => a.name).join(" & ")}
              </span>
              <span className="block text-[10px] leading-none font-medium text-slate-400">
                {post.authors.map((a) => a.role).join(" / ")}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="mb-1 block text-[10px] leading-none font-bold text-slate-400">
              {post.date}
            </span>
            <span className="rounded-full bg-[#1155CC]/5 px-2 py-0.5 text-[10px] font-semibold text-[#1155CC]">
              {post.readTime}
            </span>
          </div>
        </div>
      </div>
    </m.div>
  );
}
