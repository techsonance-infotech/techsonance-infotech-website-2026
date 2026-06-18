"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useSpring, useInView, AnimatePresence } from "framer-motion";
import SiteHeader from "@/app/components/home/SiteHeader";
import SiteFooter from "@/app/components/home/SiteFooter";
import AboutHero from "@/app/components/about/AboutHero";
import { projects } from "@/data/projects";
import BookConsultationModal from "@/app/components/home/BookConsultationModal";

// Helper components for Section 2 Count-up
function CountUp({ value, suffix = "", delay = 0 }: { value: number; suffix?: string; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (isInView) {
      const start = 0;
      const duration = 2000;
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOutQuad = progress * (2 - progress);
        setCount(Math.floor(easeOutQuad * value));

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setCount(value);
        }
      };

      const timeout = setTimeout(() => {
        requestAnimationFrame(animate);
      }, delay * 1000);

      return () => clearTimeout(timeout);
    }
  }, [isInView, value, delay]);

  return <span ref={ref}>{count}{suffix}</span>;
}

// 3D Tilt Card Helper for Section 3
function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glowStyle, setGlowStyle] = useState<React.CSSProperties>({});

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate rotation from center
    const rX = ((mouseY - height / 2) / (height / 2)) * -12; // max 12deg
    const rY = ((mouseX - width / 2) / (width / 2)) * 12;

    setRotateX(rX);
    setRotateY(rY);

    setGlowStyle({
      background: `radial-gradient(circle 220px at ${mouseX}px ${mouseY}px, rgba(17, 85, 204, 0.12), transparent)`,
    });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlowStyle({});
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`transition-all duration-200 ease-out select-none cursor-pointer relative overflow-hidden ${className}`}
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transformStyle: "preserve-3d",
      }}
    >
      <div className="absolute inset-0 pointer-events-none" style={glowStyle} />
      <div style={{ transform: "translateZ(30px)" }}>{children}</div>
    </div>
  );
}

// Interactive Magnetic Button for CTA
interface MagneticButtonProps {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

function MagneticButton({ href, onClick, children, className = "" }: MagneticButtonProps) {
  const btnRef = useRef<HTMLElement>(null);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!btnRef.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = btnRef.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const distanceX = clientX - centerX;
    const distanceY = clientY - centerY;

    // Move button 35% of the mouse distance
    setX(distanceX * 0.35);
    setY(distanceY * 0.35);
  };

  const handleMouseLeave = () => {
    setX(0);
    setY(0);
  };

  if (onClick) {
    return (
      <motion.button
        ref={btnRef as React.RefObject<HTMLButtonElement>}
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        animate={{ x, y }}
        transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
        className={`inline-block cursor-pointer ${className}`}
      >
        {children}
      </motion.button>
    );
  }

  return (
    <motion.a
      ref={btnRef as React.RefObject<HTMLAnchorElement>}
      href={href}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x, y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      className={`inline-block ${className}`}
    >
      {children}
    </motion.a>
  );
}

export default function AboutClient() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  // Section 4 horizontal scroll tracking
  const horizontalSectionRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollRange, setScrollRange] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const { scrollYProgress: horizontalScroll } = useScroll({
    target: horizontalSectionRef,
    offset: ["start start", "end end"]
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

  // Section 5 timeline progress tracking
  const timelineSectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: timelineScroll } = useScroll({
    target: timelineSectionRef,
    offset: ["start center", "end center"],
  });
  const timelineProgressHeight = useTransform(timelineScroll, [0, 1], ["0%", "100%"]);

  // Track active timeline step
  const [activeStep, setActiveStep] = useState(0);
  const stepRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];

  // Tech network state (hover relations)
  const [hoveredTech, setHoveredTech] = useState<string | null>(null);

  return (
    <>
      <SiteHeader transparent={false} />
      <main className="bg-[#FAFBFD] min-h-screen relative overflow-x-clip font-sans text-slate-900">

      {/* =========================================================================
          SECTION 1 — HERO
          ========================================================================= */}
      <AboutHero />

      {/* =========================================================================
          SECTION 2 — COMPANY IMPACT METRICS (DARK)
          ========================================================================= */}
      <section className="relative py-24 bg-[#050B14] text-white overflow-hidden border-t border-slate-900">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />

        {/* Expanding glows */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-[#1155CC]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-[#22B6F6]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-4 text-center">
            {[
              { val: 4, suffix: "+", label: "Years Experience" },
              { val: 15, suffix: "+", label: "Products Delivered" },
              { val: 100, suffix: "K+", label: "Lines of Code" },
              { val: 5, suffix: "+", label: "Industries Served" },
              { val: 99.9, suffix: "%", label: "Uptime Delivered" }
            ].map((stat, i) => (
              <div key={stat.label} className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] backdrop-blur-sm">
                <div className="text-4xl sm:text-5xl font-black text-white mb-2 font-mono">
                  <CountUp value={stat.val} suffix={stat.suffix} delay={i * 0.15} />
                </div>
                <div className="text-[11px] sm:text-xs font-semibold text-slate-400 tracking-wider uppercase">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3 — ENGINEERING DNA (LIGHT)
          ========================================================================= */}
      <section className="py-24 bg-white border-b border-slate-100 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#1155CC] mb-3">Our Principles</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Our Engineering DNA</h3>
            <p className="text-slate-500 text-sm mt-3 font-medium">We replace standard vision cards with execution directives that actually shape the code we ship.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Architecture First",
                desc: "We design highly-decoupled, modular microservices and state architectures from day one. Zero architectural shortcuts.",
                icon: "schema"
              },
              {
                title: "Automation by Default",
                desc: "Every build, pipeline, deployment, and testing run is automated. Humans think; machines compile and deliver.",
                icon: "auto"
              },
              {
                title: "Performance Obsessed",
                desc: "We track load bounds, query times, and bundle weights to guarantee sub-100ms API responses and stellar Lighthouse scores.",
                icon: "speed"
              },
              {
                title: "Production Ready",
                desc: "Type-safety, row-level security audits, integration monitors, and continuous automated backup verification are non-negotiable.",
                icon: "shield"
              }
            ].map((dna) => (
              <TiltCard key={dna.title} className="bg-[#FAFBFD] border border-slate-100 rounded-3xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.015)] hover:border-blue-100 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 text-[#1155CC] flex items-center justify-center mb-6 shadow-sm">
                  {dna.icon === "schema" && (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.75a2.25 2.25 0 002.25-2.25V5.25A2.25 2.25 0 0018 3H6A2.25 2.25 0 003.75 5.25V16.5A2.25 2.25 0 006 18.75h12zm0 0v1.5a2.25 2.25 0 01-2.25 2.25H8.25A2.25 2.25 0 016 20.25v-1.5m12 0h-12" /></svg>
                  )}
                  {dna.icon === "auto" && (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
                  )}
                  {dna.icon === "speed" && (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  )}
                  {dna.icon === "shield" && (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                  )}
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-3">{dna.title}</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">{dna.desc}</p>
              </TiltCard>
            ))}
          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 4 — WHAT WE'VE BUILT (DARK HORIZONTAL SCROLL)
          ========================================================================= */}
      <section
        ref={horizontalSectionRef}
        className={isMobile ? "relative py-16 bg-[#020617] text-white" : "relative h-[250vh] bg-[#020617] text-white"}
      >
        <div className={isMobile ? "w-full flex flex-col justify-center" : "sticky top-0 h-screen flex flex-col justify-center overflow-hidden"}>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mb-8 relative z-20">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#22B6F6] mb-2">Portfolio Showcase</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">What We&apos;ve Built</h3>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 font-medium">Production-grade systems running live for scaling organizations.</p>
          </div>

          <motion.div
            ref={scrollRef}
            style={isMobile ? { x: 0 } : { x: horizontalX }}
            className={isMobile ? "w-full flex flex-row overflow-x-auto gap-6 px-6 pb-4 scrollbar-none snap-x snap-mandatory relative z-10" : "w-max flex gap-8 px-12 md:px-24 relative z-10"}
          >
            {projects.map((proj, idx) => (
              <div
                key={proj.title}
                className={isMobile ? "w-[85vw] max-w-[340px] snap-center shrink-0 bg-slate-900/50 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between" : "w-[80vw] max-w-[550px] shrink-0 bg-slate-900/50 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between"}
              >
                <div>
                  <div className="relative overflow-hidden rounded-2xl border border-slate-800 aspect-[16/10] w-full mb-6 group"
                    style={{ background: proj.screenshotPath ? undefined : proj.mockupGradient }}>
                    {proj.screenshotPath ? (
                      <img
                        src={proj.screenshotPath}
                        alt={proj.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-2xl text-white">
                        {proj.title.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <h4 className="text-xl font-bold text-white">{proj.title}</h4>
                    <span className="text-[10px] font-bold text-[#22B6F6] uppercase tracking-wider bg-[#22B6F6]/10 px-2.5 py-1 rounded-full">
                      {proj.industry}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed mb-4">{proj.shortDescription}</p>
                </div>

                <div className="border-t border-slate-800/80 pt-4 mt-auto">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {proj.techStack.slice(0, 3).map((t) => (
                      <span key={t.name} className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-1 rounded">
                        {t.name}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-[#10B981] font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] shrink-0" />
                    Outcome: {proj.result}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 5 — ENGINEERING PROCESS TIMELINE (LIGHT STICKY)
          ========================================================================= */}
      <section ref={timelineSectionRef} className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#1155CC] mb-2">Our Pipeline</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">How We Build</h3>
            <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">A reliable software lifecycle backed by engineering protocols.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start relative">

            {/* Left Side: Steps (Scrolling) */}
            <div className="lg:col-span-7 space-y-16 relative">
              {/* Progress Tracker line */}
              <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-slate-100 pointer-events-none">
                <motion.div style={{ height: timelineProgressHeight }} className="w-full bg-[#1155CC] origin-top" />
              </div>

              {[
                {
                  step: "01",
                  title: "Discovery & Map",
                  tag: "Operations Audit",
                  desc: "We analyze your tech logs, user workflows, database schema limits, and operational bottlenecks. We output a clean scope list and data architecture proposal."
                },
                {
                  step: "02",
                  title: "Architecture Design",
                  tag: "Blueprint Stage",
                  desc: "We write clean schema layouts, API interface definitions, and data contracts. We finalize system integration interfaces before writing code."
                },
                {
                  step: "03",
                  title: "Sprints & Slicing",
                  tag: "Implementation Sprints",
                  desc: "We work in weekly dev cycles, pushing fully functional updates to staging endpoints. We back code with strict TypeScript and rigorous linting."
                },
                {
                  step: "04",
                  title: "Hardening & Test Runs",
                  tag: "Systems Verification",
                  desc: "We run automated load tests, DB index checks, and API stress queries. We execute row-level protection tests to verify system safety."
                },
                {
                  step: "05",
                  title: "DevOps Orchestration",
                  tag: "Safe Release",
                  desc: "We build deployment charts, container configs, and zero-downtime deployment pipelines. We map health monitors for early issue detection."
                },
                {
                  step: "06",
                  title: "Continuous Telemetry",
                  tag: "Long-term Support",
                  desc: "We monitor errors, latency counts, and cloud resources. We continually adapt the system to matching hardware scales and version updates."
                }
              ].map((step, idx) => (
                <motion.div
                  key={step.step}
                  ref={stepRefs[idx]}
                  onViewportEnter={() => setActiveStep(idx)}
                  viewport={{ margin: "-20% 0px -60% 0px" }}
                  className="flex items-start gap-8 pl-12 relative"
                >
                  {/* Step Bubble */}
                  <div className={`absolute left-2.5 top-0 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center border font-mono text-[10px] font-bold transition-all duration-300 z-10 ${activeStep === idx
                    ? "bg-[#1155CC] text-white border-[#1155CC]"
                    : activeStep > idx
                      ? "bg-[#1155CC]/10 text-[#1155CC] border-[#1155CC]"
                      : "bg-white text-slate-400 border-slate-200"
                    }`}>
                    {step.step}
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-[#1155CC] uppercase tracking-wider">
                      {step.tag}
                    </span>
                    <h4 className="text-xl font-bold text-gray-900 mt-1 mb-3">{step.title}</h4>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-xl">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Right Side: Sticky Visuals */}
            <div className="hidden lg:block lg:col-span-5 sticky top-32 h-[400px] bg-[#0A1120] border border-slate-800 rounded-3xl p-6 overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#1155CC]/15 rounded-full blur-2xl pointer-events-none" />

              <div className="h-full flex flex-col justify-between relative z-10 text-white">
                <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
                  <span className="text-[10px] text-slate-500 font-mono">STEP_INDEX: 0{activeStep + 1}</span>
                  <span className="text-[10px] text-emerald-400 font-mono">STATUS: ACTIVE</span>
                </div>

                <div className="flex-1 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    {activeStep === 0 && (
                      <motion.div
                        key="0"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="text-center"
                      >
                        <svg className="w-16 h-16 mx-auto text-[#22B6F6] mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                        <h5 className="font-bold text-sm">Auditing Operational Pipelines</h5>
                        <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] mx-auto">Mapping legacy databases and structural dependencies.</p>
                      </motion.div>
                    )}
                    {activeStep === 1 && (
                      <motion.div
                        key="1"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="text-center"
                      >
                        <svg className="w-16 h-16 mx-auto text-[#1155CC] mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9s2.015-9 4.5-9y" /></svg>
                        <h5 className="font-bold text-sm">System Database Modeling</h5>
                        <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] mx-auto">Drafting API schemas and entity relationships.</p>
                      </motion.div>
                    )}
                    {activeStep === 2 && (
                      <motion.div
                        key="2"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="w-full text-left font-mono text-[9px] text-slate-400 bg-slate-950 p-4 rounded-xl border border-slate-800"
                      >
                        <div className="text-emerald-400"># Git Commit Sprints</div>
                        <div>const buildRoute = async () =&gt; &#123;</div>
                        <div className="pl-3">const isTypeSafe = await verifyTypeScript();</div>
                        <div className="pl-3 text-blue-400">const latency = await measureLatency();</div>
                        <div className="pl-3">return isTypeSafe &amp;&amp; latency &lt; 100;</div>
                        <div>&#125;</div>
                      </motion.div>
                    )}
                    {activeStep === 3 && (
                      <motion.div
                        key="3"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="text-center"
                      >
                        <svg className="w-16 h-16 mx-auto text-[#10B981] mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                        <h5 className="font-bold text-sm">Testing Complete: 100% Passed</h5>
                        <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] mx-auto">Row-level security check complete. Zero memory leaks.</p>
                      </motion.div>
                    )}
                    {activeStep === 4 && (
                      <motion.div
                        key="4"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="text-center"
                      >
                        <svg className="w-16 h-16 mx-auto text-[#EC4899] mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9s2.015-9 4.5-9y" /></svg>
                        <h5 className="font-bold text-sm">Safe Container Deployment</h5>
                        <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] mx-auto">Automated build successful. CDN edge synchronized.</p>
                      </motion.div>
                    )}
                    {activeStep === 5 && (
                      <motion.div
                        key="5"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="text-center"
                      >
                        <svg className="w-16 h-16 mx-auto text-[#22B6F6] mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" /></svg>
                        <h5 className="font-bold text-sm">Telemetry Monitoring Live</h5>
                        <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] mx-auto">Tracking live response graphs, DB locks & RAM usage.</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                  <span>Engine: Turborepo</span>
                  <span>Runner: Vercel / AWS</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6 — TECHNOLOGY ECOSYSTEM (DARK INTERACTIVE NETWORK)
          ========================================================================= */}
      <section className="relative py-24 bg-[#050B14] text-white overflow-hidden border-t border-slate-900">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#22B6F6] mb-2">Ecosystem Web</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Technology Ecosystem</h3>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 font-medium">Hover over nodes to trace structural connections and data routing pipelines.</p>
          </div>

          <div className="relative flex justify-center items-center h-[420px] bg-slate-950/40 rounded-3xl border border-slate-900 p-4">

            {/* SVG Connecting Paths */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {[
                { from: "next", to: "react" },
                { from: "react", to: "node" },
                { from: "node", to: "postgres" },
                { from: "node", to: "docker" },
                { from: "node", to: "aws" },
                { from: "node", to: "openai" },
                { from: "openai", to: "langchain" },
                { from: "node", to: "n8n" },
                { from: "n8n", to: "openai" }
              ].map((link, idx) => {
                // Positions mapping
                const pos: Record<string, { x: number; y: number }> = {
                  next: { x: 20, y: 30 },
                  react: { x: 30, y: 70 },
                  node: { x: 50, y: 50 },
                  postgres: { x: 70, y: 80 },
                  docker: { x: 70, y: 20 },
                  aws: { x: 90, y: 40 },
                  openai: { x: 45, y: 15 },
                  langchain: { x: 25, y: 10 },
                  n8n: { x: 85, y: 70 }
                };

                const fromPt = pos[link.from];
                const toPt = pos[link.to];

                const isHighlighted = hoveredTech === link.from || hoveredTech === link.to;

                return (
                  <motion.line
                    key={idx}
                    x1={`${fromPt.x}%`}
                    y1={`${fromPt.y}%`}
                    x2={`${toPt.x}%`}
                    y2={`${toPt.y}%`}
                    stroke={isHighlighted ? "#2563EB" : "#1E293B"}
                    strokeWidth={isHighlighted ? 2 : 1}
                    className="transition-colors duration-200"
                  />
                );
              })}
            </svg>

            {/* Nodes */}
            {[
              { id: "next", name: "Next.js", desc: "SSR & Web Apps", x: "20%", y: "30%" },
              { id: "react", name: "React", desc: "User Interface", x: "30%", y: "70%" },
              { id: "node", name: "Node.js", desc: "Backend Engine", x: "50%", y: "50%", primary: true },
              { id: "postgres", name: "PostgreSQL", desc: "Relational DB", x: "70%", y: "80%" },
              { id: "docker", name: "Docker", desc: "Dev Container", x: "70%", y: "20%" },
              { id: "aws", name: "AWS", desc: "Cloud Scaling", x: "90%", y: "40%" },
              { id: "openai", name: "OpenAI", desc: "LLM Intelligence", x: "45%", y: "15%" },
              { id: "langchain", name: "LangChain", desc: "Agent Workflows", x: "25%", y: "10%" },
              { id: "n8n", name: "n8n", desc: "Visual Workflows", x: "85%", y: "70%" }
            ].map((node) => (
              <div
                key={node.id}
                onMouseEnter={() => setHoveredTech(node.id)}
                onMouseLeave={() => setHoveredTech(null)}
                className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer p-3 rounded-xl border transition-all duration-200 select-none ${node.primary
                  ? "bg-[#1155CC] border-[#2563EB] shadow-lg shadow-[#1155CC]/20 z-10"
                  : hoveredTech === node.id
                    ? "bg-slate-800 border-blue-500 shadow-md z-10"
                    : "bg-slate-900/80 border-slate-800/80"
                  }`}
                style={{ left: node.x, top: node.y }}
              >
                <h5 className="text-[10px] font-bold tracking-wide text-white">{node.name}</h5>
                <p className="text-[8px] text-slate-400 font-mono mt-0.5 whitespace-nowrap">{node.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 7 — FOUNDER STORY (LIGHT SPLIT)
          ========================================================================= */}
      <section className="py-24 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

            {/* Left Column: Image in Circle + Statistics Card */}
            <div className="lg:col-span-4 relative flex flex-col items-center pt-20">
              {/* Outer Card Container */}
              <div className="w-full bg-gradient-to-b from-[#F8FAFC] to-[#EFF6FF] border border-blue-100/60 rounded-[32px] p-6 pt-28 shadow-[0_12px_40px_rgba(17,85,204,0.03)] relative flex flex-col items-center text-center">
                
                {/* Circular Image positioned on the upper side, offset upwards */}
                <div className="absolute -top-22 left-1/2 -translate-x-1/2 w-44 h-44 rounded-full border-4 border-white shadow-[0_8px_25px_rgba(17,85,204,0.08)] overflow-hidden bg-slate-50 group">
                  <img
                    src="/images/about-headshot-v2.png"
                    alt="Someshwari Adeya Founder"
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                </div>

                {/* Statistics Grid */}
                <div className="w-full border-t border-blue-100/50 pt-5 grid grid-cols-2 gap-4 text-left">
                  <div className="border-r border-blue-100/80 pr-2">
                    <h5 className="text-lg font-extrabold text-[#1155CC]">10+</h5>
                    <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider mt-1 leading-snug">Engineers & Designers</p>
                  </div>
                  <div className="pl-2">
                    <h5 className="text-lg font-extrabold text-slate-800">90%+</h5>
                    <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider mt-1 leading-snug">Client Retention Rate</p>
                  </div>
                  <div className="border-t border-r border-blue-100/80 pt-3 pr-2">
                    <h5 className="text-lg font-extrabold text-slate-800">98%</h5>
                    <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider mt-1 leading-snug">On-Time Delivery</p>
                  </div>
                  <div className="border-t border-blue-100/80 pt-3 pl-2">
                    <h5 className="text-lg font-extrabold text-slate-800">&lt; 2h</h5>
                    <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider mt-1 leading-snug">Support Response Time</p>
                  </div>
                </div>

              </div>
            </div>

            {/* Right Column: Founder Narrative */}
            <div className="lg:col-span-8 text-left">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#1155CC]">Our Story</span>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mt-1 mb-6">
                Built by Engineers. <br />
                Focused on Business Impact.
              </h3>

              <div className="space-y-4 text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                <p>
                  At TechSonance, we started as software engineers who wanted to build code that directly improved business outcomes. We saw that legacy platforms were often built on generic templates, slow database configurations, and rigid structures that didn&apos;t adapt to real operational workflows.
                </p>
                <p>
                  We built our agency to do the opposite: to deliver custom database design, automated pipeline runs, type-safe API routers, and clean interfaces that feel modern and scale seamlessly.
                </p>
                <p>
                  Today, we collaborate directly with tech leadership and company founders, taking ownership of development complexity so you can focus on scale.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Someshwari Adeya</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Founder & CEO, TechSonance</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 8 — TRUST & CREDIBILITY (MODERN BENTO GRID)
          ========================================================================= */}
      <section className="py-24 bg-[#FAFBFD]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#1155CC] mb-2">Systems Trust</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Trust & Credibility</h3>
            <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">Measurable reliability indicators supporting our operations.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Box 1 */}
            <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm flex flex-col justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1155CC] flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-9h1.5m-1.5 3h1.5m-1.5 3h1.5M9 16.5h1.5m3 0h1.5" /></svg>
              </div>
              <div>
                <h4 className="font-bold text-sm text-gray-900 mb-1">5+ Industries Served</h4>
                <p className="text-[11px] text-slate-400 font-medium">Logistics, Retail, FinTech, E-Commerce, and SaaS.</p>
              </div>
            </div>

            {/* Box 2 */}
            <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm flex flex-col justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1155CC] flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <h4 className="font-bold text-sm text-gray-900 mb-1">98% On-Time Sprints</h4>
                <p className="text-[11px] text-slate-400 font-medium">Rigorous sprint planning ensures features are delivered on schedule.</p>
              </div>
            </div>

            {/* Box 3 */}
            <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm flex flex-col justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1155CC] flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <h4 className="font-bold text-sm text-gray-900 mb-1">&lt; 2-Hour SLA Response</h4>
                <p className="text-[11px] text-slate-400 font-medium">Active telemetry reports trigger instant response protocols from senior engineers.</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 9 — PREMIUM CTA (DARK)
          ========================================================================= */}
      <section className="relative py-28 bg-[#050B14] text-white overflow-hidden border-t border-slate-900">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

        {/* Glowing background gradient mesh */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-[#1155CC]/20 to-[#22B6F6]/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight max-w-2xl mx-auto tracking-tight">
              Ready to Build Something That Moves Your Business Forward?
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mb-10 leading-relaxed max-w-xl mx-auto">
              From custom database engineering to intelligent workflow automation, we take ownership of backend complexity so you can focus on business growth.
            </p>

            <MagneticButton onClick={() => setIsBookModalOpen(true)} className="shadow-[0_4px_30px_rgba(17, 85, 204,0.3)]">
              <span className="px-8 py-4 rounded-xl bg-white text-[#1155CC] font-bold text-sm hover:bg-slate-50 transition-colors inline-block">
                Book a Strategy Call
              </span>
            </MagneticButton>
          </motion.div>
        </div>
      </section>

      <SiteFooter />
    </main>

    <BookConsultationModal isOpen={isBookModalOpen} onClose={() => setIsBookModalOpen(false)} />
  </>
  );
}
