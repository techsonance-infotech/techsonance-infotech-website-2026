"use client";
import { useRef, useState, useEffect } from "react";
import { motion, useInView, useScroll, useTransform } from "motion/react";
import Link from "next/link";
import { getFeaturedProjects, type Project } from "@/data/projects";
import { ProjectMockup } from "./projects/ProjectMockup";
import { TechBadge } from "./projects/TechBadge";
import { Button } from "@/components/ui/button";

// ─── Shared transition helper ──────────────────────────────────────────────────
const t = (delay = 0) => ({ duration: 0.6, ease: "easeOut" as const, delay });

// ─── One-liner result row ──────────────────────────────────────────────────────
function ChallengeRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col items-start gap-1.5 border-b border-gray-100 px-3.5 py-1.5 last:border-0 sm:flex-row sm:gap-3.5 sm:px-4 sm:py-2">
      <span
        className="shrink-0 rounded px-2 py-0.5 text-[9px] font-black tracking-wider uppercase"
        style={{ background: `${color}18`, color }}
      >
        {label}
      </span>
      <p className="text-xs leading-snug text-gray-600 sm:text-[13px]">{value}</p>
    </div>
  );
}

// ─── Single featured project row with sticky stacking effect ──────────────────
function FeaturedProjectRow({
  project,
  index,
  total,
}: {
  project: Project;
  index: number;
  total: number;
}) {
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
      className="relative w-full origin-top transform-gpu py-2 sm:py-3 lg:sticky lg:py-4"
      style={{
        top: isDesktop ? `calc(72px + ${index * 14}px)` : "auto",
        zIndex: index + 10,
        // Give preceding cards breathing room under stacked cards
        paddingBottom: isDesktop ? `${(total - 1 - index) * 10}px` : "0px",
      }}
    >
      <motion.div
        style={isDesktop ? { scale, opacity, transformOrigin: "top center" } : {}}
        className="relative overflow-hidden rounded-[22px] border border-gray-200/80 bg-white p-4 shadow-[0_10px_35px_rgba(0,0,0,0.03)] transition-all duration-300 hover:shadow-[0_16px_50px_-10px_rgba(13,71,161,0.08)] sm:rounded-[28px] sm:p-6 lg:p-6 xl:p-7"
      >
        {/* Background accent glow */}
        <div
          className="pointer-events-none absolute rounded-full opacity-[0.05] blur-3xl"
          style={{
            background: project.accentColor,
            width: 500,
            height: 500,
            [isEven ? "right" : "left"]: "-100px",
            top: "50%",
            transform: "translateY(-50%)",
          }}
        />

        <div className="grid grid-cols-1 items-center gap-5 lg:grid-cols-2 lg:gap-7">
          {/* ── Text side ── */}
          <div
            className={`relative z-10 order-2 flex flex-col gap-2 lg:gap-2.5 ${isEven ? "lg:order-1" : "lg:order-2"}`}
          >
            {/* Index + Category */}
            <motion.div
              initial={hiddenX}
              animate={inView ? visibleX : hiddenX}
              transition={t(0)}
              className="flex items-center gap-3"
            >
              <span
                className="text-3xl leading-none font-black select-none lg:text-4xl"
                style={{ color: `${project.accentColor}18` }}
              >
                0{index + 1}
              </span>
              <div
                className="h-px flex-1"
                style={{
                  background: `linear-gradient(to right, ${project.accentColor}40, transparent)`,
                }}
              />
              <span
                className="rounded-full px-2.5 py-0.5 text-[9px] font-black tracking-widest uppercase"
                style={{ background: `${project.accentColor}12`, color: project.accentColor }}
              >
                {project.industry}
              </span>
            </motion.div>

            {/* Title */}
            <motion.h3
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
              transition={t(0.08)}
              className="text-lg leading-[1.15] font-medium tracking-tight text-gray-900 sm:text-xl lg:text-2xl"
            >
              {project.title}
            </motion.h3>

            {/* Short description */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
              transition={t(0.14)}
              className="text-gray-550 line-clamp-2 max-w-md text-xs leading-relaxed sm:text-[13px]"
            >
              {project.shortDescription}
            </motion.p>

            {/* Challenge / Solution / Result */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
              transition={t(0.2)}
              className="overflow-hidden rounded-xl border border-gray-100 bg-white/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] backdrop-blur-sm"
            >
              <ChallengeRow
                label="Challenge"
                value={project.challenge}
                color={project.accentColor}
              />
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
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-semibold text-gray-500">
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
              <Button asChild variant="default" size="sm">
                <Link href={`/portfolio/${project.slug}`}>View Project</Link>
              </Button>
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 transition-colors hover:text-gray-900 sm:text-sm"
                >
                  <svg
                    className="h-3.5 w-3.5"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      d="M6 2H2v12h12v-4M10 2h4v4M6 10L14 2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
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
            className={`relative z-0 order-1 w-full ${isEven ? "lg:order-2" : "lg:order-1"}`}
            whileHover={{ y: -4 }}
          >
            <ProjectMockup
              gradient={project.mockupGradient}
              title={project.title}
              category={project.category}
              accentColor={project.accentColor}
              screenshotPath={project.screenshotPath}
              liveUrl={project.liveUrl}
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
    <div ref={ref} className="mx-auto max-w-7xl px-4 pt-20 pb-12 sm:px-6 lg:px-8">
      <div className="flex flex-col items-start gap-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={t(0)}
          className="inline-flex items-center gap-2 rounded-full border border-[#0D47A1]/15 bg-[#E6EDF5] px-4 py-1.5"
        >
          <svg
            className="h-3.5 w-3.5 text-[#0D47A1]"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="2" y="2" width="5" height="5" rx="1" />
            <rect x="9" y="2" width="5" height="5" rx="1" />
            <rect x="2" y="9" width="5" height="5" rx="1" />
            <rect x="9" y="9" width="5" height="5" rx="1" />
          </svg>
          <span className="text-xs font-bold tracking-wide text-[#0D47A1] uppercase">
            Featured Work
          </span>
        </motion.div>

        <div className="flex w-full flex-wrap items-end justify-between gap-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={t(0.08)}
            className="text-3xl leading-[1.15] font-medium tracking-tight text-gray-900 sm:text-4xl lg:text-5xl"
          >
            Products <span className="italic">We&apos;ve </span>
            <span className="text-[#1155CC] italic">Engineered.</span>
          </motion.h2>

          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : { opacity: 0 }}
            transition={t(0.16)}
          >
            <Link
              href="/portfolio"
              className="group inline-flex items-center gap-2 text-sm font-bold text-[#0D47A1] transition-colors hover:text-[#008BD9]"
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
          className="max-w-2xl text-base leading-relaxed text-gray-500"
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
      className="relative overflow-x-clip bg-[#F8FBFF]"
      aria-label="Featured Projects"
    >
      {/* Decorative background grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.018]"
        style={{
          backgroundImage:
            "linear-gradient(#0D47A1 1px, transparent 1px), linear-gradient(90deg, #0D47A1 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <SectionHeader />

      {/* Cards stack container */}
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 pb-16 sm:px-6 lg:gap-0 lg:px-8">
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
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl p-px">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#0D47A1] to-[#008BD9]" />
          <div className="relative flex flex-col items-center justify-between gap-6 rounded-[calc(1.5rem-1px)] bg-white px-8 py-8 sm:flex-row sm:py-10">
            <div>
              <p className="mb-1 text-xs font-bold tracking-widest text-[#0D47A1] uppercase">
                Explore All Work
              </p>
              <h3 className="text-xl font-medium text-gray-900 sm:text-2xl">
                See every product we&apos;ve shipped
              </h3>
            </div>
            <Button asChild variant="default" className="shrink-0">
              <Link href="/portfolio">View All Projects</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
