"use client";

import React, { useState } from "react";
import { m } from "motion/react";

const LINKS = [
  { from: "next", to: "react" },
  { from: "react", to: "node" },
  { from: "node", to: "postgres" },
  { from: "node", to: "docker" },
  { from: "node", to: "aws" },
  { from: "node", to: "openai" },
  { from: "openai", to: "langchain" },
  { from: "node", to: "n8n" },
  { from: "n8n", to: "openai" },
];

const NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  next: { x: 20, y: 30 },
  react: { x: 30, y: 70 },
  node: { x: 50, y: 50 },
  postgres: { x: 70, y: 80 },
  docker: { x: 70, y: 20 },
  aws: { x: 90, y: 40 },
  openai: { x: 45, y: 15 },
  langchain: { x: 25, y: 10 },
  n8n: { x: 85, y: 70 },
};

const NODES = [
  { id: "next", name: "Next.js", desc: "SSR & Web Apps", x: "20%", y: "30%" },
  { id: "react", name: "React", desc: "User Interface", x: "30%", y: "70%" },
  {
    id: "node",
    name: "Node.js",
    desc: "Backend Engine",
    x: "50%",
    y: "50%",
    primary: true,
  },
  { id: "postgres", name: "PostgreSQL", desc: "Relational DB", x: "70%", y: "80%" },
  { id: "docker", name: "Docker", desc: "Dev Container", x: "70%", y: "20%" },
  { id: "aws", name: "AWS", desc: "Cloud Scaling", x: "90%", y: "40%" },
  { id: "openai", name: "OpenAI", desc: "LLM Intelligence", x: "45%", y: "15%" },
  { id: "langchain", name: "LangChain", desc: "Agent Workflows", x: "25%", y: "10%" },
  { id: "n8n", name: "n8n", desc: "Visual Workflows", x: "85%", y: "70%" },
];

export function AboutTechEcosystem() {
  const [hoveredTech, setHoveredTech] = useState<string | null>(null);

  return (
    <section className="relative overflow-hidden border-t border-slate-900 bg-[#050B14] py-24 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-2 text-xs font-bold tracking-widest text-[#22B6F6] uppercase">
            Ecosystem Web
          </h2>
          <h3 className="text-3xl font-medium tracking-tight text-white sm:text-4xl">
            Technology Ecosystem
          </h3>
          <p className="mt-1 text-xs font-medium text-slate-400 sm:text-sm">
            Hover over nodes to trace structural connections and data routing pipelines.
          </p>
        </div>

        <div className="relative flex h-[420px] items-center justify-center rounded-3xl border border-slate-900 bg-slate-950/40 p-4">
          {/* SVG Connecting Paths */}
          <svg className="pointer-events-none absolute inset-0 h-full w-full">
            {LINKS.map((link) => {
              const fromPt = NODE_POSITIONS[link.from];
              const toPt = NODE_POSITIONS[link.to];
              const isHighlighted = hoveredTech === link.from || hoveredTech === link.to;

              return (
                <m.line
                  key={`${link.from}-${link.to}`}
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
          {NODES.map((node) => (
            <div
              key={node.id}
              onMouseEnter={() => setHoveredTech(node.id)}
              onMouseLeave={() => setHoveredTech(null)}
              className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-xl border p-3 transition-all duration-200 select-none ${
                node.primary
                  ? "bg-[#1155CC] border-[#2563EB] shadow-lg shadow-[#1155CC]/20 z-10"
                  : hoveredTech === node.id
                    ? "bg-slate-800 border-blue-500 shadow-md z-10"
                    : "bg-slate-900/80 border-slate-800/80"
              }`}
              style={{ left: node.x, top: node.y }}
            >
              <h5 className="text-[10px] font-bold tracking-wide text-white">{node.name}</h5>
              <p className="mt-0.5 font-mono text-[8px] whitespace-nowrap text-slate-400">
                {node.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
