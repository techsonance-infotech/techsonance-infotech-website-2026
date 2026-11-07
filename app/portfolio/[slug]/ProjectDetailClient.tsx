"use client";
import { useState, useRef, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "motion/react";
import Link from "next/link";
import Image from "next/image";
import SafeImage from "@/app/components/SafeImage";
import { type Project } from "@/data/projects";
import { TechBadge } from "@/app/components/projects/TechBadge";
import { MetricCard } from "@/app/components/projects/MetricCard";
import { ProjectMockup } from "@/app/components/projects/ProjectMockup";
import BookConsultationModal from "@/app/components/home/BookConsultationModal";
import { Button } from "@/components/ui/button";
import EmojiOrLucideIcon from "@/app/components/icons/LucideIcon";
import { trackCaseStudyView } from "@/lib/analytics";

// ─── Reveal animation preset ────────────────────────────────────────────────────
function RevealSection({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-8%" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ text, color }: { text: string; color: string }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <div className="h-px w-8" style={{ background: color }} />
      <span className="text-xs font-black tracking-widest uppercase" style={{ color }}>
        {text}
      </span>
      <div className="h-px flex-1 bg-gray-100" />
    </div>
  );
}

// ─── Image Gallery (screenshots) ───────────────────────────────────────────────
function ScreenshotGallery({
  screenshots,
  accentColor,
  liveUrl,
  slug,
  category,
}: {
  screenshots: { src: string; caption: string }[];
  accentColor: string;
  liveUrl?: string;
  slug: string;
  category?: string;
}) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const isMobile = category?.toLowerCase().includes("mobile");

  const displayHost = liveUrl ? new URL(liveUrl).hostname : `${slug}.techsonance.co.in`;

  return (
    <section className="overflow-hidden bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <RevealSection>
          <div className="mb-6 flex items-center gap-3">
            <div className="h-px w-8" style={{ background: accentColor }} />
            <span
              className="text-xs font-black tracking-widest uppercase"
              style={{ color: accentColor }}
            >
              Product Screenshots
            </span>
            <div className="h-px flex-1 bg-gray-100" />
          </div>
          <h2 className="mb-10 text-2xl font-medium text-gray-900 sm:text-3xl">
            See it in <span className="brand-gradient-text">action</span>
          </h2>
        </RevealSection>

        {/* Main active image - no fixed height, let the image define its size */}
        <div
          className="relative mb-5 w-full cursor-zoom-in overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl sm:rounded-3xl"
          onClick={() => setLightbox(true)}
        >
          {/* Browser chrome - only for web apps */}
          {!isMobile && (
            <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2.5">
              <span className="h-3 w-3 rounded-full bg-[#FF5F57]" />
              <span className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
              <span className="h-3 w-3 rounded-full bg-[#28C840]" />
              <div className="mx-3 flex-1 truncate rounded-md border border-gray-200 bg-white px-3 py-1 font-mono text-[10px] text-gray-400">
                {displayHost}
              </div>
              <span className="hidden text-[10px] text-gray-400 sm:inline">Click to enlarge</span>
            </div>
          )}

          {/* Full-width image - no fixed height container, natural aspect ratio */}
          <div className="relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <SafeImage
                  src={screenshots[active].src}
                  alt={screenshots[active].caption}
                  width={1200}
                  height={750}
                  style={{ width: "100%", height: "auto", display: "block" }}
                  sizes="(max-width: 768px) 100vw, 90vw"
                  priority={active === 0}
                />
              </motion.div>
            </AnimatePresence>

            {/* Prev / Next overlays */}
            {active > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActive(active - 1);
                }}
                className="absolute top-1/2 left-3 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
                aria-label="Previous screenshot"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M10 4l-4 4 4 4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
            {active < screenshots.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActive(active + 1);
                }}
                className="absolute top-1/2 right-3 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
                aria-label="Next screenshot"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Caption */}
        <p className="mb-6 text-center text-sm text-gray-500 italic">
          {screenshots[active].caption}
        </p>

        {/* Thumbnail strip - fixed height, object-contain so full image is visible */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          {screenshots.map((s, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`relative shrink-0 overflow-hidden rounded-xl border-2 bg-gray-100 transition-all duration-200 ${
                i === active ? "scale-105 shadow-lg" : "border-gray-200 opacity-60 hover:opacity-90"
              }`}
              style={i === active ? { borderColor: accentColor } : {}}
              aria-label={`View screenshot ${i + 1}`}
            >
              <div className="flex h-24 w-40 items-center justify-center overflow-hidden sm:h-32 sm:w-52">
                <SafeImage
                  src={s.src}
                  alt={s.caption}
                  width={400}
                  height={250}
                  style={{ width: "100%", height: "auto", display: "block" }}
                  sizes="220px"
                />
              </div>
              {i === active && (
                <div
                  className="absolute right-0 bottom-0 left-0 h-0.5"
                  style={{ background: accentColor }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Dot indicators */}
        <div className="mt-4 flex justify-center gap-2">
          {screenshots.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className="h-1.5 w-1.5 rounded-full transition-all duration-200"
              style={{
                background: i === active ? accentColor : "#D1D5DB",
                transform: i === active ? "scale(1.5)" : "scale(1)",
              }}
              aria-label={`Go to screenshot ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* ── Lightbox ──────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
            onClick={() => setLightbox(false)}
          >
            <button
              className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              onClick={() => setLightbox(false)}
              aria-label="Close lightbox"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  d="M6 6l8 8M14 6l-8 8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            <motion.div
              initial={{ scale: 0.94 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.94 }}
              className="relative w-full max-w-5xl overflow-hidden rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative aspect-[16/9] w-full">
                <Image
                  src={screenshots[active].src}
                  alt={screenshots[active].caption}
                  fill
                  className="object-contain"
                  sizes="90vw"
                />
              </div>
            </motion.div>

            <p className="mt-4 text-center text-sm text-white/70 italic">
              {screenshots[active].caption}
            </p>

            {/* Lightbox nav */}
            <div className="mt-4 flex gap-3">
              {screenshots.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActive(i);
                  }}
                  className="h-2 w-2 rounded-full transition-all"
                  style={{ background: i === active ? "white" : "rgba(255,255,255,0.3)" }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ─── Hero section ──────────────────────────────────────────────────────────────
function ProjectHero({ project }: { project: Project }) {
  return (
    <section className="relative flex min-h-[80vh] items-center overflow-hidden pt-16 pb-12">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-48 -right-48 h-[700px] w-[700px] rounded-full opacity-10 blur-3xl"
          style={{ background: project.accentColor }}
        />
        <div
          className="absolute -bottom-48 -left-48 h-[500px] w-[500px] rounded-full opacity-8 blur-3xl"
          style={{ background: project.accentColor }}
        />
        <div
          className="absolute inset-0 opacity-[0.022]"
          style={{
            backgroundImage:
              "linear-gradient(#1155CC 1px, transparent 1px), linear-gradient(90deg, #1155CC 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex items-center gap-2 text-sm text-gray-400"
        >
          <Link href="/" className="transition-colors hover:text-gray-700">
            Home
          </Link>
          <span>/</span>
          <Link href="/portfolio" className="transition-colors hover:text-gray-700">
            Portfolio
          </Link>
          <span>/</span>
          <span className="font-medium text-gray-700">{project.title}</span>
        </motion.div>

        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left: text */}
          <div className="flex flex-col gap-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="flex flex-wrap gap-2"
            >
              <span
                className="rounded-full px-3 py-1 text-[10px] font-black tracking-widest text-white uppercase"
                style={{ background: project.accentColor }}
              >
                {project.category}
              </span>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                {project.industry}
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl leading-[1.06] font-medium tracking-tight text-gray-900 sm:text-5xl lg:text-6xl"
            >
              {project.title}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.16 }}
              className="text-base leading-snug font-medium text-slate-700 sm:text-lg"
            >
              {project.tagline}
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base leading-relaxed text-gray-500"
            >
              {project.overview}
            </motion.p>

            {/* Tech stack */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.26 }}
              className="flex flex-wrap gap-2"
            >
              {project.techStack.slice(0, 8).map((t) => (
                <TechBadge key={t.name} name={t.name} category={t.category} size="md" />
              ))}
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-3 pt-2"
            >
              {project.liveUrl && (
                <Button
                  asChild
                  variant="default"
                  style={{
                    background: `linear-gradient(135deg, ${project.accentColor}, ${project.accentColor}cc)`,
                    boxShadow: `0 4px 20px ${project.accentColor}30`,
                  }}
                  className="border-transparent hover:border-transparent"
                >
                  <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                    <svg
                      className="mr-2 h-4 w-4"
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
                    View Live Product
                  </a>
                </Button>
              )}
              <Button asChild variant="secondary">
                <Link href="/portfolio">← Portfolio</Link>
              </Button>
            </motion.div>
          </div>

          {/* Right: mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <ProjectMockup
              gradient={project.mockupGradient}
              title={project.title}
              category={project.category}
              accentColor={project.accentColor}
              screenshotPath={project.screenshotPath}
              priority={true}
              liveUrl={project.liveUrl}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default function ProjectDetailClient({ project }: { project: Project }) {
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  useEffect(() => {
    trackCaseStudyView(project.slug, project.title);
  }, [project.slug, project.title]);

  return (
    <main className="overflow-x-clip">
      {/* Hero */}
      <ProjectHero project={project} />

      {/* ── Screenshots Gallery (only if screenshots exist) ─────────────────────── */}
      {project.screenshots && project.screenshots.length > 0 && (
        <ScreenshotGallery
          screenshots={project.screenshots}
          accentColor={project.accentColor}
          liveUrl={project.liveUrl}
          slug={project.slug}
          category={project.category}
        />
      )}

      {/* ── Challenges ────────────────────────────────────────────────────────── */}
      <section className="bg-[#FAFBFD] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <RevealSection>
            <SectionLabel text="Challenges" color={project.accentColor} />
            <h2 className="mb-10 text-2xl font-medium text-gray-900 sm:text-3xl">
              Problems we <span style={{ color: project.accentColor }}>solved</span>
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {project.challenges.map((c, i) => (
                <motion.div
                  key={c.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-8%" }}
                  transition={{ duration: 0.55, delay: i * 0.1, ease: "easeOut" }}
                  className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)]"
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl text-xl"
                    style={{ background: `${project.accentColor}12`, color: project.accentColor }}
                  >
                    <EmojiOrLucideIcon icon={c.icon} className="h-5 w-5" />
                  </div>
                  <h3 className="font-medium text-gray-900">{c.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-500">{c.description}</p>
                </motion.div>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── Solutions ──────────────────────────────────────────────────────────── */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <RevealSection>
            <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2">
              <div>
                <SectionLabel text="Solutions" color={project.accentColor} />
                <h2 className="mb-6 text-2xl font-medium text-gray-900 sm:text-3xl">
                  How we <span style={{ color: project.accentColor }}>built it</span>
                </h2>
                <p className="mb-8 text-sm leading-relaxed text-gray-500">{project.solution}</p>
                <ul className="flex flex-col gap-4">
                  {project.solutions.map((s, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -16 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: i * 0.06 }}
                      className="flex items-start gap-3"
                    >
                      <span
                        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                        style={{ background: project.accentColor }}
                      >
                        {i + 1}
                      </span>
                      <p className="text-sm leading-relaxed text-gray-600">{s}</p>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Tech stack full list */}
              <div>
                <SectionLabel text="Tech Stack" color={project.accentColor} />
                <h2 className="mb-6 text-2xl font-medium text-gray-900 sm:text-3xl">
                  Built with the <span style={{ color: project.accentColor }}>best tools</span>
                </h2>
                {(["frontend", "backend", "database", "infra", "ai", "mobile"] as const).map(
                  (cat) => {
                    const items = project.techStack.filter((t) => t.category === cat);
                    if (!items.length) return null;
                    return (
                      <div key={cat} className="mb-6">
                        <p className="mb-3 text-[10px] font-black tracking-widest text-gray-400 capitalize uppercase">
                          {cat === "ai" ? "AI / ML" : cat === "infra" ? "Infrastructure" : cat}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {items.map((t) => (
                            <TechBadge key={t.name} name={t.name} category={t.category} size="md" />
                          ))}
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── Results ────────────────────────────────────────────────────────────── */}
      <section className="bg-[#FAFBFD] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <RevealSection>
            <div className="mb-12 text-center">
              <SectionLabel text="Results" color={project.accentColor} />
              <h2 className="text-2xl font-medium text-gray-900 sm:text-3xl">
                Measurable <span style={{ color: project.accentColor }}>impact</span>
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {project.metrics.map((m, i) => (
                <MetricCard
                  key={m.label}
                  value={m.value}
                  label={m.label}
                  suffix={m.suffix}
                  prefix={m.prefix}
                  accentColor={project.accentColor}
                  delay={i * 0.15}
                />
              ))}
            </div>
            <div
              className="mt-10 rounded-2xl border p-6"
              style={{
                borderColor: `${project.accentColor}25`,
                background: `${project.accentColor}08`,
              }}
            >
              <p className="text-sm leading-relaxed text-gray-600">
                <span className="font-bold" style={{ color: project.accentColor }}>
                  Overall Result:
                </span>{" "}
                {project.result}
              </p>
            </div>

            {project.clientReview && (
              <div className="relative mt-6 overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
                <div
                  className="absolute top-0 bottom-0 left-0 w-1.5"
                  style={{ background: project.accentColor }}
                />
                <div className="mb-3 flex items-center gap-2 text-amber-500">
                  {"★".repeat(5)}
                  <span className="ml-2 text-xs font-bold text-slate-700">
                    Verified Client Review
                  </span>
                </div>
                <blockquote className="mb-4 text-sm leading-relaxed text-slate-800 italic sm:text-base">
                  &ldquo;{project.clientReview.quote}&rdquo;
                </blockquote>
                <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="block text-xs font-bold text-slate-900">
                      {project.clientReview.author}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {project.clientReview.role} &bull; {project.clientReview.organization}
                    </span>
                  </div>
                  {project.roiSummary && (
                    <span
                      className="self-start rounded-full px-3 py-1 text-xs font-bold sm:self-auto"
                      style={{ background: `${project.accentColor}15`, color: project.accentColor }}
                    >
                      ROI: {project.roiSummary}
                    </span>
                  )}
                </div>
              </div>
            )}
          </RevealSection>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-24">
        <div className="brand-gradient absolute inset-0 opacity-95" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
            backgroundSize: "52px 52px",
          }}
        />
        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65 }}
          >
            <p className="mb-4 text-sm font-bold tracking-widest text-white/70 uppercase">
              Your product, next
            </p>
            <h2 className="mb-6 text-3xl leading-tight font-medium text-white sm:text-4xl lg:text-5xl">
              Build Your Product With Us.
            </h2>
            <p className="mb-10 text-base leading-relaxed text-white/75">
              We&apos;ve shipped {project.category.toLowerCase()} platforms before. We know the
              pitfalls, the shortcuts that matter, and the patterns that scale. Let&apos;s talk.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
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
                <Link href="/portfolio">See More Portfolio</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <BookConsultationModal isOpen={isBookModalOpen} onClose={() => setIsBookModalOpen(false)} />
    </main>
  );
}
