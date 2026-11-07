"use client";

import React from "react";
import { m } from "motion/react";

export function BlogHero(): React.JSX.Element {
  return (
    <section className="relative z-10 mx-auto max-w-7xl px-4 pt-10 pb-12 text-center sm:px-6 sm:pt-16 lg:px-8">
      <m.span
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-4 inline-block rounded-full border border-[#1155CC]/10 bg-[#1155CC]/5 px-3 py-1.5 text-[10px] font-black tracking-[0.25em] text-[#1155CC] uppercase"
      >
        Insights & Engineering Culture
      </m.span>
      <m.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="font-sora text-4xl font-black tracking-tight text-slate-900 sm:text-5xl md:text-6xl"
      >
        The TechSonance{" "}
        <span className="bg-linear-to-r from-[#1155CC] to-[#22B6F6] bg-clip-text text-transparent">
          Blog
        </span>
      </m.h1>
      <m.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mx-auto mt-4 max-w-2xl text-sm font-semibold text-slate-500 sm:text-base"
      >
        Engineering strategies, design practices, and operational insights from our custom
        software development team.
      </m.p>
    </section>
  );
}
