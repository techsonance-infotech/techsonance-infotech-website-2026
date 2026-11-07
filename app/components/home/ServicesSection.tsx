"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useMotionValue, useTransform, animate, useMotionTemplate } from "motion/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { services, type Service } from "@/data/services";
import { Icon, type IconName } from "@/app/components/icons/Icon";

// Register ScrollTrigger with GSAP
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface ServiceNode {
  id: number;
  slug: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  x: number; // positions in a 1000 x 800 viewBox grid
  y: number;
  w: number;
  h: number;
  side: "left" | "right";
  connectorX: number;
  connectorY: number;
}

// Nodes representing the 8 services around the central engine
const serviceNodes: ServiceNode[] = [
  {
    id: 0,
    slug: "ai-automation",
    title: "AI Automation Solutions",
    description: "Automate workflows, extract insights and build intelligent AI agents.",
    icon: "brain",
    color: "#7C3AED", // purple
    x: 50,
    y: 60,
    w: 240,
    h: 110,
    side: "left",
    connectorX: 290,
    connectorY: 115,
  },
  {
    id: 1,
    slug: "custom-software-development",
    title: "Custom Software Development",
    description: "Robust, secure and scalable software tailored to your unique needs.",
    icon: "code",
    color: "#1155CC", // blue
    x: 710,
    y: 60,
    w: 240,
    h: 110,
    side: "right",
    connectorX: 710,
    connectorY: 115,
  },
  {
    id: 2,
    slug: "saas-product-development",
    title: "SaaS Product Development",
    description: "Build scalable SaaS products with multi-tenant architecture.",
    icon: "cloud",
    color: "#0891B2", // cyan
    x: 10,
    y: 260,
    w: 240,
    h: 110,
    side: "left",
    connectorX: 250,
    connectorY: 315,
  },
  {
    id: 3,
    slug: "web-development",
    title: "Web Application Development",
    description: "High-performance web apps with modern stacks and exceptional UX.",
    icon: "monitor",
    color: "#F97316", // orange
    x: 750,
    y: 260,
    w: 240,
    h: 110,
    side: "right",
    connectorX: 750,
    connectorY: 315,
  },
  {
    id: 4,
    slug: "mobile-development",
    title: "Mobile App Development",
    description: "Cross-platform mobile apps that are fast, reliable and designed for users.",
    icon: "box",
    color: "#10B981", // green
    x: 50,
    y: 470,
    w: 240,
    h: 110,
    side: "left",
    connectorX: 290,
    connectorY: 525,
  },
  {
    id: 5,
    slug: "api-integrations",
    title: "API & Systems Integration",
    description: "Seamless API integrations, third-party services and enterprise system sync.",
    icon: "schema",
    color: "#EC4899", // pink
    x: 710,
    y: 470,
    w: 240,
    h: 110,
    side: "right",
    connectorX: 710,
    connectorY: 525,
  },
  {
    id: 6,
    slug: "cloud-devops",
    title: "Cloud & DevOps Engineering",
    description: "Scalable cloud infrastructure, CI/CD pipelines and automated deployments.",
    icon: "dns",
    color: "#F59E0B", // amber
    x: 180,
    y: 650,
    w: 240,
    h: 110,
    side: "left",
    connectorX: 420,
    connectorY: 705,
  },
  {
    id: 7,
    slug: "product-engineering",
    title: "Product Engineering",
    description:
      "MVPs, product scaling and tech strategy to turn ideas into market-ready products.",
    icon: "lightbulb",
    color: "#E11D48", // crimson rose
    x: 580,
    y: 650,
    w: 240,
    h: 110,
    side: "right",
    connectorX: 580,
    connectorY: 705,
  },
];

// Helper to compute organic cubic bezier curve path from center (500, 400) to connector dot
function getConnectionPath(node: ServiceNode) {
  const startX = 500;
  const startY = 400;
  const endX = node.connectorX;
  const endY = node.connectorY;

  let cp1x = startX;
  let cp1y = startY;
  let cp2x = endX;
  let cp2y = endY;

  if (node.side === "left") {
    cp1x = startX - 100;
    cp1y = startY + (endY - startY) * 0.15;
    cp2x = endX + 80;
    cp2y = endY;
  } else {
    cp1x = startX + 100;
    cp1y = startY + (endY - startY) * 0.15;
    cp2x = endX - 80;
    cp2y = endY;
  }

  return `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
}

export default function ServicesSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);

  // Parallax motion tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const fgX = useTransform(mouseX, [-400, 400], [-10, 10]);
  const fgY = useTransform(mouseY, [-400, 400], [-10, 10]);

  const bgX = useTransform(mouseX, [-400, 400], [-20, 20]);
  const bgY = useTransform(mouseY, [-400, 400], [-20, 20]);

  // GSAP build animations on viewport scroll
  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 70%",
          toggleActions: "play none none none",
        },
      });

      // Step 1: Fade in badge and header text
      tl.fromTo(
        ".eco-header-anim",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.15 },
      );

      // Step 2: Scale center orb from 0.6 to 1
      tl.fromTo(
        ".eco-orb-container",
        { scale: 0.6, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1, ease: "elastic.out(1, 0.75)" },
        "-=0.4",
      );

      // Step 3: Animate connection lines drawing themselves
      tl.fromTo(
        ".connection-path",
        { strokeDasharray: "600", strokeDashoffset: "600" },
        { strokeDashoffset: "0", duration: 1.4, ease: "power3.inOut" },
        "-=0.7",
      );

      // Step 4: Service cards appear sequentially
      // Order requested: Top Left (0), Top Right (1), Middle Left (2), Middle Right (3), Bottom Left (4), Bottom Right (5), Bottom Center Left (6), Bottom Center Right (7)
      const order = [0, 1, 2, 3, 4, 5, 6, 7];
      order.forEach((nodeId, idx) => {
        tl.fromTo(
          `.eco-card-node-${nodeId}`,
          { scale: 0.85, opacity: 0, y: 20 },
          { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: "power3.out" },
          `-=${idx === 0 ? 0.9 : 0.42}`,
        );
      });

      // Step 5: Fade in particle overlay and connection dash overlay flows
      tl.fromTo(
        [".eco-particle", ".flowing-dash-line"],
        { opacity: 0 },
        { opacity: 1, duration: 0.6 },
        "-=0.2",
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Track cursor location relative to center of the container
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set(e.clientX - centerX);
    mouseY.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    setHoveredNode(null);
    animate(mouseX, 0, { type: "spring", stiffness: 120, damping: 18 });
    animate(mouseY, 0, { type: "spring", stiffness: 120, damping: 18 });
  };

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full overflow-hidden border-t border-b border-gray-100 bg-[#FAFBFD] py-24"
    >
      {/* Background Fine Grid detail */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.012]"
        style={{
          backgroundImage:
            "linear-gradient(#1155CC 1px, transparent 1px), linear-gradient(90deg, #1155CC 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header Block */}
        <div className="mx-auto mb-20 max-w-3xl text-center">
          <div className="eco-header-anim mb-4 inline-flex items-center gap-2 rounded-full border border-[#1155CC]/10 bg-[#F1F5F9] px-4 py-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#1155CC]" />
            <span className="text-[10px] font-black tracking-widest text-[#1155CC] uppercase">
              What We Do
            </span>
          </div>
          <h2 className="eco-header-anim mb-5 text-4xl leading-[1.15] leading-tight font-medium tracking-tight text-gray-900 sm:text-5xl">
            End-to-End Solutions. <br />
            <span className="text-[#1155CC] italic">Engineered for Growth.</span>
          </h2>
          <p className="eco-header-anim text-lg leading-relaxed text-gray-600">
            We build powerful digital systems, automate operations with AI, and deliver scalable
            products that help businesses grow faster.
          </p>
        </div>

        {/* ─── DESKTOP FUTURISTIC ECOSYSTEM GRID (lg and up) ─── */}
        <div className="relative mx-auto hidden aspect-[1.25] w-full max-w-6xl select-none lg:block">
          {/* Parallax Background Layer (Particles, Orbs & Glows) */}
          <motion.div
            style={{ x: bgX, y: bgY }}
            className="pointer-events-none absolute inset-0 z-0"
          >
            {/* Subtle Volumetric Glow behind center hub */}
            <div className="absolute top-1/2 left-1/2 h-[450px] w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-400/10 to-indigo-400/10 mix-blend-screen blur-3xl" />

            {/* Hover Glow Background - shifts to match hovered service color */}
            {hoveredNode !== null && (
              <div
                className="absolute top-1/2 left-1/2 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 mix-blend-screen blur-3xl transition-all duration-700"
                style={{ backgroundColor: `${serviceNodes[hoveredNode].color}20` }}
              />
            )}

            {/* Floating particles */}
            <div className="absolute inset-0">
              <span className="eco-particle absolute top-[20%] left-[12%] h-1.5 w-1.5 animate-pulse rounded-full bg-[#1155CC]/20" />
              <span
                className="eco-particle absolute top-[70%] left-[22%] h-2 w-2 animate-ping rounded-full bg-[#7C3AED]/20"
                style={{ animationDuration: "3s" }}
              />
              <span className="eco-particle absolute top-[15%] left-[85%] h-1.5 w-1.5 animate-pulse rounded-full bg-[#0891B2]/30" />
              <span
                className="eco-particle absolute top-[65%] left-[78%] h-2.5 w-2.5 animate-pulse rounded-full bg-pink-500/15"
                style={{ animationDuration: "4s" }}
              />
              <span className="eco-particle absolute top-[10%] left-[48%] h-1 w-1 animate-pulse rounded-full bg-[#10B981]/40" />
              <span
                className="eco-particle absolute top-[88%] left-[55%] h-1.5 w-1.5 animate-ping rounded-full bg-amber-500/20"
                style={{ animationDuration: "5s" }}
              />
            </div>
          </motion.div>

          {/* Parallax Foreground Layer (Central Hub, SVG Paths, Service Cards) */}
          <motion.div style={{ x: fgX, y: fgY }} className="absolute inset-0 z-10">
            {/* SVG Connection System */}
            <svg
              viewBox="0 0 1000 800"
              className="pointer-events-none absolute inset-0 h-full w-full"
            >
              <defs>
                {/* Connection Gradients */}
                {serviceNodes.map((node) => (
                  <linearGradient
                    key={node.id}
                    id={`grad-${node.id}`}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="#1155CC" stopOpacity="0.1" />
                    <stop offset="50%" stopColor={node.color} stopOpacity="0.35" />
                    <stop offset="100%" stopColor={node.color} stopOpacity="0.8" />
                  </linearGradient>
                ))}

                {/* Moving dot particles filter */}
                <radialGradient id="particleGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFF" stopOpacity="1" />
                  <stop offset="100%" stopColor="#FFF" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Draw connection lines */}
              {serviceNodes.map((node) => {
                const path = getConnectionPath(node);
                const isNodeHovered = hoveredNode === node.id;

                return (
                  <g key={node.id}>
                    {/* Base resting path */}
                    <path
                      d={path}
                      fill="none"
                      stroke={`url(#grad-${node.id})`}
                      strokeWidth={isNodeHovered ? 2.5 : 1.5}
                      className="connection-path transition-all duration-300"
                      style={{
                        opacity: hoveredNode === null ? 0.7 : isNodeHovered ? 1.0 : 0.35,
                      }}
                    />

                    {/* Flowing Dotted Particles overlay */}
                    <path
                      d={path}
                      fill="none"
                      stroke={node.color}
                      strokeWidth={isNodeHovered ? 3.5 : 2}
                      strokeDasharray={isNodeHovered ? "6 24" : "4 40"}
                      className={`flowing-dash-line transition-all duration-300 ${
                        isNodeHovered ? "flowing-dash-reverse" : "flowing-dash-forward"
                      }`}
                      style={{
                        opacity: hoveredNode === null ? 0.65 : isNodeHovered ? 1.0 : 0.2,
                        filter: `drop-shadow(0 0 4px ${node.color})`,
                      }}
                    />

                    {/* Dynamic glow connector joint dot */}
                    <circle
                      cx={node.connectorX}
                      cy={node.connectorY}
                      r={isNodeHovered ? 5 : 3}
                      fill={node.color}
                      className="transition-all duration-300"
                      style={{
                        boxShadow: `0 0 10px ${node.color}`,
                        filter: `drop-shadow(0 0 6px ${node.color})`,
                      }}
                    />
                  </g>
                );
              })}
            </svg>

            {/* ─── CENTRAL ENGINE ORB ─── */}
            <div
              className="eco-orb-container pointer-events-none absolute top-1/2 left-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
              style={{
                left: "50%",
                top: "50%",
              }}
            >
              {/* Outer Glowing Concentric Rings */}
              <div className="absolute h-[340px] w-[340px] animate-[spin_25s_linear_infinite] rounded-full border border-blue-500/10" />
              <div className="absolute h-[300px] w-[300px] animate-[spin_35s_linear_infinite_reverse] rounded-full border border-dashed border-blue-400/5" />
              <div
                className="absolute h-[275px] w-[275px] rounded-full border border-[#1155CC]/20 transition-all duration-500"
                style={{
                  transform: hoveredNode !== null ? "scale(1.05)" : "scale(1)",
                  boxShadow:
                    hoveredNode !== null
                      ? `0 0 30px ${serviceNodes[hoveredNode].color}15`
                      : "0 0 20px rgba(17, 85, 204,0.05)",
                }}
              />

              {/* Interactive Core Engine Card */}
              <div
                className={`z-30 flex h-[230px] w-[230px] flex-col items-center justify-center rounded-full border border-[#1155CC]/35 bg-[#07132B]/95 p-6 text-center shadow-[0_0_60px_rgba(17, 85, 204,0.3)] transition-all duration-500 ${
                  hoveredNode !== null ? "scale-[1.03]" : "scale-100"
                }`}
                style={{
                  borderColor: hoveredNode !== null ? serviceNodes[hoveredNode].color : "#1155CC",
                }}
              >
                {/* Tech logo mark */}
                <div className="mb-2 shrink-0">
                  <svg
                    className="h-9 w-9 text-blue-400"
                    viewBox="0 0 36 36"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6 10L18 4L30 10V26L18 32L6 26V10Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M18 4V32"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                    <path d="M6 10L30 26" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M30 10L6 26" stroke="currentColor" strokeWidth="1.5" />
                    <circle
                      cx="18"
                      cy="18"
                      r="5"
                      fill="#07132B"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                </div>

                <h4 className="mb-1 text-[10px] font-black tracking-widest text-blue-400 uppercase">
                  Your Business
                </h4>
                <h3 className="mb-2 text-lg leading-tight font-black tracking-tight text-white">
                  Growth Engine
                </h3>

                <div className="mx-auto mb-3 h-[1px] w-16 bg-gray-700/80" />

                <p className="max-w-[150px] text-[8px] leading-relaxed font-bold tracking-wider text-gray-400 uppercase">
                  Technology • Automation • Scale
                </p>

                {/* Animated Mini status graph */}
                <div className="mt-3 flex h-5 items-end justify-center gap-1.5">
                  <div
                    className="w-1 animate-[pulse_1.2s_infinite] rounded-t bg-blue-500/60"
                    style={{ height: "40%" }}
                  />
                  <div
                    className="w-1 animate-[pulse_1.5s_infinite] rounded-t bg-blue-400"
                    style={{ height: "65%" }}
                  />
                  <div
                    className="w-1 animate-[pulse_1s_infinite] rounded-t bg-[#22B6F6]"
                    style={{ height: "85%" }}
                  />
                  <div
                    className="w-1 animate-[pulse_1.8s_infinite] rounded-t bg-blue-300"
                    style={{ height: "50%" }}
                  />
                </div>
              </div>
            </div>

            {/* ─── FLOATING SERVICE CARDS ─── */}
            {serviceNodes.map((node) => {
              const isHovered = hoveredNode === node.id;

              return (
                <motion.div
                  key={node.id}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  className={`eco-card-node-${node.id} absolute z-20 cursor-pointer transition-all duration-500`}
                  style={{
                    left: `${(node.x / 1000) * 100}%`,
                    top: `${(node.y / 800) * 100}%`,
                    width: `${(node.w / 1000) * 100}%`,
                    height: `${(node.h / 800) * 100}%`,
                  }}
                  animate={isHovered ? { scale: 1.04, y: -8 } : { scale: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link href={`/services/${node.slug}`} className="block h-full">
                    {/* Glassmorphic Card Container */}
                    <div
                      className={`relative flex h-full flex-col justify-center overflow-hidden rounded-[24px] border bg-white/90 p-5 shadow-[0_4px_16px_rgba(0,0,0,0.015)] backdrop-blur-md transition-all duration-500 ${
                        isHovered
                          ? "shadow-[0_16px_36px_rgba(0,0,0,0.04)] border-transparent"
                          : "border-gray-100"
                      }`}
                    >
                      {/* Interactive Glow Aura on Hover */}
                      <div
                        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                        style={{
                          background: `radial-gradient(150px circle at 100% 100%, ${node.color}08, transparent)`,
                        }}
                      />

                      {/* Card border glow ring on hover */}
                      <div
                        className="pointer-events-none absolute -inset-px rounded-[24px] border-2 transition-all duration-500"
                        style={{
                          borderColor: node.color,
                          opacity: isHovered ? 0.22 : 0,
                          boxShadow: isHovered ? `0 0 16px ${node.color}15` : "none",
                        }}
                      />

                      <div className="relative z-10 flex items-center gap-4">
                        {/* Rounded square icon */}
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-transform duration-500"
                          style={{
                            backgroundColor: `${node.color}08`,
                            borderColor: `${node.color}18`,
                            color: node.color,
                            transform: isHovered ? "scale(1.08) rotate(4deg)" : "none",
                          }}
                        >
                          <Icon name={node.icon as IconName} className="h-5 w-5" />
                        </div>

                        {/* Title and Summary */}
                        <div className="flex min-w-0 flex-col justify-center pr-4">
                          <h3 className="mb-1 text-xs leading-snug font-black text-gray-900 xl:text-sm">
                            {node.title}
                          </h3>
                          <p className="mb-1 line-clamp-2 text-[10px] leading-normal text-gray-500 xl:text-[11px]">
                            {node.description}
                          </p>
                          <div
                            className={`text-[9px] font-black tracking-wider uppercase transition-all duration-300 ${
                              isHovered
                                ? "opacity-100 translate-y-0"
                                : "opacity-0 translate-y-1 pointer-events-none"
                            }`}
                            style={{ color: node.color }}
                          >
                            View Service
                          </div>
                        </div>

                        {/* End of content */}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* ─── MOBILE / TABLET GRID LAYOUT (md and down) ─── */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:hidden">
          {serviceNodes.map((node, index) => (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: (index % 2) * 0.1 }}
              className="group"
            >
              <Link href={`/services/${node.slug}`} className="block">
                <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
                      style={{
                        backgroundColor: `${node.color}08`,
                        borderColor: `${node.color}15`,
                        color: node.color,
                      }}
                    >
                      <Icon name={node.icon as IconName} className="h-5 w-5" />
                    </div>
                    {/* Details */}
                    <div className="flex-grow">
                      <h3 className="mb-1.5 text-sm font-bold text-gray-900 transition-colors group-hover:text-blue-600">
                        {node.title}
                      </h3>
                      <p className="mb-4 text-xs leading-relaxed text-gray-500">
                        {node.description}
                      </p>
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#1155CC]">
                        View Service
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Global CSS flows inside style block for high performant CSS SVG animations */}
      <style jsx global>{`
        /* Moving dotted particles animation */
        @keyframes flow-forward-anim {
          to {
            stroke-dashoffset: -120;
          }
        }
        @keyframes flow-reverse-anim {
          to {
            stroke-dashoffset: 120;
          }
        }
        .flowing-dash-forward {
          animation: flow-forward-anim 4.5s linear infinite;
        }
        .flowing-dash-reverse {
          animation: flow-reverse-anim 2s linear infinite;
        }
      `}</style>
    </section>
  );
}
