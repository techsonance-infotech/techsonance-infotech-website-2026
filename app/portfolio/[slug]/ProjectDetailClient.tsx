"use client";
import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import SafeImage from "@/app/components/SafeImage";
import { type Project } from "@/data/projects";
import { TechBadge } from "@/app/components/projects/TechBadge";
import { MetricCard } from "@/app/components/projects/MetricCard";
import { ProjectMockup } from "@/app/components/projects/ProjectMockup";
import BookConsultationModal from "@/app/components/home/BookConsultationModal";
import EmojiOrLucideIcon from "@/app/components/icons/LucideIcon";

// ─── Reveal animation preset ────────────────────────────────────────────────────
function RevealSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
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
    <div className="flex items-center gap-3 mb-6">
      <div className="w-8 h-px" style={{ background: color }} />
      <span className="text-xs font-black uppercase tracking-widest" style={{ color }}>
        {text}
      </span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}

// ─── Image Gallery (screenshots) ───────────────────────────────────────────────
function ScreenshotGallery({
  screenshots,
  accentColor,
}: {
  screenshots: { src: string; caption: string }[];
  accentColor: string;
}) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  return (
    <section className="py-20 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <RevealSection>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-px" style={{ background: accentColor }} />
            <span className="text-xs font-black uppercase tracking-widest" style={{ color: accentColor }}>
              Product Screenshots
            </span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-10">
            See it in <span className="brand-gradient-text">action</span>
          </h2>
        </RevealSection>

        {/* Main active image - no fixed height, let the image define its size */}
        <div
          className="relative w-full rounded-2xl overflow-hidden border border-gray-200 shadow-2xl cursor-zoom-in mb-5"
          onClick={() => setLightbox(true)}
        >
          {/* Browser chrome */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
            <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
            <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
            <span className="w-3 h-3 rounded-full bg-[#28C840]" />
            <div className="flex-1 mx-3 bg-white rounded-md px-3 py-1 text-[10px] text-gray-400 font-mono border border-gray-200">
              freightflow.techsonance.co.in
            </div>
            <span className="text-[10px] text-gray-400 hidden sm:inline">Click to enlarge</span>
          </div>

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
                onClick={(e) => { e.stopPropagation(); setActive(active - 1); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                aria-label="Previous screenshot"
              >
                <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M10 4l-4 4 4 4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
            {active < screenshots.length - 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); setActive(active + 1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                aria-label="Next screenshot"
              >
                <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Caption */}
        <p className="text-sm text-gray-500 text-center mb-6 italic">{screenshots[active].caption}</p>

        {/* Thumbnail strip - fixed height, object-contain so full image is visible */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          {screenshots.map((s, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`relative shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-200 bg-gray-100 ${i === active
                ? "scale-105 shadow-lg"
                : "border-gray-200 opacity-60 hover:opacity-90"
                }`}
              style={i === active ? { borderColor: accentColor } : {}}
              aria-label={`View screenshot ${i + 1}`}
            >
              <div className="w-40 h-24 sm:w-52 sm:h-32 flex items-center justify-center overflow-hidden">
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
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ background: accentColor }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center gap-2 mt-4">
          {screenshots.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className="w-1.5 h-1.5 rounded-full transition-all duration-200"
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
            className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4"
            onClick={() => setLightbox(false)}
          >
            <button
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
              onClick={() => setLightbox(false)}
              aria-label="Close lightbox"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            <motion.div
              initial={{ scale: 0.94 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.94 }}
              className="relative w-full max-w-5xl rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-full aspect-[16/9]">
                <Image
                  src={screenshots[active].src}
                  alt={screenshots[active].caption}
                  fill
                  className="object-contain"
                  sizes="90vw"
                />
              </div>
            </motion.div>

            <p className="text-white/70 text-sm mt-4 text-center italic">
              {screenshots[active].caption}
            </p>

            {/* Lightbox nav */}
            <div className="flex gap-3 mt-4">
              {screenshots.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setActive(i); }}
                  className="w-2 h-2 rounded-full transition-all"
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
    <section className="relative min-h-[80vh] flex items-center overflow-hidden pt-16 pb-12">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute -top-48 -right-48 w-[700px] h-[700px] rounded-full opacity-10 blur-3xl"
          style={{ background: project.accentColor }}
        />
        <div
          className="absolute -bottom-48 -left-48 w-[500px] h-[500px] rounded-full opacity-8 blur-3xl"
          style={{ background: project.accentColor }}
        />
        <div
          className="absolute inset-0 opacity-[0.022]"
          style={{
            backgroundImage: "linear-gradient(#1155CC 1px, transparent 1px), linear-gradient(90deg, #1155CC 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 text-sm text-gray-400 mb-8"
        >
          <Link href="/" className="hover:text-gray-700 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/portfolio" className="hover:text-gray-700 transition-colors">Portfolio</Link>
          <span>/</span>
          <span className="text-gray-700 font-medium">{project.title}</span>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: text */}
          <div className="flex flex-col gap-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="flex flex-wrap gap-2"
            >
              <span
                className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white"
                style={{ background: project.accentColor }}
              >
                {project.category}
              </span>
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-gray-100 text-gray-500">
                {project.industry}
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl sm:text-5xl lg:text-6xl font-medium text-gray-900 leading-[1.06] tracking-tight"
            >
              {project.title}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.16 }}
              className="text-lg text-[#22B6F6] font-semibold italic"
            >
              &ldquo;{project.tagline}&rdquo;
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base text-gray-500 leading-relaxed"
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
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 hover:shadow-xl"
                  style={{
                    background: `linear-gradient(135deg, ${project.accentColor}, ${project.accentColor}cc)`,
                    boxShadow: `0 4px 20px ${project.accentColor}30`,
                  }}
                >
                  <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 2H2v12h12v-4M10 2h4v4M6 10L14 2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  View Live Product
                </a>
              )}
              <Link
                href="/portfolio"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:border-gray-400 hover:text-gray-900 transition-all"
              >
                ← Portfolio
              </Link>
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

  return (
    <main className="overflow-x-clip">
      {/* Hero */}
      <ProjectHero project={project} />

      {/* ── Screenshots Gallery (only if screenshots exist) ─────────────────────── */}
      {project.screenshots && project.screenshots.length > 0 && (
        <ScreenshotGallery
          screenshots={project.screenshots}
          accentColor={project.accentColor}
        />
      )}

      {/* ── Challenges ────────────────────────────────────────────────────────── */}
      <section className="bg-[#FAFBFD] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealSection>
            <SectionLabel text="Challenges" color={project.accentColor} />
            <h2 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-10">
              Problems we <span style={{ color: project.accentColor }}>solved</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {project.challenges.map((c, i) => (
                <motion.div
                  key={c.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-8%" }}
                  transition={{ duration: 0.55, delay: i * 0.1, ease: "easeOut" }}
                  className="flex flex-col gap-4 p-6 rounded-2xl bg-white border border-gray-100 shadow-[0_2px_16px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300"
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl"
                    style={{ background: `${project.accentColor}12`, color: project.accentColor }}
                  >
                    <EmojiOrLucideIcon icon={c.icon} className="w-5 h-5" />
                  </div>
                  <h3 className="font-medium text-gray-900">{c.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{c.description}</p>
                </motion.div>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── Solutions ──────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealSection>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              <div>
                <SectionLabel text="Solutions" color={project.accentColor} />
                <h2 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-6">
                  How we <span style={{ color: project.accentColor }}>built it</span>
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed mb-8">
                  {project.solution}
                </p>
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
                        className="mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                        style={{ background: project.accentColor }}
                      >
                        {i + 1}
                      </span>
                      <p className="text-sm text-gray-600 leading-relaxed">{s}</p>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Tech stack full list */}
              <div>
                <SectionLabel text="Tech Stack" color={project.accentColor} />
                <h2 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-6">
                  Built with the <span style={{ color: project.accentColor }}>best tools</span>
                </h2>
                {(["frontend", "backend", "database", "infra", "ai", "mobile"] as const).map((cat) => {
                  const items = project.techStack.filter((t) => t.category === cat);
                  if (!items.length) return null;
                  return (
                    <div key={cat} className="mb-6">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 capitalize">
                        {cat === "ai" ? "AI / ML" : cat === "infra" ? "Infrastructure" : cat}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {items.map((t) => (
                          <TechBadge key={t.name} name={t.name} category={t.category} size="md" />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── Results ────────────────────────────────────────────────────────────── */}
      <section className="bg-[#FAFBFD] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealSection>
            <div className="text-center mb-12">
              <SectionLabel text="Results" color={project.accentColor} />
              <h2 className="text-2xl sm:text-3xl font-medium text-gray-900">
                Measurable <span style={{ color: project.accentColor }}>impact</span>
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
              className="mt-10 p-6 rounded-2xl border"
              style={{ borderColor: `${project.accentColor}25`, background: `${project.accentColor}08` }}
            >
              <p className="text-sm text-gray-600 leading-relaxed">
                <span className="font-bold" style={{ color: project.accentColor }}>Overall Result:</span>{" "}
                {project.result}
              </p>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────────────── */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 brand-gradient opacity-95" />
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
          backgroundSize: "52px 52px",
        }} />
        <div className="relative z-10 max-w-3xl mx-auto text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65 }}
          >
            <p className="text-white/70 text-sm font-bold uppercase tracking-widest mb-4">
              Your product, next
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-white mb-6 leading-tight">
              Build Your Product With Us.
            </h2>
            <p className="text-white/75 text-base mb-10 leading-relaxed">
              We&apos;ve shipped {project.category.toLowerCase()} platforms before. We know the
              pitfalls, the shortcuts that matter, and the patterns that scale. Let&apos;s talk.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setIsBookModalOpen(true)}
                className="px-8 py-4 rounded-xl bg-white text-[#1155CC] font-bold text-sm hover:bg-gray-50 transition-colors shadow-xl cursor-pointer"
              >
                Book Free Consultation
              </button>
              <Link
                href="/portfolio"
                className="px-8 py-4 rounded-xl border-2 border-white/30 text-white font-bold text-sm hover:bg-white/10 transition-colors"
              >
                See More Portfolio
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <BookConsultationModal isOpen={isBookModalOpen} onClose={() => setIsBookModalOpen(false)} />
    </main>
  );
}
