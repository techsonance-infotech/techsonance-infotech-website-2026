"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { clientStories } from "@/data/testimonials";

function YellowStars() {
  return (
    <div className="flex items-center gap-1 mb-4">
      {[...Array(5)].map((_, i) => (
        <svg
          key={i}
          className="w-4 h-4 shrink-0"
          viewBox="0 0 20 20"
          fill="#F59E0B"
          style={{ fill: "#F59E0B", color: "#F59E0B" }}
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function Testimonials() {
  const horizontalSectionRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollRange, setScrollRange] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Track vertical scroll over the section
  const { scrollYProgress: horizontalScroll } = useScroll({
    target: horizontalSectionRef,
    offset: ["start start", "end end"],
  });

  // Calculate horizontal translation distance
  useEffect(() => {
    const updateRange = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (scrollRef.current) {
        // Measure total overflow width
        const totalWidth = scrollRef.current.scrollWidth;
        const viewportWidth = window.innerWidth;
        const range = totalWidth - viewportWidth + 64; // add generous end padding
        setScrollRange(range > 0 ? range : 0);
      }
    };

    updateRange();

    const ro = new ResizeObserver(updateRange);
    if (scrollRef.current) ro.observe(scrollRef.current);
    window.addEventListener("resize", updateRange);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateRange);
    };
  }, []);

  const rawX = useTransform(horizontalScroll, [0, 1], [0, -scrollRange]);
  const horizontalX = useSpring(rawX, { stiffness: 90, damping: 22, mass: 0.25 });
  const progressBarWidth = useTransform(horizontalScroll, [0, 1], ["15%", "100%"]);

  const scrollStories = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const card = container.firstElementChild as HTMLElement;
    if (card) {
      const cardWidth = card.getBoundingClientRect().width;
      const gap = 24;
      container.scrollBy({
        left: direction === "left" ? -(cardWidth + gap) : (cardWidth + gap),
        behavior: "smooth",
      });
    }
  };

  return (
    <section
      id="testimonials"
      ref={horizontalSectionRef}
      className={isMobile ? "relative py-20 bg-[#FAFBFD] border-t border-slate-100" : "relative h-[250vh] bg-[#FAFBFD] border-t border-slate-100"}
    >
      <div
        className={
          isMobile
            ? "w-full flex flex-col justify-center"
            : "sticky top-0 h-screen flex flex-col justify-center overflow-hidden"
        }
      >
        {/* Section Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mb-8 lg:mb-10 relative z-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#2563EB] uppercase mb-3">
                <span className="w-4 h-[1.5px] bg-[#2563EB] inline-block" />
                <span>CLIENT STORIES</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-serif text-[#0F172A] tracking-tight font-medium leading-[1.2]">
                What it’s like to work with us
              </h2>

              <p className="mt-2 text-base sm:text-lg text-slate-500 font-normal">
                A few words from the people we&apos;ve built with.
              </p>
            </div>

            {/* Subtle Progress Bar & Indicator for desktop */}
            {!isMobile && (
              <div className="hidden md:flex flex-col items-end gap-2 pb-1">
                <div className="w-36 h-1 bg-slate-200/80 rounded-full overflow-hidden">
                  <motion.div
                    style={{ width: progressBarWidth }}
                    className="h-full bg-[#2563EB] rounded-full origin-left"
                  />
                </div>
                <span className="text-[11px] font-medium text-slate-400">
                  Scroll down to explore
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Horizontal Motion Track */}
        <div className="w-full relative">
          <motion.div
            ref={scrollRef}
            style={isMobile ? undefined : { x: horizontalX }}
            className={
              isMobile
                ? "w-full flex flex-row overflow-x-auto gap-6 px-6 pb-6 scrollbar-none snap-x snap-mandatory relative z-10"
                : "w-max flex gap-6 sm:gap-8 pl-4 sm:pl-6 lg:pl-[max(2rem,calc((100vw-80rem)/2+2rem))] pr-24 relative z-10"
            }
          >
            {clientStories.map((story) => (
              <div
                key={story.id}
                className={
                  isMobile
                    ? "w-[85vw] max-w-[340px] snap-center shrink-0 bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 flex flex-col shadow-sm"
                    : "w-[400px] lg:w-[430px] shrink-0 bg-white rounded-2xl border border-slate-200/80 p-7 sm:p-8 flex flex-col shadow-none hover:shadow-md transition-shadow duration-300"
                }
              >
                {/* Project Tag */}
                <div className="mb-4">
                  <span className="inline-block bg-[#EFF6FF] text-[#2563EB] text-xs font-semibold px-2.5 py-1 rounded-md">
                    {story.projectName}
                  </span>
                </div>

                {/* 5 Yellow Stars */}
                <YellowStars />

                {/* Direct, Natural Quote - Equal height across all cards with ellipsis for long text */}
                <div className="h-[108px] sm:h-[104px] overflow-hidden">
                  <p className="text-slate-700 text-[15px] sm:text-[15.5px] leading-[26px] font-normal line-clamp-4">
                    &ldquo;{story.quote}&rdquo;
                  </p>
                </div>

                {/* Author & Footer - Equal gap across all cards */}
                <div className="mt-6">
                  <div className="flex items-start gap-3.5">
                    <img
                      src={story.avatarUrl}
                      alt={story.clientName}
                      className="w-11 h-11 rounded-full object-cover shrink-0 border border-slate-200"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-slate-900 text-sm leading-snug truncate">
                        {story.clientName}
                      </h4>
                      <p className="text-xs text-slate-500 leading-snug mt-0.5 truncate">
                        {story.clientRole}
                      </p>
                      <p className="text-xs text-slate-700 font-medium leading-snug mt-0.5 truncate">
                        {story.companyName} {story.location && `• ${story.location}`}
                      </p>
                      <div className="mt-1.5 flex items-center">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          ✓ Verified client
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 mt-5 pt-3 border-t border-slate-100">
                    Shared by the project team
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Mobile Navigation Arrows */}
        {isMobile && (
          <div className="flex justify-center items-center gap-4 mt-6 relative z-20">
            <button
              onClick={() => scrollStories("left")}
              className="w-10 h-10 rounded-full border border-slate-200 bg-white text-slate-700 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all shadow-sm cursor-pointer"
              aria-label="Previous Story"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-xs text-slate-400 font-medium">Swipe to explore</span>
            <button
              onClick={() => scrollStories("right")}
              className="w-10 h-10 rounded-full border border-slate-200 bg-white text-slate-700 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all shadow-sm cursor-pointer"
              aria-label="Next Story"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

      </div>
    </section>
  );
}
