"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { m, useScroll, useTransform, useSpring } from "motion/react";
import { projects } from "@/data/projects";

export function AboutProjectsShowcase() {
  const horizontalSectionRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollRange, setScrollRange] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const { scrollYProgress: horizontalScroll } = useScroll({
    target: horizontalSectionRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    const updateRange = () => {
      setIsMobile(window.innerWidth < 768);
      if (scrollRef.current) {
        const range = scrollRef.current.scrollWidth - window.innerWidth;
        setScrollRange(range > 0 ? range : 0);
      }
    };

    updateRange();

    const observer = new ResizeObserver(updateRange);
    if (scrollRef.current) observer.observe(scrollRef.current);
    window.addEventListener("resize", updateRange);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateRange);
    };
  }, []);

  const rawX = useTransform(horizontalScroll, [0, 1], [0, -scrollRange]);
  const horizontalX = useSpring(rawX, { stiffness: 100, damping: 20, mass: 0.2 });

  const scrollPortfolio = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const card = container.firstElementChild;
    if (card) {
      const cardWidth = card.getBoundingClientRect().width;
      const gap = 24;
      container.scrollBy({
        left: direction === "left" ? -(cardWidth + gap) : cardWidth + gap,
        behavior: "smooth",
      });
    }
  };

  return (
    <section
      ref={horizontalSectionRef}
      className={
        isMobile
          ? "relative bg-[#020617] py-16 text-white"
          : "relative h-[250vh] bg-[#020617] text-white"
      }
    >
      <div
        className={
          isMobile
            ? "flex w-full flex-col justify-center"
            : "sticky top-0 flex h-screen flex-col justify-center overflow-hidden"
        }
      >
        <div className="relative z-20 mx-auto mb-8 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-2 text-xs font-bold tracking-widest text-[#22B6F6] uppercase">
            Portfolio Showcase
          </h2>
          <h3 className="text-3xl font-medium tracking-tight text-white sm:text-4xl">
            What We&apos;ve Built
          </h3>
          <p className="mt-1 text-xs font-medium text-slate-400 sm:text-sm">
            Production-grade systems running live for scaling organizations.
          </p>
        </div>

        <m.div
          ref={scrollRef}
          style={isMobile ? undefined : { x: horizontalX }}
          className={
            isMobile
              ? "relative z-10 flex w-full snap-x snap-mandatory scrollbar-none flex-row gap-6 overflow-x-auto px-6 pb-4"
              : "relative z-10 flex w-max gap-8 px-12 md:px-24"
          }
        >
          {projects.map((proj) => (
            <div
              key={proj.title}
              className={
                isMobile
                  ? "flex w-[85vw] max-w-[340px] shrink-0 snap-center flex-col justify-between rounded-3xl border border-slate-800 bg-slate-900/50 p-6"
                  : "flex w-[80vw] max-w-[550px] shrink-0 flex-col justify-between rounded-3xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8"
              }
            >
              <div>
                <div
                  className="group relative mb-6 aspect-[16/10] w-full overflow-hidden rounded-2xl border border-slate-800"
                  style={{ background: proj.screenshotPath ? undefined : proj.mockupGradient }}
                >
                  {proj.screenshotPath ? (
                    <Image
                      src={proj.screenshotPath}
                      alt={proj.title}
                      fill
                      sizes="(max-width: 768px) 85vw, 550px"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-white">
                      {proj.title.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="mb-3 flex items-start justify-between gap-4">
                  <h4 className="text-xl font-bold text-white">{proj.title}</h4>
                  <span className="rounded-full bg-[#22B6F6]/10 px-2.5 py-1 text-[10px] font-bold tracking-wider text-[#22B6F6] uppercase">
                    {proj.industry}
                  </span>
                </div>
                <p className="mb-4 text-xs leading-relaxed font-medium text-slate-400">
                  {proj.shortDescription}
                </p>
              </div>

              <div className="mt-auto border-t border-slate-800/80 pt-4">
                <div className="mb-3 flex flex-wrap gap-2">
                  {proj.techStack.slice(0, 3).map((t) => (
                    <span
                      key={t.name}
                      className="rounded bg-slate-950 px-2 py-1 font-mono text-[10px] text-slate-500"
                    >
                      {t.name}
                    </span>
                  ))}
                </div>
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-[#10B981]">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#10B981]" />
                  Outcome: {proj.result}
                </p>
              </div>
            </div>
          ))}
        </m.div>

        {/* Mobile Navigation Arrows */}
        {isMobile && (
          <div className="relative z-20 mt-6 flex justify-center gap-4">
            <button
              onClick={() => scrollPortfolio("left")}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-white/5 text-white transition-all hover:bg-white/10 active:scale-95"
              aria-label="Previous Project"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => scrollPortfolio("right")}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-white/5 text-white transition-all hover:bg-white/10 active:scale-95"
              aria-label="Next Project"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
