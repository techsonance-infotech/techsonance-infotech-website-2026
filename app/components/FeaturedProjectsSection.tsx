"use client";
import { useRef, useState, useEffect } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { getFeaturedProjects, type Project } from "@/data/projects";
import { ProjectMockup } from "./projects/ProjectMockup";
import { TechBadge } from "./projects/TechBadge";

// ─── Shared transition helper ──────────────────────────────────────────────────
const t = (delay = 0) => ({ duration: 0.6, ease: "easeOut" as const, delay });

// ─── One-liner result row ──────────────────────────────────────────────────────
function ChallengeRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-4 px-4 sm:px-5 py-2.5 sm:py-3 border-b border-gray-100 last:border-0">
      <span
        className="px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shrink-0"
        style={{ background: `${color}18`, color }}
      >
        {label}
      </span>
      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{value}</p>
    </div>
  );
}

// ─── Single featured project row with sticky stacking effect ──────────────────
function FeaturedProjectRow({ project, index, total }: { project: Project; index: number; total: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { once: true, margin: "-10%" });
  
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(media.matches);
    const listener = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  // Sticky stack scroll progress: tracks starting to stick until completely scrolled past
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Calculate 3D stacking compression values (scale down and fade out underneath)
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.94]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.85]);

  const isEven = index % 2 === 0;

  const hiddenX = { opacity: 0, x: isEven ? -40 : 40 };
  const visibleX = { opacity: 1, x: 0 };
  const hiddenXR = { opacity: 0, x: isEven ? 40 : -40 };

  return (
    <div
      ref={containerRef}
      className="relative w-full lg:sticky transform-gpu origin-top py-4 sm:py-6 lg:py-8"
      style={{
        top: isDesktop ? `calc(90px + ${index * 20}px)` : "auto",
        zIndex: index + 10,
        // Give preceding cards breathing room under stacked cards
        paddingBottom: isDesktop ? `${(total - 1 - index) * 12}px` : "0px",
      }}
    >
      <motion.div
        style={isDesktop ? { scale, opacity, transformOrigin: "top center" } : {}}
        className="bg-white rounded-[24px] sm:rounded-[32px] border border-gray-200/80 shadow-[0_12px_40px_rgba(0,0,0,0.03)] p-5 sm:p-8 lg:p-10 relative overflow-hidden transition-all duration-300 hover:shadow-[0_20px_60px_-10px_rgba(13,71,161,0.08)]"
      >
        {/* Background accent glow */}
        <div
          className="absolute pointer-events-none rounded-full blur-3xl opacity-[0.05]"
          style={{
            background: project.accentColor,
            width: 500,
            height: 500,
            [isEven ? "right" : "left"]: "-100px",
            top: "50%",
            transform: "translateY(-50%)",
          }}
        />

        <div
          className={`grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center ${
            isEven ? "" : "lg:[&>*:first-child]:order-2"
          }`}
        >
          {/* ── Text side ── */}
          <div className="flex flex-col gap-3.5 relative z-10">
            {/* Index + Category */}
            <motion.div
              initial={hiddenX}
              animate={inView ? visibleX : hiddenX}
              transition={t(0)}
              className="flex items-center gap-3.5"
            >
              <span
                className="text-4xl lg:text-5xl font-black leading-none select-none"
                style={{ color: `${project.accentColor}18` }}
              >
                0{index + 1}
              </span>
              <div
                className="h-px flex-1"
                style={{ background: `linear-gradient(to right, ${project.accentColor}40, transparent)` }}
              />
              <span
                className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full"
                style={{ background: `${project.accentColor}12`, color: project.accentColor }}
              >
                {project.industry}
              </span>
            </motion.div>

            {/* Title */}
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={t(0.08)}
              className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 leading-tight tracking-tight"
            >
              {project.title}
            </motion.h3>

            {/* Short description */}
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
              transition={t(0.14)}
              className="text-xs sm:text-sm text-gray-550 leading-relaxed max-w-md"
            >
              {project.shortDescription}
            </motion.p>

            {/* Challenge / Solution / Result */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
              transition={t(0.2)}
              className="rounded-2xl border border-gray-100 bg-white/80 backdrop-blur-sm shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden"
            >
              <ChallengeRow label="Challenge" value={project.challenge} color={project.accentColor} />
              <ChallengeRow label="Solution" value={project.solution} color={project.accentColor} />
              <ChallengeRow label="Result" value={project.result} color={project.accentColor} />
            </motion.div>

            {/* Tech stack */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              transition={t(0.26)}
              className="flex flex-wrap gap-1.5"
            >
              {project.techStack.slice(0, 5).map((tech) => (
                <TechBadge key={tech.name} name={tech.name} category={tech.category} size="sm" />
              ))}
              {project.techStack.length > 5 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold bg-gray-100 text-gray-500">
                  +{project.techStack.length - 5} more
                </span>
              )}
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              transition={t(0.32)}
              className="flex items-center gap-4 pt-1"
            >
              <Link
                href={`/portfolio/${project.slug}`}
                className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white transition-all duration-300 hover:scale-105 hover:shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${project.accentColor} 0%, ${project.accentColor}dd 100%)`,
                  boxShadow: `0 4px 16px ${project.accentColor}25`,
                }}
              >
                View Case Study
                <svg
                  className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-400 hover:text-gray-900 transition-colors"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 2H2v12h12v-4M10 2h4v4M6 10L14 2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Live Demo
                </a>
              )}
            </motion.div>
          </div>

          {/* ── Mockup side ── */}
          <motion.div
            initial={hiddenXR}
            animate={inView ? visibleX : hiddenXR}
            transition={t(0.1)}
            className="relative w-full z-0"
            whileHover={{ y: -4 }}
          >
            <ProjectMockup
              gradient={project.mockupGradient}
              title={project.title}
              category={project.category}
              accentColor={project.accentColor}
              screenshotPath={project.screenshotPath}
            />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Section header ────────────────────────────────────────────────────────────
function SectionHeader() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-8%" });

  return (
    <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
      <div className="flex flex-col items-start gap-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={t(0)}
          className="inline-flex items-center gap-2 bg-[#E6EDF5] border border-[#0D47A1]/15 rounded-full px-4 py-1.5"
        >
          <svg className="h-3.5 w-3.5 text-[#0D47A1]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="2" width="5" height="5" rx="1" />
            <rect x="9" y="2" width="5" height="5" rx="1" />
            <rect x="2" y="9" width="5" height="5" rx="1" />
            <rect x="9" y="9" width="5" height="5" rx="1" />
          </svg>
          <span className="text-xs font-bold text-[#0D47A1] tracking-wide uppercase">Featured Work</span>
        </motion.div>

        <div className="flex items-end justify-between w-full flex-wrap gap-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={t(0.08)}
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight"
          >
            Products We&apos;ve{" "}
            <span className="text-[#1155CC]">Engineered.</span>
          </motion.h2>

          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : { opacity: 0 }}
            transition={t(0.16)}
          >
            <Link
              href="/portfolio"
              className="group inline-flex items-center gap-2 text-sm font-bold text-[#0D47A1] hover:text-[#008BD9] transition-colors"
            >
              See All Projects
              <svg
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
          transition={t(0.2)}
          className="text-base text-gray-500 max-w-2xl leading-relaxed"
        >
          Real products. Real challenges. Real results. Here&apos;s a look at some of the systems
          we&apos;ve built from the ground up.
        </motion.p>
      </div>
    </div>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────
export default function FeaturedProjectsSection() {
  const featured = getFeaturedProjects();

  return (
    <section
      id="projects"
      className="relative bg-[#F8FBFF] overflow-x-clip"
      aria-label="Featured Projects"
    >
      {/* Decorative background grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.018]"
        style={{
          backgroundImage: "linear-gradient(#0D47A1 1px, transparent 1px), linear-gradient(90deg, #0D47A1 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <SectionHeader />

      {/* Cards stack container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 flex flex-col gap-6 lg:gap-0">
        {featured.map((project, index) => (
          <FeaturedProjectRow
            key={project.slug}
            project={project}
            index={index}
            total={featured.length}
          />
        ))}
      </div>

      {/* See All Projects CTA bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="relative rounded-3xl overflow-hidden p-px">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#0D47A1] to-[#008BD9]" />
          <div className="relative rounded-[calc(1.5rem-1px)] bg-white px-8 py-8 sm:py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#0D47A1] mb-1">Explore All Work</p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                See every product we&apos;ve shipped
              </h3>
            </div>
            <Link
              href="/portfolio"
              className="btn-primary shrink-0 inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white text-sm"
            >
              View All Projects
              <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
