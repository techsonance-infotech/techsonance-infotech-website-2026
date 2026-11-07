"use client";

import React, { useRef, useState } from "react";
import { m, useScroll, useTransform, AnimatePresence } from "motion/react";

const STEPS = [
  {
    step: "01",
    title: "Discovery & Map",
    tag: "Operations Audit",
    desc: "We analyze your tech logs, user workflows, database schema limits, and operational bottlenecks. We output a clean scope list and data architecture proposal.",
  },
  {
    step: "02",
    title: "Architecture Design",
    tag: "Blueprint Stage",
    desc: "We write clean schema layouts, API interface definitions, and data contracts. We finalize system integration interfaces before writing code.",
  },
  {
    step: "03",
    title: "Sprints & Slicing",
    tag: "Implementation Sprints",
    desc: "We work in weekly dev cycles, pushing fully functional updates to staging endpoints. We back code with strict TypeScript and rigorous linting.",
  },
  {
    step: "04",
    title: "Hardening & Test Runs",
    tag: "Systems Verification",
    desc: "We run automated load tests, DB index checks, and API stress queries. We execute row-level protection tests to verify system safety.",
  },
  {
    step: "05",
    title: "DevOps Orchestration",
    tag: "Safe Release",
    desc: "We build deployment charts, container configs, and zero-downtime deployment pipelines. We map health monitors for early issue detection.",
  },
  {
    step: "06",
    title: "Continuous Telemetry",
    tag: "Long-term Support",
    desc: "We monitor errors, latency counts, and cloud resources. We continually adapt the system to matching hardware scales and version updates.",
  },
];

export function AboutProcessTimeline() {
  const timelineSectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: timelineScroll } = useScroll({
    target: timelineSectionRef,
    offset: ["start center", "end center"],
  });
  const timelineProgressHeight = useTransform(timelineScroll, [0, 1], ["0%", "100%"]);

  const [activeStep, setActiveStep] = useState(0);

  return (
    <section ref={timelineSectionRef} className="relative bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-2 text-xs font-bold tracking-widest text-[#1155CC] uppercase">
            Our Pipeline
          </h2>
          <h3 className="text-3xl font-medium tracking-tight text-gray-900 sm:text-4xl">
            How We Build
          </h3>
          <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
            A reliable software lifecycle backed by engineering protocols.
          </p>
        </div>

        <div className="relative grid grid-cols-1 items-start gap-12 lg:grid-cols-12">
          {/* Left Side: Steps (Scrolling) */}
          <div className="relative space-y-16 lg:col-span-7">
            {/* Progress Tracker line */}
            <div className="pointer-events-none absolute top-4 bottom-4 left-6 w-0.5 bg-slate-100">
              <m.div
                style={{ height: timelineProgressHeight }}
                className="w-full origin-top bg-[#1155CC]"
              />
            </div>

            {STEPS.map((step, idx) => (
              <m.div
                key={step.step}
                onViewportEnter={() => setActiveStep(idx)}
                viewport={{ margin: "-20% 0px -60% 0px" }}
                className="relative flex items-start gap-8 pl-12"
              >
                {/* Step Bubble */}
                <div
                  className={`absolute top-0 left-2.5 z-10 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full border font-mono text-[10px] font-bold transition-all duration-300 ${
                    activeStep === idx
                      ? "bg-[#1155CC] text-white border-[#1155CC]"
                      : activeStep > idx
                        ? "bg-[#1155CC]/10 text-[#1155CC] border-[#1155CC]"
                        : "bg-white text-slate-400 border-slate-200"
                  }`}
                >
                  {step.step}
                </div>

                <div>
                  <span className="text-[10px] font-bold tracking-wider text-[#1155CC] uppercase">
                    {step.tag}
                  </span>
                  <h4 className="mt-1 mb-3 text-xl font-bold text-gray-900">{step.title}</h4>
                  <p className="max-w-xl text-xs leading-relaxed font-medium text-slate-500 sm:text-sm">
                    {step.desc}
                  </p>
                </div>
              </m.div>
            ))}
          </div>

          {/* Right Side: Sticky Visuals */}
          <div className="sticky top-32 hidden h-[400px] overflow-hidden rounded-3xl border border-slate-800 bg-[#0A1120] p-6 lg:col-span-5 lg:block">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:30px_30px]" />
            <div className="pointer-events-none absolute top-0 right-0 h-32 w-32 rounded-full bg-[#1155CC]/15 blur-2xl" />

            <div className="relative z-10 flex h-full flex-col justify-between text-white">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="font-mono text-[10px] text-slate-500">
                  STEP_INDEX: 0{activeStep + 1}
                </span>
                <span className="font-mono text-[10px] text-emerald-400">STATUS: ACTIVE</span>
              </div>

              <div className="flex flex-1 items-center justify-center">
                <AnimatePresence mode="wait">
                  {activeStep === 0 && (
                    <m.div
                      key="0"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="text-center"
                    >
                      <svg
                        className="mx-auto mb-4 h-16 w-16 text-[#22B6F6]"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                        />
                      </svg>
                      <h5 className="text-sm font-bold">Auditing Operational Pipelines</h5>
                      <p className="mx-auto mt-1 max-w-[200px] text-[10px] text-slate-400">
                        Mapping legacy databases and structural dependencies.
                      </p>
                    </m.div>
                  )}
                  {activeStep === 1 && (
                    <m.div
                      key="1"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="text-center"
                    >
                      <svg
                        className="mx-auto mb-4 h-16 w-16 text-[#1155CC]"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9s2.015-9 4.5-9y"
                        />
                      </svg>
                      <h5 className="text-sm font-bold">System Database Modeling</h5>
                      <p className="mx-auto mt-1 max-w-[200px] text-[10px] text-slate-400">
                        Drafting API schemas and entity relationships.
                      </p>
                    </m.div>
                  )}
                  {activeStep === 2 && (
                    <m.div
                      key="2"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 p-4 text-left font-mono text-[9px] text-slate-400"
                    >
                      <div className="text-emerald-400"># Git Commit Sprints</div>
                      <div>const buildRoute = async () =&gt; &#123;</div>
                      <div className="pl-3">const isTypeSafe = await verifyTypeScript();</div>
                      <div className="pl-3 text-blue-400">
                        const latency = await measureLatency();
                      </div>
                      <div className="pl-3">return isTypeSafe &amp;&amp; latency &lt; 100;</div>
                      <div>&#125;</div>
                    </m.div>
                  )}
                  {activeStep === 3 && (
                    <m.div
                      key="3"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="text-center"
                    >
                      <svg
                        className="mx-auto mb-4 h-16 w-16 text-[#10B981]"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                        />
                      </svg>
                      <h5 className="text-sm font-bold">Testing Complete: 100% Passed</h5>
                      <p className="mx-auto mt-1 max-w-[200px] text-[10px] text-slate-400">
                        Row-level security check complete. Zero memory leaks.
                      </p>
                    </m.div>
                  )}
                  {activeStep === 4 && (
                    <m.div
                      key="4"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="text-center"
                    >
                      <svg
                        className="mx-auto mb-4 h-16 w-16 text-[#EC4899]"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9s2.015-9 4.5-9y"
                        />
                      </svg>
                      <h5 className="text-sm font-bold">Safe Container Deployment</h5>
                      <p className="mx-auto mt-1 max-w-[200px] text-[10px] text-slate-400">
                        Automated build successful. CDN edge synchronized.
                      </p>
                    </m.div>
                  )}
                  {activeStep === 5 && (
                    <m.div
                      key="5"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="text-center"
                    >
                      <svg
                        className="mx-auto mb-4 h-16 w-16 text-[#22B6F6]"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z"
                        />
                      </svg>
                      <h5 className="text-sm font-bold">Telemetry Monitoring Live</h5>
                      <p className="mx-auto mt-1 max-w-[200px] text-[10px] text-slate-400">
                        Tracking live response graphs, DB locks & RAM usage.
                      </p>
                    </m.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center justify-between font-mono text-[10px] text-slate-500">
                <span>Engine: Turborepo</span>
                <span>Runner: Vercel / AWS</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
