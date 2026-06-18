"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 36 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.12, ease: "easeOut" as const },
  }),
};

const imageReveal = {
  hidden: { opacity: 0, scale: 0.96, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.85, delay: 0.2 + i * 0.14, ease: "easeOut" as const },
  }),
};

export default function AboutHero() {
  return (
    <section className="relative pt-28 pb-16 md:pb-24 bg-[#FAFBFD] border-b border-[#E2E8F0] overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#E6EDF5] via-[#F3F8FD] to-[#F8FBFF]"
        aria-hidden
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-start">
          {/* Left — ABOUT / US + supporting copy */}
          <div className="lg:col-span-4 flex flex-col justify-between lg:min-h-[520px]">
            <div>
              <motion.h1
                custom={0}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="text-[clamp(2.5rem,6vw,5rem)] font-black leading-[0.95] tracking-tight text-[#0A0A0A]"
              >
                ABOUT
                <br />
                US
              </motion.h1>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-8 mt-10 lg:mt-0">
              <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
                <h2 className="text-sm font-bold text-[#0A0A0A] mb-2 leading-snug">
                  Engineering that ships
                </h2>
                <p className="text-[13px] text-[#525252] leading-relaxed">
                  Production systems built for scale — custom software, SaaS platforms, and AI automation for real businesses.
                </p>
              </motion.div>
              <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
                <h2 className="text-sm font-bold text-[#0A0A0A] mb-2 leading-snug">
                  Accountable delivery
                </h2>
                <p className="text-[13px] text-[#525252] leading-relaxed">
                  One engineering team from architecture through deployment. You own the code, we own the execution.
                </p>
              </motion.div>
            </div>
          </div>

          {/* Center — large team image */}
          <motion.div
            custom={0}
            variants={imageReveal}
            initial="hidden"
            animate="visible"
            className="lg:col-span-5 relative"
          >
            <div className="relative aspect-[4/3] lg:aspect-auto lg:h-[520px] w-full overflow-hidden rounded-[2rem] border border-[#E5E5E5] shadow-[0_20px_60px_rgba(17, 85, 204,0.08)] group">
              <Image
                src="/images/about-team-large.png"
                alt="TechSonance engineering team collaborating on production software"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                sizes="(max-width: 1024px) 100vw, 42vw"
                priority
              />
            </div>
          </motion.div>

          {/* Right — small desktop setup + philosophy */}
          <div className="lg:col-span-3 flex flex-col gap-6 lg:min-h-[520px]">
            <motion.div
              custom={1}
              variants={imageReveal}
              initial="hidden"
              animate="visible"
              className="relative aspect-[4/3] lg:aspect-square w-full overflow-hidden rounded-[1.75rem] border border-[#E5E5E5] shadow-[0_12px_40px_rgba(17, 85, 204,0.06)] group"
            >
              <Image
                src="/images/about-team-small.png"
                alt="TechSonance developer workspace and production codebase"
                fill
                className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.04]"
                sizes="(max-width: 1024px) 100vw, 22vw"
                priority
              />
            </motion.div>

            <motion.div
              custom={3}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="flex-1"
            >
              <h2 className="text-base font-bold text-[#0A0A0A] mb-3 leading-snug">
                Our philosophy
              </h2>
              <p className="text-[13px] text-[#525252] leading-relaxed mb-6">
                At TechSonance, we build software that runs real businesses — not slide decks. Every system is engineered for production from day one.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="https://cal.id/techsonance-infotech/connect-with-founder?duration=15"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-[#1155CC] text-white text-[13px] font-semibold hover:bg-[#0A3D8C] transition-colors"
                >
                  Book a call
                </Link>
                <Link
                  href="/portfolio"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-[#D4D4D4] text-[#0A0A0A] text-[13px] font-semibold hover:bg-white transition-colors"
                >
                  View our work
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
