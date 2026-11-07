"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "motion/react";
import Link from "next/link";
import { getAllProjects, type Project } from "@/data/projects";
import { TechBadge } from "@/app/components/projects/TechBadge";
import { ProjectMockup } from "@/app/components/projects/ProjectMockup";
import { ArcGalleryHero } from "@/components/ui/arc-gallery-hero-component";
import BookConsultationModal from "@/app/components/home/BookConsultationModal";
import { Button } from "@/components/ui/button";

// ─── Hero stats ────────────────────────────────────────────────────────────────
const heroStats = [
  { value: 10, suffix: "+", label: "Products Shipped" },
  { value: 6, suffix: "+", label: "Industries Served" },
  { value: 5, suffix: "+", label: "Years of Building" },
  { value: 100, suffix: "k+", label: "Users Impacted" },
];

// ─── Animated counter ─────────────────────────────────────────────────────────
function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const steps = 60;
    const step = value / steps;
    let current = 0;
    const interval = setInterval(() => {
      current = Math.min(current + step, value);
      setCount(Math.round(current));
      if (current >= value) clearInterval(interval);
    }, 1800 / steps);
    return () => clearInterval(interval);
  }, [inView, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {count}
      {suffix}
    </span>
  );
}

// ─── Projects listing card ──────────────────────────────────────────────────────
function ProjectCard({ project, index }: { project: Project; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-6%" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: (index % 3) * 0.1 }}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_2px_16px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_8px_40px_rgba(17, 85, 204,0.10)]"
    >
      {/* Mockup top */}
      <div className="relative p-4 pb-0">
        <ProjectMockup
          gradient={project.mockupGradient}
          title={project.title}
          category={project.category}
          accentColor={project.accentColor}
          screenshotPath={project.screenshotPath}
          priority={index < 3}
          liveUrl={project.liveUrl}
        />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg leading-tight font-medium text-gray-900">{project.title}</h3>
            <p className="mt-0.5 text-xs font-medium text-gray-400">{project.industry}</p>
          </div>
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-xl bg-gray-50 p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
              aria-label="View live demo"
            >
              <svg
                className="h-4 w-4"
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
            </a>
          )}
        </div>

        <p className="line-clamp-2 text-sm leading-relaxed text-gray-500">
          {project.shortDescription}
        </p>

        {/* Result callout */}
        <div
          className="rounded-xl px-3 py-2.5 text-xs leading-snug font-medium"
          style={{ background: `${project.accentColor}0d`, color: project.accentColor }}
        >
          <span className="font-bold">Result:</span> {project.result}
        </div>

        {/* Tech tags */}
        <div className="flex flex-wrap gap-1.5">
          {project.techStack.slice(0, 4).map((t) => (
            <TechBadge key={t.name} name={t.name} category={t.category} size="sm" />
          ))}
          {project.techStack.length > 4 && (
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-400">
              +{project.techStack.length - 4}
            </span>
          )}
        </div>

        <div className="mt-auto pt-2">
          <Link
            href={`/portfolio/${project.slug}`}
            className="group/btn inline-flex items-center gap-2 text-sm font-bold transition-colors"
            style={{ color: project.accentColor }}
          >
            Open Case Study
            <svg
              className="h-3.5 w-3.5 transition-transform duration-300 group-hover/btn:translate-x-1"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Category filter tabs ──────────────────────────────────────────────────────
const categories = [
  "All",
  "Mobile App",
  "SaaS Platform",
  "E-Commerce Platform",
  "POS System",
  "Accounting Software",
  "Enterprise Tool",
  "Website Redesign",
];

export default function PortfolioClient() {
  const allProjects = getAllProjects();
  const [activeCategory, setActiveCategory] = useState("All");
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  const filtered =
    activeCategory === "All"
      ? allProjects
      : allProjects.filter((p) => p.category === activeCategory);

  return (
    <main className="min-h-screen overflow-x-clip bg-[#FAFBFD] text-[#0F172A]">
      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <ArcGalleryHero
        images={[
          "/images/utsav/utsav-festival-app-showcase.png",
          "/images/zion/zion-event-discovery-mobile-app-showcase.png",
          "/images/portfolio-hero-images/ai-automation-mockup.png",
          "/images/portfolio-hero-images/ecommerce-website-design-examples-1024x768.jpg",
          "/images/zion/zion-neon-dubai-onboarding-screens.png",
          "/images/utsav/utsav-mandal-app-ui-showcase.png",
          "/images/portfolio-hero-images/saas-analytics-mockup.png",
          "/images/portfolio-hero-images/custom-software-mockup.png",
          "/images/zion/zion-event-analytics-host-dashboard.png",
          "/images/portfolio-hero-images/mobile-website-design.webp",
          "/images/portfolio-hero-images/cloud-architecture-mockup.png",
          "/images/zion/zion-event-ticket-booking-analytics.png",
        ]}
        className="min-h-[90vh] bg-[#FAFBFD] pt-24 pb-16 text-[#0F172A]"
      >
        <div
          className="animate-fade-in relative z-10 flex max-w-4xl flex-col items-center px-6 text-center opacity-0"
          style={{ animationDelay: "800ms", animationFillMode: "forwards" }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#1155CC]/15 bg-white px-4 py-1.5 shadow-sm">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#22B6F6]" />
            <span className="text-xs font-bold tracking-wide text-[#1155CC] uppercase">
              Portfolio &amp; Case Studies
            </span>
          </div>

          <h1 className="mb-6 text-4xl leading-[1.06] font-medium tracking-tight text-gray-900 sm:text-5xl lg:text-7xl">
            Our Best Work, <br /> <span className="text-[#1155CC]">Live in Production.</span>
          </h1>

          <p className="mx-auto mt-4 mb-8 max-w-2xl text-base leading-relaxed text-gray-500 sm:text-lg">
            We&apos;re proud to showcase a diverse collection of our work that highlights our
            expertise and creativity.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              onClick={() => {
                document.getElementById("projects-list")?.scrollIntoView({ behavior: "smooth" });
              }}
              variant="default"
              className="w-full sm:w-auto"
            >
              Explore Projects
            </Button>
          </div>
        </div>
      </ArcGalleryHero>

      {/* ── Filter + Grid Section Wrapper with Background Effects ───────────────── */}
      <div className="relative w-full overflow-hidden border-t border-slate-100 bg-[#FAFBFD]">
        {/* Ambient Gradient Background Glows */}
        <div className="pointer-events-none absolute top-10 left-[10%] z-0 h-[300px] w-[300px] rounded-full bg-[#1155CC]/5 blur-[100px] sm:h-[500px] sm:w-[500px]" />
        <div className="pointer-events-none absolute right-[5%] bottom-20 z-0 h-[300px] w-[300px] rounded-full bg-[#22B6F6]/5 blur-[120px] sm:h-[500px] sm:w-[500px]" />

        {/* Premium SVG Wave Lines */}
        <svg
          className="pointer-events-none absolute top-[20%] left-0 z-0 h-[250px] w-full text-[#1155CC] opacity-[0.04]"
          viewBox="0 0 1440 250"
          fill="none"
        >
          <motion.path
            d="M0 120 C300 220, 600 20, 900 220 C1200 110, 1350 20, 1440 120"
            stroke="currentColor"
            strokeWidth="2"
            animate={{
              d: [
                "M0 120 C300 220, 600 20, 900 220 C1200 110, 1350 20, 1440 120",
                "M0 120 C300 20, 600 220, 900 20 C1200 220, 1350 110, 1440 120",
                "M0 120 C300 220, 600 20, 900 220 C1200 110, 1350 20, 1440 120",
              ],
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          />
        </svg>

        <section
          id="projects-list"
          className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
        >
          {/* Section label */}
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-medium text-gray-900 sm:text-3xl">
              All <span className="text-[#1155CC]">Projects</span>
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              {allProjects.length} products across {categories.length - 1} categories
            </p>
          </div>

          {/* Category filter */}
          <div className="mb-10 flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                  activeCategory === cat
                    ? "bg-[#1155CC] text-white border-[#1155CC] shadow-[0_2px_12px_rgba(17, 85, 204,0.25)]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[#1155CC]/40 hover:text-[#1155CC]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Project cards grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filtered.map((project, index) => (
                <ProjectCard key={project.slug} project={project} index={index} />
              ))}
            </motion.div>
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="py-24 text-center text-gray-400">
              <p className="text-lg font-medium">No projects in this category yet.</p>
            </div>
          )}
        </section>
      </div>

      {/* ── Bottom CTA ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-20">
        <div className="brand-gradient absolute inset-0 opacity-95" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-4 text-3xl font-medium text-white sm:text-4xl"
          >
            Ready to build your product?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8 text-base text-white/80"
          >
            Let&apos;s turn your idea into a production-ready system. Free consultation, no
            commitments.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="flex flex-col justify-center gap-4 sm:flex-row"
          >
            <Button
              onClick={() => setIsBookModalOpen(true)}
              variant="secondary"
              className="w-full border-transparent bg-white text-[#1155CC] shadow-md hover:border-transparent hover:bg-slate-50 hover:text-[#1155CC] hover:shadow-lg focus:ring-white/20 sm:w-auto"
            >
              Book Free Consultation
            </Button>
            <Button
              asChild
              variant="secondary"
              className="w-full border-white/40 text-white hover:border-white hover:bg-white/10 hover:text-white hover:shadow-lg focus:ring-white/20 sm:w-auto"
            >
              <Link href="/">Back to Home</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      <BookConsultationModal isOpen={isBookModalOpen} onClose={() => setIsBookModalOpen(false)} />
    </main>
  );
}
