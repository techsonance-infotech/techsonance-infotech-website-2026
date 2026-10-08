"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { getAllProjects, type Project } from "@/data/projects";
import { TechBadge } from "@/app/components/projects/TechBadge";
import { ProjectMockup } from "@/app/components/projects/ProjectMockup";
import { ArcGalleryHero } from "@/components/ui/arc-gallery-hero-component";
import BookConsultationModal from "@/app/components/home/BookConsultationModal";
import { Button } from "@/components/ui/button";

// ─── Hero stats ────────────────────────────────────────────────────────────────
const heroStats = [
  { value: 9, suffix: "+", label: "Products Shipped" },
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
      className="group relative flex flex-col bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_40px_rgba(17, 85, 204,0.10)] hover:-translate-y-1.5 transition-all duration-300 overflow-hidden"
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
      <div className="flex flex-col flex-1 p-6 gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-medium text-lg text-gray-900 leading-tight">{project.title}</h3>
            <p className="text-xs text-gray-400 font-medium mt-0.5">{project.industry}</p>
          </div>
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
              aria-label="View live demo"
            >
              <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2H2v12h12v-4M10 2h4v4M6 10L14 2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          )}
        </div>

        <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">{project.shortDescription}</p>

        {/* Result callout */}
        <div
          className="rounded-xl px-3 py-2.5 text-xs font-medium leading-snug"
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
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-400">
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
const categories = ["All", "Mobile App", "SaaS Platform", "E-Commerce Platform", "POS System", "Accounting Software", "Enterprise Tool", "Website Redesign"];

export default function PortfolioClient() {
  const allProjects = getAllProjects();
  const [activeCategory, setActiveCategory] = useState("All");
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  const filtered = activeCategory === "All"
    ? allProjects
    : allProjects.filter((p) => p.category === activeCategory);

  return (
    <main className="min-h-screen bg-[#FAFBFD] text-[#0F172A] overflow-x-clip">
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
        className="bg-[#FAFBFD] text-[#0F172A] pt-24 pb-16 min-h-[90vh]"
      >
        <div
          className="text-center max-w-4xl px-6 opacity-0 animate-fade-in flex flex-col items-center relative z-10"
          style={{ animationDelay: '800ms', animationFillMode: 'forwards' }}
        >
          <div className="inline-flex items-center gap-2 bg-white border border-[#1155CC]/15 rounded-full px-4 py-1.5 shadow-sm mb-6">
            <span className="w-2.5 h-2.5 rounded-full bg-[#22B6F6] animate-pulse" />
            <span className="text-xs font-bold text-[#1155CC] tracking-wide uppercase">
              Portfolio &amp; Case Studies
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-medium text-gray-900 leading-[1.06] tracking-tight mb-6">
            Our Best Work, <br /> <span className="text-[#1155CC]">Live in Production.</span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-gray-500 leading-relaxed max-w-2xl mx-auto mb-8">
            We&apos;re proud to showcase a diverse collection of our work that highlights our expertise and creativity.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={() => {
                document.getElementById("projects-list")?.scrollIntoView({ behavior: "smooth" });
              }}
              variant="primary"
              className="w-full sm:w-auto"
            >
              Explore Projects
            </Button>
          </div>
        </div>
      </ArcGalleryHero>

      {/* ── Filter + Grid Section Wrapper with Background Effects ───────────────── */}
      <div className="relative w-full overflow-hidden bg-[#FAFBFD] border-t border-slate-100">

        {/* Ambient Gradient Background Glows */}
        <div className="absolute top-10 left-[10%] w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-[#1155CC]/5 rounded-full blur-[100px] pointer-events-none z-0" />
        <div className="absolute bottom-20 right-[5%] w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-[#22B6F6]/5 rounded-full blur-[120px] pointer-events-none z-0" />

        {/* Premium SVG Wave Lines */}
        <svg className="absolute top-[20%] left-0 w-full h-[250px] opacity-[0.04] text-[#1155CC] pointer-events-none z-0" viewBox="0 0 1440 250" fill="none">
          <motion.path
            d="M0 120 C300 220, 600 20, 900 220 C1200 110, 1350 20, 1440 120"
            stroke="currentColor"
            strokeWidth="2"
            animate={{
              d: [
                "M0 120 C300 220, 600 20, 900 220 C1200 110, 1350 20, 1440 120",
                "M0 120 C300 20, 600 220, 900 20 C1200 220, 1350 110, 1440 120",
                "M0 120 C300 220, 600 20, 900 220 C1200 110, 1350 20, 1440 120"
              ]
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          />
        </svg>

        <section id="projects-list" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
          {/* Section label */}
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-medium text-gray-900">
              All <span className="text-[#1155CC]">Projects</span>
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              {allProjects.length} products across {categories.length - 1} categories
            </p>
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border cursor-pointer ${activeCategory === cat
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
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filtered.map((project, index) => (
                <ProjectCard key={project.slug} project={project} index={index} />
              ))}
            </motion.div>
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="text-center py-24 text-gray-400">
              <p className="text-lg font-medium">No projects in this category yet.</p>
            </div>
          )}
        </section>
      </div>

      {/* ── Bottom CTA ─────────────────────────────────────────────────────────── */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 brand-gradient opacity-95" />
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }} />
        <div className="relative z-10 max-w-3xl mx-auto text-center px-4">
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-4xl font-medium text-white mb-4"
          >
            Ready to build your product?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-white/80 text-base mb-8"
          >
            Let&apos;s turn your idea into a production-ready system. Free consultation, no commitments.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              onClick={() => setIsBookModalOpen(true)}
              variant="secondary"
              className="w-full sm:w-auto bg-white hover:bg-slate-50 text-[#1155CC] hover:text-[#1155CC] border-transparent hover:border-transparent shadow-md hover:shadow-lg focus:ring-white/20"
            >
              Book Free Consultation
            </Button>
            <Button
              asChild
              variant="secondary"
              className="w-full sm:w-auto border-white/40 hover:border-white text-white hover:text-white hover:bg-white/10 hover:shadow-lg focus:ring-white/20"
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
