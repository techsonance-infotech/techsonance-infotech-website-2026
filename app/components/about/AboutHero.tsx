"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { m } from "motion/react";
import SafeImage from "@/app/components/SafeImage";
import BookConsultationModal from "@/app/components/home/BookConsultationModal";
import { Button } from "@/components/ui/button";
import { AboutHeroBackground } from "@/app/components/about/AboutHeroBackground";

const emptySubscribe = () => () => {};

export default function AboutHero() {
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fadeUp = {
    hidden: { opacity: 0, y: isMobile ? 0 : 36 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, delay: i * 0.12, ease: "easeOut" as const },
    }),
  };

  const imageReveal = {
    hidden: { opacity: 0, scale: isMobile ? 1 : 0.96, y: isMobile ? 0 : 24 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.85, delay: 0.2 + i * 0.14, ease: "easeOut" as const },
    }),
  };

  return (
    <>
      <section className="relative overflow-hidden border-b border-gray-100 bg-[#FAFBFD] pt-32 pb-20 md:py-28">
        <AboutHeroBackground mounted={mounted} isMobile={isMobile} />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
            {/* Left Column: Heading & Key Features */}
            <div className="relative flex flex-col justify-between lg:col-span-4 lg:min-h-[520px]">
              <div>
                {/* Micro badge */}
                <m.div
                  custom={0}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#1155CC]/10 bg-[#F1F5F9] px-4.5 py-1.5"
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                  }}
                >
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#1155CC]" />
                  <span className="text-[10px] font-medium tracking-widest text-[#1155CC] uppercase">
                    OUR MISSION
                  </span>
                </m.div>

                <m.h1
                  custom={1}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  className="text-3xl leading-[1.05] font-black tracking-tight text-gray-900 sm:text-4xl lg:text-[52px]"
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: "translate3d(0, 0, 0)",
                    WebkitTransform: "translate3d(0, 0, 0)",
                  }}
                >
                  About TechSonance Infotech:{" "}
                  <span className="block text-[#1155CC] lg:inline-block">
                    Software &amp; AI Engineering Partner in Surat
                  </span>
                </m.h1>

                <m.p
                  custom={2}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  className="mt-5 max-w-sm text-sm leading-relaxed font-medium text-gray-500"
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                  }}
                >
                  We are a premium team of software architects and product engineers delivering
                  scalable codebases that accelerate business outcomes.
                </m.p>
              </div>

              {/* Info Blocks */}
              <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:mt-0 lg:grid-cols-1">
                <m.div
                  custom={3}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  className="group rounded-2xl border border-gray-100/60 bg-white/70 p-5 shadow-[0_4px_16px_rgba(0,0,0,0.01)] backdrop-blur-sm transition-all duration-300 hover:border-blue-100 hover:shadow-[0_8px_24px_rgba(17,85,204,0.03)]"
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                  }}
                >
                  <h3 className="mb-1.5 flex items-center gap-2 text-[13px] font-bold text-gray-900 transition-colors group-hover:text-[#1155CC]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#1155CC]" />
                    Engineering that ships
                  </h3>
                  <p className="text-[12px] leading-relaxed text-gray-500">
                    Production systems built for scale - custom software, SaaS platforms, and AI
                    automation for real businesses.
                  </p>
                </m.div>

                <m.div
                  custom={4}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  className="group rounded-2xl border border-gray-100/60 bg-white/70 p-5 shadow-[0_4px_16px_rgba(0,0,0,0.01)] backdrop-blur-sm transition-all duration-300 hover:border-blue-100 hover:shadow-[0_8px_24px_rgba(17,85,204,0.03)]"
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                  }}
                >
                  <h3 className="mb-1.5 flex items-center gap-2 text-[13px] font-bold text-gray-900 transition-colors group-hover:text-[#1155CC]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#22B6F6]" />
                    Accountable delivery
                  </h3>
                  <p className="text-[12px] leading-relaxed text-gray-500">
                    One engineering team from architecture through deployment. You own the code, we
                    own the execution.
                  </p>
                </m.div>
              </div>
            </div>

            {/* Center Column: Interactive Large Team Image */}
            <m.div
              custom={0}
              variants={imageReveal}
              initial="hidden"
              animate="visible"
              className="relative lg:col-span-5"
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
              }}
            >
              {/* Outer decorative card shadow */}
              <div className="pointer-events-none absolute inset-0 translate-x-3 translate-y-3 rounded-[2.2rem] bg-[#1155CC]/5 blur-sm" />

              <div className="group relative aspect-[4/3] w-full overflow-hidden rounded-[2rem] border border-gray-200/80 bg-white shadow-[0_20px_50px_rgba(17,85,204,0.06)] lg:aspect-auto lg:h-[520px]">
                <SafeImage
                  src="/images/about-techsonance-engineering-team.jpg"
                  alt="TechSonance Infotech engineering team collaborating on production software and AI solutions in Surat"
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>
            </m.div>

            {/* Right Column: Mini card + Philosophy block */}
            <div className="flex flex-col gap-6 lg:col-span-3 lg:min-h-[520px]">
              <m.div
                custom={1}
                variants={imageReveal}
                initial="hidden"
                animate="visible"
                className="group relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-[1.75rem] border border-gray-800 bg-gradient-to-tr from-[#0F172A] to-[#1E293B] p-8 shadow-[0_12px_30px_rgba(17,85,204,0.08)] lg:aspect-square"
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                }}
              >
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:20px_20px]" />

                {/* Floating Glow effects */}
                <div className="absolute top-1/2 left-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1155CC]/15 blur-2xl transition-all duration-500 group-hover:bg-[#22B6F6]/25" />

                <div className="relative z-10 flex flex-col items-center gap-4 text-center">
                  <Image
                    src="/images/logo-icon.png"
                    alt="TechSonance Logo"
                    width={96}
                    height={96}
                    className="h-20 w-20 object-contain transition-transform duration-700 ease-out group-hover:scale-105"
                    priority
                  />
                  <div>
                    <h3 className="text-xs font-bold tracking-widest text-white uppercase">
                      TECHSONANCE
                    </h3>
                    <p className="mt-0.5 font-mono text-[9px] tracking-wider text-[#22B6F6]">
                      INFOTECH LLP
                    </p>
                  </div>
                </div>
              </m.div>

              <m.div
                custom={3}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="flex flex-grow flex-col justify-between"
              >
                <div>
                  <h2 className="mb-2 text-base leading-snug font-bold text-gray-900">
                    Our philosophy
                  </h2>
                  <p className="mb-6 text-[13px] leading-relaxed font-medium text-gray-500">
                    At TechSonance, we build software that runs real businesses - not slide decks.
                    Every system is engineered for production from day one.
                  </p>
                </div>

                <div className="mt-auto flex flex-col gap-3 sm:flex-row">
                  <Button onClick={() => setIsBookModalOpen(true)} variant="default" size="sm">
                    Book a call
                  </Button>
                  <Button asChild variant="secondary" size="sm">
                    <Link href="/portfolio">View our work</Link>
                  </Button>
                </div>
              </m.div>
            </div>
          </div>
        </div>
      </section>
      <BookConsultationModal isOpen={isBookModalOpen} onClose={() => setIsBookModalOpen(false)} />
    </>
  );
}
