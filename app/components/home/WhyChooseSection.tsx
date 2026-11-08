"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { IconName } from "@/app/components/icons/Icon";
import { Icon } from "@/app/components/icons/Icon";

export type LayerInfo = {
  title: string;
  icon: IconName;
  gradientClass: string;
};

export type WhyItem = {
  number: string;
  icon: IconName;
  title: string;
  description: string;
  body: string;
  bullets: string[];
  callout: string;
  layers: LayerInfo[];
};

export const whyItems: WhyItem[] = [
  {
    number: "01",
    icon: "brain",
    title: "AI-Native Solutions",
    description: "Built with intelligence from the ground up",
    body: "We integrate artificial intelligence into the core of your applications. From intelligent automation to predictive analytics and advanced RAG pipelines, we build systems that learn and adapt.",
    bullets: [
      "Custom LLM Integration & Fine-tuning",
      "Advanced Retrieval-Augmented Generation (RAG)",
      "Automated Workflow & Agentic Systems",
    ],
    callout:
      "We build systems that think. By embedding agentic intelligence at the core, we turn standard software into an active growth driver.",
    layers: [
      { title: "Agentic Workflows", icon: "brain", gradientClass: "from-[#8B5CF6] to-[#6366F1]" },
      { title: "LLM Fine-Tuning", icon: "beaker", gradientClass: "from-[#A855F7] to-[#8B5CF6]" },
      { title: "RAG Pipelines", icon: "database", gradientClass: "from-[#1155CC] to-[#22B6F6]" },
      {
        title: "Secure Guardrails",
        icon: "shield",
        gradientClass: "from-white to-gray-50 text-gray-800 border-gray-200",
      },
    ],
  },
  {
    number: "02",
    icon: "lightbulb",
    title: "Strategic Thinking First",
    description: "Aligning technology with business goals",
    body: "We begin with the business outcome, then shape the roadmap, architecture, and delivery plan around measurable value. The result is software that serves a clear purpose from day one.",
    bullets: [
      "Deep discovery & requirement analysis",
      "Solution strategy & target architecture",
      "Roadmap with clear outcomes",
    ],
    callout:
      "We combine business strategy, technology and AI to build solutions that create real impact - not just deliver features.",
    layers: [
      { title: "Business Goals", icon: "trend", gradientClass: "from-[#1155CC] to-[#22B6F6]" },
      { title: "User Needs", icon: "handshake", gradientClass: "from-[#A855F7] to-[#8B5CF6]" },
      { title: "Smart Strategy", icon: "lightbulb", gradientClass: "from-[#06B6D4] to-[#0891B2]" },
      {
        title: "Impact & Growth",
        icon: "bolt",
        gradientClass: "from-white to-gray-50 text-gray-800 border-gray-200",
      },
    ],
  },
  {
    number: "03",
    icon: "speed",
    title: "Build Fast, Scale Fast",
    description: "Rapid iteration and deployment",
    body: "We combine focused execution with scalable foundations, so you can move quickly without creating fragile systems that slow future growth.",
    bullets: [
      "Fast delivery cycles with production discipline",
      "Performance-focused application architecture",
      "Cloud-ready systems built for growth",
    ],
    callout:
      "Speed is nothing without direction. We iterate rapidly while maintaining a robust, enterprise-grade architecture.",
    layers: [
      { title: "Production Release", icon: "cloud", gradientClass: "from-[#06B6D4] to-[#0891B2]" },
      { title: "Cloud-Ready Infra", icon: "dns", gradientClass: "from-[#1155CC] to-[#22B6F6]" },
      { title: "Rapid Iteration", icon: "speed", gradientClass: "from-[#8B5CF6] to-[#6366F1]" },
      {
        title: "Scalable Core",
        icon: "code",
        gradientClass: "from-white to-gray-50 text-gray-800 border-gray-200",
      },
    ],
  },
  {
    number: "04",
    icon: "shield",
    title: "End-to-End Ownership",
    description: "From concept to production to maintenance",
    body: "We take responsibility across the full product lifecycle, from the first technical decision to launch, support, and iteration.",
    bullets: [
      "Product planning, engineering and release support",
      "Security and quality considered throughout",
      "Post-launch maintenance and optimization",
    ],
    callout:
      "We don't hand off and walk away. We take full responsibility from initial discovery to production launch and daily optimization.",
    layers: [
      { title: "Continuous Ops", icon: "monitor", gradientClass: "from-[#10B981] to-[#059669]" },
      { title: "Launch Discipline", icon: "check", gradientClass: "from-[#1155CC] to-[#22B6F6]" },
      { title: "Quality Assurance", icon: "shield", gradientClass: "from-[#8B5CF6] to-[#6366F1]" },
      {
        title: "Discovery & Plan",
        icon: "beaker",
        gradientClass: "from-white to-gray-50 text-gray-800 border-gray-200",
      },
    ],
  },
  {
    number: "05",
    icon: "schema",
    title: "Scalable Architecture",
    description: "Designed to handle growth seamlessly",
    body: "We design systems that can evolve with your users, data, integrations, and business model without constant rebuilds.",
    bullets: [
      "Modular architecture with clean boundaries",
      "Future-ready infrastructure and integrations",
      "Technical foundations that reduce rework",
    ],
    callout:
      "We design for the future. Our architectures grow seamlessly alongside your users, transactions, and integrations.",
    layers: [
      { title: "High Availability", icon: "dns", gradientClass: "from-[#F59E0B] to-[#D97706]" },
      { title: "Microservices", icon: "box", gradientClass: "from-[#EF4444] to-[#DC2626]" },
      { title: "API Gateway", icon: "schema", gradientClass: "from-[#1155CC] to-[#22B6F6]" },
      {
        title: "Fault Tolerance",
        icon: "shield",
        gradientClass: "from-white to-gray-50 text-gray-800 border-gray-200",
      },
    ],
  },
  {
    number: "06",
    icon: "handshake",
    title: "Long-Term Partnership",
    description: "We succeed when you succeed",
    body: "We work as a long-term engineering partner, bringing clarity, transparency, and care to every stage of your product journey.",
    bullets: [
      "Collaborative delivery with visible progress",
      "Practical technical guidance as you grow",
      "Support that extends beyond launch",
    ],
    callout:
      "Our relationship doesn't end at launch. We walk beside you, providing technical direction and collaborative engineering as your business evolves.",
    layers: [
      { title: "Business Scaling", icon: "trend", gradientClass: "from-[#EC4899] to-[#D946EF]" },
      { title: "Feedback Loop", icon: "handshake", gradientClass: "from-[#8B5CF6] to-[#6366F1]" },
      { title: "Dedicated Support", icon: "monitor", gradientClass: "from-[#1155CC] to-[#22B6F6]" },
      {
        title: "Shared Vision",
        icon: "lightbulb",
        gradientClass: "from-white to-gray-50 text-gray-800 border-gray-200",
      },
    ],
  },
];

function AIBrainFlowVisual() {
  return (
    <div className="relative flex h-[260px] w-full items-center justify-center">
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 200 200"
        fill="none"
      >
        <path d="M100,100 L100,45" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="3 3" />
        <path d="M100,100 L55,140" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="3 3" />
        <path d="M100,100 L145,140" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="3 3" />

        <motion.circle
          cx={100}
          cy={100}
          r="3"
          fill="#8B5CF6"
          animate={{ cy: [100, 45, 100] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.circle
          cx={100}
          cy={100}
          r="3"
          fill="#1155CC"
          animate={{ cx: [100, 55, 100], cy: [100, 140, 100] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.circle
          cx={100}
          cy={100}
          r="3"
          fill="#06B6D4"
          animate={{ cx: [100, 145, 100], cy: [100, 140, 100] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </svg>

      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute z-20 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#1155CC] to-[#8B5CF6] text-white shadow-lg shadow-blue-800/20"
      >
        <Icon name="brain" className="h-7 w-7 text-white" />
      </motion.div>

      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[12%] z-10 flex w-24 items-center justify-center gap-1.5 rounded-xl border border-blue-100 bg-[#FAFBFD] px-2.5 py-1 text-center shadow-sm"
      >
        <Icon name="beaker" className="h-3.5 w-3.5 shrink-0 text-[#8B5CF6]" />
        <span className="text-[9px] font-medium tracking-wide text-gray-700 uppercase">
          Agentic
        </span>
      </motion.div>

      <motion.div
        animate={{ y: [0, 4, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-[12%] left-[8%] z-10 flex w-24 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-[#FAFBFD] px-2.5 py-1 text-center shadow-sm"
      >
        <Icon name="database" className="h-3.5 w-3.5 shrink-0 text-[#1155CC]" />
        <span className="text-[9px] font-medium tracking-wide text-gray-700 uppercase">
          RAG Ops
        </span>
      </motion.div>

      <motion.div
        animate={{ y: [0, 4, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute right-[8%] bottom-[12%] z-10 flex w-24 items-center justify-center gap-1.5 rounded-xl border border-blue-100 bg-[#FAFBFD] px-2.5 py-1 text-center shadow-sm"
      >
        <Icon name="shield" className="h-3.5 w-3.5 shrink-0 text-[#06B6D4]" />
        <span className="text-[9px] font-medium tracking-wide text-gray-700 uppercase">
          Guardrail
        </span>
      </motion.div>
    </div>
  );
}

function Isometric3DStackVisual() {
  const floatAnimations = [
    { y: [0, -8, 0], delay: 0 },
    { y: [0, -10, 0], delay: 0.4 },
    { y: [0, -6, 0], delay: 0.8 },
    { y: [0, -9, 0], delay: 1.2 },
  ];

  const layers = [
    {
      title: "Business Goals",
      icon: "trend" as const,
      gradient: "bg-gradient-to-r from-[#1155CC] to-[#22B6F6] text-white border-white/20",
    },
    {
      title: "User Needs",
      icon: "handshake" as const,
      gradient: "bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] text-white border-white/20",
    },
    {
      title: "Smart Strategy",
      icon: "lightbulb" as const,
      gradient: "bg-gradient-to-r from-[#06B6D4] to-[#0891B2] text-white border-white/20",
    },
    {
      title: "Impact & Growth",
      icon: "bolt" as const,
      gradient: "bg-white text-gray-800 border-gray-100",
    },
  ];

  const verticalOffsets = ["top-[8%]", "top-[28%]", "top-[48%]", "top-[68%]"];
  const zIndices = ["z-40", "z-30", "z-20", "z-10"];

  return (
    <div className="relative flex h-[260px] w-full items-center justify-center [perspective:1000px]">
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-20"
        viewBox="0 0 200 320"
        fill="none"
      >
        <path
          d="M 30,240 C 5,180 5,100 40,70 C 60,50 100,50 110,80"
          stroke="#1155CC"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
        <path
          d="M 170,70 C 195,120 195,200 160,240 C 140,260 100,260 90,230"
          stroke="#A855F7"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
      </svg>

      {layers.map((layer, idx) => {
        const isBottom = idx === layers.length - 1;
        return (
          <motion.div
            key={layer.title}
            animate={{ y: floatAnimations[idx].y }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: floatAnimations[idx].delay,
            }}
            style={{
              transform: "rotateX(55deg) rotateZ(-40deg)",
              transformStyle: "preserve-3d",
            }}
            className={[
              "absolute w-[150px] h-[56px] rounded-xl shadow-[0_8px_16px_rgba(0,0,0,0.05)] border flex flex-col items-center justify-center p-2 text-center transition-all duration-300",
              verticalOffsets[idx],
              zIndices[idx],
              layer.gradient,
            ].join(" ")}
          >
            <Icon
              name={layer.icon}
              className={["h-4 w-4 mb-1", isBottom ? "text-[#1155CC]" : "text-white"].join(" ")}
            />
            <span
              className={[
                "text-[9px] font-medium uppercase tracking-wider",
                isBottom ? "text-gray-800" : "text-white",
              ].join(" ")}
            >
              {layer.title}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

function PipelineFlowVisual() {
  return (
    <div className="relative flex h-[260px] w-full items-center justify-center">
      <div className="absolute top-[15%] bottom-[15%] left-1/2 w-[2px] -translate-x-1/2 bg-gradient-to-b from-blue-100 via-purple-100 to-cyan-100" />

      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 200 260"
        fill="none"
      >
        <motion.circle
          cx={100}
          cy={40}
          r="3"
          fill="#1155CC"
          animate={{ cy: [40, 220, 40] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
      </svg>

      <motion.div
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[8%] left-1/2 flex w-32 -translate-x-1/2 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-[#FAFBFD] px-3 py-1.5 text-xs font-bold text-gray-800 shadow-sm"
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#1155CC]">
          <Icon name="speed" className="h-3 w-3" />
        </span>
        <span className="text-[9px] font-medium tracking-wide text-gray-700 uppercase">
          Rapid Dev
        </span>
      </motion.div>

      <motion.div
        animate={{ y: [0, 3, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute top-[43%] left-1/2 flex w-32 -translate-x-1/2 items-center justify-center gap-2 rounded-xl border border-purple-100 bg-[#FAFBFD] px-3 py-1.5 text-xs font-bold text-gray-800 shadow-sm"
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-[#8B5CF6]">
          <Icon name="shield" className="h-3 w-3" />
        </span>
        <span className="text-[9px] font-medium tracking-wide text-gray-700 uppercase">
          QA Build
        </span>
      </motion.div>

      <motion.div
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-[8%] left-1/2 flex w-32 -translate-x-1/2 items-center justify-center gap-2 rounded-xl border border-cyan-100 bg-[#FAFBFD] px-3 py-1.5 text-xs font-bold text-gray-800 shadow-sm"
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-[#06B6D4]">
          <Icon name="cloud" className="h-3 w-3" />
        </span>
        <span className="text-[9px] font-medium tracking-wide text-gray-700 uppercase">
          Scale Out
        </span>
      </motion.div>
    </div>
  );
}

function InfiniteLifecycleVisual() {
  return (
    <div className="relative flex h-[260px] w-full items-center justify-center">
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 200 260"
        fill="none"
      >
        <circle cx="100" cy="130" r="48" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="3 3" />
        <motion.circle
          cx={148}
          cy={130}
          r="3"
          fill="#1155CC"
          animate={{
            cx: [100 + 48, 100, 100 - 48, 100, 100 + 48],
            cy: [130, 130 + 48, 130, 130 - 48, 130],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />
      </svg>

      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute z-20 flex h-12 w-12 flex-col items-center justify-center rounded-full border border-[#1155CC]/10 bg-[#F1F5F9] shadow-sm"
      >
        <Icon name="shield" className="h-5 w-5 text-[#1155CC]" />
      </motion.div>

      <div className="absolute top-[12%] left-1/2 -translate-x-1/2 text-center">
        <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-lg border border-gray-100 bg-white shadow-sm">
          <Icon name="beaker" className="h-4 w-4 text-[#8B5CF6]" />
        </div>
        <span className="text-[9px] font-medium tracking-wide text-gray-500 uppercase">Plan</span>
      </div>

      <div className="absolute top-[50%] right-[8%] -translate-y-1/2 text-center">
        <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-lg border border-gray-100 bg-white shadow-sm">
          <Icon name="cloud" className="h-4 w-4 text-[#1155CC]" />
        </div>
        <span className="text-[9px] font-medium tracking-wide text-gray-500 uppercase">
          Release
        </span>
      </div>

      <div className="absolute bottom-[12%] left-1/2 -translate-x-1/2 text-center">
        <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-lg border border-gray-100 bg-white shadow-sm">
          <Icon name="monitor" className="h-4 w-4 text-emerald-500" />
        </div>
        <span className="text-[9px] font-medium tracking-wide text-gray-500 uppercase">
          Optimize
        </span>
      </div>

      <div className="absolute top-[50%] left-[8%] -translate-y-1/2 text-center">
        <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-lg border border-gray-100 bg-white shadow-sm">
          <Icon name="code" className="h-4 w-4 text-[#06B6D4]" />
        </div>
        <span className="text-[9px] font-medium tracking-wide text-gray-500 uppercase">Build</span>
      </div>
    </div>
  );
}

function ScalableGridVisual() {
  const floatAnimations = [
    { y: [0, -7, 0], delay: 0 },
    { y: [0, -9, 0], delay: 0.4 },
    { y: [0, -6, 0], delay: 0.8 },
  ];

  const nodes = [
    {
      title: "Gateway",
      icon: "dns" as const,
      gradient: "bg-gradient-to-r from-[#1155CC] to-[#22B6F6] text-white border-white/20",
    },
    {
      title: "Cluster node",
      icon: "box" as const,
      gradient: "bg-[#8B5CF6] text-white border-purple-400/20",
    },
    {
      title: "Datastore",
      icon: "schema" as const,
      gradient: "bg-white text-gray-800 border-gray-100",
    },
  ];

  const verticalOffsets = ["top-[10%]", "top-[36%]", "top-[62%]"];
  const zIndices = ["z-30", "z-20", "z-10"];

  return (
    <div className="relative flex h-[260px] w-full items-center justify-center [perspective:1000px]">
      <div className="absolute top-[20%] bottom-[20%] left-1/2 z-0 w-[1.5px] -translate-x-1/2 border-l border-dashed border-blue-200" />

      {nodes.map((node, idx) => {
        const isBottom = idx === nodes.length - 1;
        return (
          <motion.div
            key={node.title}
            animate={{ y: floatAnimations[idx].y }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: floatAnimations[idx].delay,
            }}
            style={{
              transform: "rotateX(55deg) rotateZ(-30deg)",
              transformStyle: "preserve-3d",
            }}
            className={[
              "absolute w-[140px] h-[52px] rounded-xl shadow-[0_8px_16px_rgba(0,0,0,0.05)] border flex items-center justify-center gap-2 p-2 text-center transition-all duration-300",
              verticalOffsets[idx],
              zIndices[idx],
              node.gradient,
            ].join(" ")}
          >
            <Icon
              name={node.icon}
              className={["h-4 w-4 shrink-0", isBottom ? "text-[#1155CC]" : "text-white"].join(" ")}
            />
            <span
              className={[
                "text-[9px] font-medium uppercase tracking-wider",
                isBottom ? "text-gray-800" : "text-white",
              ].join(" ")}
            >
              {node.title}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

function CollaborationRingsVisual() {
  return (
    <div className="relative mx-auto flex h-[280px] w-full max-w-[360px] items-center justify-center font-sans">
      <svg
        className="pointer-events-none absolute inset-0 z-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="grad-left" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1155CC" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
          <linearGradient id="grad-right" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#1155CC" />
          </linearGradient>
        </defs>

        <line
          x1="25"
          y1="18"
          x2="75"
          y2="18"
          stroke="#E2E8F0"
          strokeWidth="0.5"
          strokeDasharray="1 1"
        />
        <path
          d="M 25 45 C 25 60, 35 62, 50 62"
          fill="none"
          stroke="url(#grad-left)"
          strokeWidth="0.5"
        />
        <path
          d="M 75 45 C 75 60, 65 62, 50 62"
          fill="none"
          stroke="url(#grad-right)"
          strokeWidth="0.5"
        />
      </svg>

      <div className="absolute top-[18%] left-[25%] z-0 -mt-[3px] -ml-[3px] h-1.5 w-1.5 rounded-full bg-[#1155CC]" />
      <div className="absolute top-[18%] left-[75%] z-0 -mt-[3px] -ml-[3px] h-1.5 w-1.5 rounded-full bg-[#8B5CF6]" />

      <div className="absolute top-[45%] left-[25%] z-0 -mt-[3px] -ml-[3px] h-1.5 w-1.5 rounded-full bg-[#1155CC]" />
      <div className="absolute top-[45%] left-[75%] z-0 -mt-[3px] -ml-[3px] h-1.5 w-1.5 rounded-full bg-[#8B5CF6]" />

      <div className="absolute top-[62%] left-[50%] z-0 -mt-[3px] -ml-[3px] h-1.5 w-1.5 rounded-full bg-[#3B82F6]" />

      <div className="absolute top-[5%] left-[2%] z-10 flex w-[44%] max-w-[130px] flex-col items-center rounded-2xl border border-blue-50 bg-white/95 p-3 text-center shadow-[0_8px_20px_rgba(0,0,0,0.04)] backdrop-blur-sm transition-transform hover:-translate-y-1 sm:p-4">
        <div className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-full border border-blue-100 bg-[#F1F5F9] shadow-inner sm:h-12 sm:w-12">
          <Icon name="users" className="h-5 w-5 text-[#1155CC] sm:h-6 sm:w-6" />
        </div>
        <h4 className="mb-1 text-[12px] font-bold text-[#1155CC] sm:text-[13px]">Your Team</h4>
        <p className="text-[9px] leading-snug text-gray-500 sm:text-[10px]">
          Your goals, your vision, your users
        </p>
      </div>

      <div className="absolute top-[5%] right-[2%] z-10 flex w-[44%] max-w-[130px] flex-col items-center rounded-2xl border border-purple-50 bg-white/95 p-3 text-center shadow-[0_8px_20px_rgba(0,0,0,0.04)] backdrop-blur-sm transition-transform hover:-translate-y-1 sm:p-4">
        <div className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-full border border-purple-100 bg-[#F5F3FF] shadow-inner sm:h-12 sm:w-12">
          <Icon name="code" className="h-5 w-5 text-[#8B5CF6] sm:h-6 sm:w-6" />
        </div>
        <h4 className="mb-1 text-[12px] font-bold text-[#8B5CF6] sm:text-[13px]">Our Team</h4>
        <p className="text-[9px] leading-snug text-gray-500 sm:text-[10px]">
          Our expertise, our commitment
        </p>
      </div>

      <div className="absolute bottom-[5%] left-1/2 z-10 flex w-[80%] max-w-[200px] -translate-x-1/2 flex-col items-center">
        <div className="relative flex h-[64px] w-[64px] items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.4], opacity: [0.15, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
            className="absolute inset-[-6px] rounded-full bg-[#1155CC]"
          />
          <motion.div
            animate={{ scale: [1, 1.2], opacity: [0.3, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
            className="absolute inset-[-2px] rounded-full bg-[#8B5CF6]"
          />
          <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border border-blue-100 bg-white shadow-[0_4px_12px_rgba(17, 85, 204,0.1)] sm:h-14 sm:w-14">
            <Icon name="handshake" className="h-5 w-5 text-[#1155CC] sm:h-6 sm:w-6" />
          </div>
        </div>

        <div className="mt-4 flex flex-col items-center sm:mt-5">
          <div className="relative z-20 mb-1.5 rounded-full border border-blue-50 bg-white px-3 py-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] sm:px-4 sm:py-1.5">
            <span className="text-[10px] font-bold whitespace-nowrap text-[#1155CC] sm:text-[11px]">
              Shared Success
            </span>
          </div>
          <span className="text-center text-[9px] leading-tight text-gray-500 sm:text-[10px]">
            Long-term impact
            <br />
            together
          </span>
        </div>
      </div>
    </div>
  );
}

function WhyChooseVisualizer({ index }: { index: number }) {
  switch (index) {
    case 0:
      return <AIBrainFlowVisual />;
    case 1:
      return <Isometric3DStackVisual />;
    case 2:
      return <PipelineFlowVisual />;
    case 3:
      return <InfiniteLifecycleVisual />;
    case 4:
      return <ScalableGridVisual />;
    case 5:
      return <CollaborationRingsVisual />;
    default:
      return <Isometric3DStackVisual />;
  }
}

export default function WhyChooseSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = whyItems[activeIndex] ?? whyItems[0];

  return (
    <section className="relative overflow-hidden bg-[#FAFBFD] py-20">
      <div className="pointer-events-none absolute top-0 -right-96 h-[760px] w-[760px] rounded-full bg-[#F1F5F9] opacity-75 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-80 -left-80 h-[680px] w-[680px] rounded-full bg-[#EEF3FF] opacity-75 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-3xl space-y-4 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#1155CC]/15 bg-[#F1F5F9] px-4 py-1.5 text-xs font-bold tracking-wide text-[#1155CC] uppercase">
            <Icon name="trend" className="h-3.5 w-3.5" />
            Why Choose Us
          </div>
          <h2 className="text-3xl leading-tight font-medium text-gray-900 lg:text-5xl">
            Built Different. <span className="text-[#1155CC]">Built for Impact.</span>
          </h2>
          <p className="text-lg leading-relaxed text-gray-600">
            We don&apos;t just write code - we engineer intelligent systems that solve real problems
            and drive measurable growth.
          </p>
        </div>

        {/* Desktop Layout: Side-by-side tabs */}
        <div className="hidden grid-cols-12 items-start gap-8 lg:grid lg:gap-12">
          <WhyChooseNav activeIndex={activeIndex} onActivate={setActiveIndex} />
          {active && <WhyChoosePanel item={active} index={activeIndex >= 0 ? activeIndex : 0} />}
        </div>

        {/* Mobile/Tablet Layout: Clean Expandable Accordion */}
        <div className="block space-y-4 lg:hidden">
          {whyItems.map((item, index) => {
            const isOpen = index === activeIndex;
            return (
              <div
                key={item.title}
                className={[
                  "rounded-2xl border transition-all duration-300 overflow-hidden",
                  isOpen
                    ? "border-blue-100 bg-white shadow-md"
                    : "border-gray-100 bg-white/60 hover:bg-white",
                ].join(" ")}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    setActiveIndex(isOpen ? -1 : index);
                    if (!isOpen) {
                      const buttonElement = e.currentTarget;
                      setTimeout(() => {
                        const yOffset = -70; // offset for sticky header
                        const y =
                          buttonElement.getBoundingClientRect().top + window.scrollY + yOffset;
                        window.scrollTo({ top: y, behavior: "smooth" });
                      }, 120);
                    }
                  }}
                  className="flex w-full items-center justify-between p-5 text-left"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <span className="shrink-0 font-mono text-xs font-bold text-[#1155CC]">
                      {item.number}
                    </span>
                    <span
                      className={[
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-300",
                        isOpen ? "bg-[#1155CC] text-white shadow-sm" : "bg-blue-50 text-[#1155CC]",
                      ].join(" ")}
                    >
                      <Icon name={item.icon} className="h-4.5 w-4.5" />
                    </span>
                    <span className="min-w-0 truncate text-base font-bold text-gray-900">
                      {item.title}
                    </span>
                  </div>
                  <span
                    className={[
                      "text-[#1155CC] transition-transform duration-300",
                      isOpen ? "rotate-180" : "",
                    ].join(" ")}
                  >
                    <Icon name="chevron" className="h-5 w-5" />
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <div className="space-y-4 border-t border-gray-50 px-5 pt-1 pb-5">
                        <p className="text-sm leading-relaxed text-gray-600">{item.body}</p>

                        <ul className="space-y-0 divide-y divide-gray-100">
                          {item.bullets.map((bullet) => (
                            <li
                              key={bullet}
                              className="flex items-start gap-2.5 py-2.5 text-xs font-medium text-gray-700 first:pt-0 last:pb-0"
                            >
                              <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50/50 p-0.5 text-[#1155CC]">
                                <Icon name="check" className="h-2.5 w-2.5" />
                              </span>
                              <span className="leading-relaxed">{bullet}</span>
                            </li>
                          ))}
                        </ul>

                        <div className="mt-4 flex w-full items-center gap-3 rounded-xl border border-blue-100/50 bg-[#F4F9FF] p-3.5 text-left shadow-[0_4px_12px_rgba(17, 85, 204,0.01)]">
                          <span className="mt-1 font-serif text-2xl leading-none font-black text-[#1155CC] select-none">
                            &ldquo;
                          </span>
                          <div className="h-6 w-[1.2px] shrink-0 bg-blue-200/50" />
                          <p className="text-xs leading-normal font-semibold text-gray-600 italic">
                            {item.callout}
                          </p>
                        </div>

                        <div className="relative mt-4 flex h-[280px] w-full items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50/10 via-indigo-50/5 to-transparent p-3">
                          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(#1155CC_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.1]" />

                          <div className="relative z-10 flex h-full w-full items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-white p-3 shadow-md">
                            <WhyChooseVisualizer index={index} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function WhyChooseNav({
  activeIndex,
  onActivate,
}: {
  activeIndex: number;
  onActivate: (index: number) => void;
}) {
  return (
    <nav className="relative flex flex-col gap-4 pl-10 lg:col-span-5">
      <div className="absolute top-6 left-[16px] hidden h-[calc(100%-48px)] w-[1.5px] bg-gray-200 lg:block" />
      <div className="flex snap-x gap-3 overflow-x-auto pb-3 lg:flex-col lg:gap-4 lg:overflow-visible lg:pb-0">
        {whyItems.map((item, index) => {
          const active = index === activeIndex;

          return (
            <motion.button
              key={item.title}
              type="button"
              onMouseEnter={() => onActivate(index)}
              onFocus={() => onActivate(index)}
              whileHover={{ y: -1 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={[
                "group relative flex min-w-[280px] snap-start items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-300 ease-out sm:min-w-[320px] lg:min-w-0 shadow-sm",
                active
                  ? "border-[#1155CC] bg-white shadow-lg shadow-blue-800/[0.05]"
                  : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-md",
              ].join(" ")}
            >
              <div className="pointer-events-none absolute top-1/2 left-[-24px] z-10 hidden -translate-x-1/2 -translate-y-1/2 items-center justify-center lg:flex">
                {active ? (
                  <div className="relative flex items-center justify-center">
                    <div className="h-2.5 w-2.5 rounded-full border-2 border-white bg-[#1155CC] shadow-sm" />
                    <div className="absolute left-[6px] h-[1.5px] w-5 bg-[#1155CC]" />
                  </div>
                ) : (
                  <div className="h-2 w-2 rounded-full border border-blue-400 bg-white shadow-sm transition-colors duration-200 group-hover:border-[#1155CC]" />
                )}
              </div>

              <span
                className={[
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300",
                  active
                    ? "bg-[#1155CC] text-white shadow-md shadow-blue-800/10"
                    : "bg-blue-50 text-[#1155CC] group-hover:bg-[#1155CC] group-hover:text-white group-hover:shadow-md",
                ].join(" ")}
              >
                <Icon name={item.icon} className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={[
                    "block text-base font-medium leading-tight transition-colors duration-200",
                    active ? "text-gray-900" : "text-gray-600 group-hover:text-gray-900",
                  ].join(" ")}
                >
                  {item.title}
                </span>
                <span className="mt-1 block text-[11px] leading-normal font-medium text-gray-500">
                  {item.description}
                </span>
              </span>
              <span
                className={[
                  "transition-all duration-300 group-hover:translate-x-1 shrink-0",
                  active ? "text-[#1155CC]" : "text-gray-300 group-hover:text-[#1155CC]",
                ].join(" ")}
              >
                <Icon name="arrow" className="h-4 w-4" />
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}

function WhyChoosePanel({ item, index }: { item: WhyItem; index: number }) {
  return (
    <div className="relative flex w-full flex-col overflow-hidden rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm sm:p-8 lg:col-span-7 lg:p-10">
      <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-blue-50/40" />
      <div className="pointer-events-none absolute -bottom-12 -left-16 h-40 w-40 rounded-full bg-blue-50/40" />

      <AnimatePresence mode="wait">
        <motion.div
          key={item.number}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative z-10 flex w-full flex-col gap-6"
        >
          <div className="flex w-full flex-col gap-3 border-b border-gray-100 pb-5 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex shrink-0 items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1155CC] to-[#22B6F6] text-white shadow-md shadow-blue-800/20">
                <Icon name={item.icon} className="h-5 w-5" />
              </div>
              <span className="rounded-lg border border-[#1155CC]/10 bg-[#F1F5F9] px-3 py-1 font-mono text-xs font-black tracking-wider text-[#1155CC]">
                {item.number}
              </span>
            </div>
            <h3 className="text-[22px] leading-tight font-medium tracking-tight text-[#0B1221] sm:text-[26px] lg:text-[30px]">
              {item.title}
            </h3>
          </div>

          <p className="border-l-2 border-[#1155CC]/25 pl-4 text-[15px] leading-relaxed text-[#4B5563] sm:text-[16px]">
            {item.body}
          </p>

          <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-5">
              <ul className="flex flex-col gap-2.5">
                {item.bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="flex items-start gap-3 rounded-xl border border-gray-100/80 bg-gray-50/60 px-3.5 py-2.5 text-[13.5px] font-medium text-[#374151] transition-all hover:border-blue-100 hover:bg-white hover:shadow-sm"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F1F5F9] text-[#1155CC]">
                      <Icon name="check" className="h-3 w-3" />
                    </span>
                    <span className="leading-relaxed">{bullet}</span>
                  </li>
                ))}
              </ul>

              <div className="flex items-start gap-3 rounded-xl border border-blue-100/30 bg-gradient-to-r from-blue-50/70 to-transparent px-4 py-3">
                <span className="mt-0.5 font-serif text-xl leading-none font-black text-[#1155CC] opacity-60 select-none">
                  &ldquo;
                </span>
                <p className="text-[12.5px] leading-relaxed font-medium text-gray-600 italic">
                  {item.callout}
                </p>
              </div>
            </div>

            <div className="relative flex h-[280px] w-full items-center justify-center rounded-2xl border border-gray-100/80 bg-[#F8FAFE] p-3 select-none sm:h-[320px]">
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(#1155CC_1px,transparent_1px)] [background-size:18px_18px] opacity-[0.18]" />
              <div className="relative z-10 flex h-full w-full items-center justify-center overflow-hidden rounded-xl border border-gray-100/50 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                <WhyChooseVisualizer index={index} />
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
