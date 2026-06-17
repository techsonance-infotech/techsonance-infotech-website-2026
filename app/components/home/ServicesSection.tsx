"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useMotionValue, useTransform, animate, useMotionTemplate } from "framer-motion";
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
    color: "#0D47A1", // blue
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
    color: "#3B82F6", // light blue
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
    description: "MVPs, product scaling and tech strategy to turn ideas into market-ready products.",
    icon: "lightbulb",
    color: "#8B5CF6", // violet
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
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.15 }
      );

      // Step 2: Scale center orb from 0.6 to 1
      tl.fromTo(
        ".eco-orb-container",
        { scale: 0.6, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1, ease: "elastic.out(1, 0.75)" },
        "-=0.4"
      );

      // Step 3: Animate connection lines drawing themselves
      tl.fromTo(
        ".connection-path",
        { strokeDasharray: "600", strokeDashoffset: "600" },
        { strokeDashoffset: "0", duration: 1.4, ease: "power3.inOut" },
        "-=0.7"
      );

      // Step 4: Service cards appear sequentially
      // Order requested: Top Left (0), Top Right (1), Middle Left (2), Middle Right (3), Bottom Left (4), Bottom Right (5), Bottom Center Left (6), Bottom Center Right (7)
      const order = [0, 1, 2, 3, 4, 5, 6, 7];
      order.forEach((nodeId, idx) => {
        tl.fromTo(
          `.eco-card-node-${nodeId}`,
          { scale: 0.85, opacity: 0, y: 20 },
          { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: "power3.out" },
          `-=${idx === 0 ? 0.9 : 0.42}`
        );
      });

      // Step 5: Fade in particle overlay and connection dash overlay flows
      tl.fromTo(
        [".eco-particle", ".flowing-dash-line"],
        { opacity: 0 },
        { opacity: 1, duration: 0.6 },
        "-=0.2"
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
      className="py-24 bg-[#F8FBFF] relative overflow-hidden border-t border-b border-gray-100 w-full"
    >
      {/* Background Fine Grid detail */}
      <div 
        className="absolute inset-0 opacity-[0.012] pointer-events-none" 
        style={{ 
          backgroundImage: "linear-gradient(#0D47A1 1px, transparent 1px), linear-gradient(90deg, #0D47A1 1px, transparent 1px)", 
          backgroundSize: "40px 40px" 
        }} 
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header Block */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="eco-header-anim inline-flex items-center gap-2 bg-[#E6EDF5] border border-[#0D47A1]/10 rounded-full px-4 py-1.5 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0D47A1] animate-pulse" />
            <span className="text-[10px] font-black text-[#0D47A1] tracking-widest uppercase">What We Do</span>
          </div>
          <h2 className="eco-header-anim text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-5 leading-tight">
            End-to-End Solutions. <br />
            <span className="bg-gradient-to-r from-[#0D47A1] to-[#008BD9] bg-clip-text text-transparent">Engineered for Growth.</span>
          </h2>
          <p className="eco-header-anim text-lg text-gray-600 leading-relaxed">
            We build powerful digital systems, automate operations with AI, and deliver scalable products that help businesses grow faster.
          </p>
        </div>

        {/* ─── DESKTOP FUTURISTIC ECOSYSTEM GRID (lg and up) ─── */}
        <div className="hidden lg:block relative w-full aspect-[1.25] max-w-6xl mx-auto select-none">
          
          {/* Parallax Background Layer (Particles, Orbs & Glows) */}
          <motion.div 
            style={{ x: bgX, y: bgY }}
            className="absolute inset-0 z-0 pointer-events-none"
          >
            {/* Subtle Volumetric Glow behind center hub */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-gradient-to-r from-blue-400/10 to-indigo-400/10 rounded-full blur-3xl mix-blend-screen" />
            
            {/* Hover Glow Background - shifts to match hovered service color */}
            {hoveredNode !== null && (
              <div 
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full blur-3xl opacity-40 transition-all duration-700 mix-blend-screen"
                style={{ backgroundColor: `${serviceNodes[hoveredNode].color}20` }}
              />
            )}

            {/* Floating particles */}
            <div className="absolute inset-0">
              <span className="eco-particle absolute w-1.5 h-1.5 bg-[#0D47A1]/20 rounded-full left-[12%] top-[20%] animate-pulse" />
              <span className="eco-particle absolute w-2 h-2 bg-[#7C3AED]/20 rounded-full left-[22%] top-[70%] animate-ping" style={{ animationDuration: "3s" }} />
              <span className="eco-particle absolute w-1.5 h-1.5 bg-[#0891B2]/30 rounded-full left-[85%] top-[15%] animate-pulse" />
              <span className="eco-particle absolute w-2.5 h-2.5 bg-pink-500/15 rounded-full left-[78%] top-[65%] animate-pulse" style={{ animationDuration: "4s" }} />
              <span className="eco-particle absolute w-1 h-1 bg-[#10B981]/40 rounded-full left-[48%] top-[10%] animate-pulse" />
              <span className="eco-particle absolute w-1.5 h-1.5 bg-amber-500/20 rounded-full left-[55%] top-[88%] animate-ping" style={{ animationDuration: "5s" }} />
            </div>
          </motion.div>

          {/* Parallax Foreground Layer (Central Hub, SVG Paths, Service Cards) */}
          <motion.div
            style={{ x: fgX, y: fgY }}
            className="absolute inset-0 z-10"
          >
            
            {/* SVG Connection System */}
            <svg 
              viewBox="0 0 1000 800" 
              className="absolute inset-0 w-full h-full pointer-events-none"
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
                    <stop offset="0%" stopColor="#0D47A1" stopOpacity="0.1" />
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
                        filter: `drop-shadow(0 0 4px ${node.color})`
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
                        filter: `drop-shadow(0 0 6px ${node.color})`
                      }}
                    />
                  </g>
                );
              })}
            </svg>

            {/* ─── CENTRAL ENGINE ORB ─── */}
            <div 
              className="eco-orb-container absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center pointer-events-none"
              style={{
                left: "50%",
                top: "50%",
              }}
            >
              {/* Outer Glowing Concentric Rings */}
              <div className="absolute w-[340px] h-[340px] rounded-full border border-blue-500/10 animate-[spin_25s_linear_infinite]" />
              <div className="absolute w-[300px] h-[300px] rounded-full border border-dashed border-blue-400/5 animate-[spin_35s_linear_infinite_reverse]" />
              <div 
                className="absolute w-[275px] h-[275px] rounded-full border border-[#0D47A1]/20 transition-all duration-500" 
                style={{
                  transform: hoveredNode !== null ? "scale(1.05)" : "scale(1)",
                  boxShadow: hoveredNode !== null 
                    ? `0 0 30px ${serviceNodes[hoveredNode].color}15`
                    : "0 0 20px rgba(13,71,161,0.05)"
                }}
              />
              
              {/* Interactive Core Engine Card */}
              <div 
                className={`w-[230px] h-[230px] rounded-full flex flex-col items-center justify-center p-6 text-center bg-[#07132B]/95 border border-[#0D47A1]/35 shadow-[0_0_60px_rgba(13,71,161,0.3)] z-30 transition-all duration-500 ${
                  hoveredNode !== null ? "scale-[1.03]" : "scale-100"
                }`}
                style={{
                  borderColor: hoveredNode !== null ? serviceNodes[hoveredNode].color : "#0D47A1"
                }}
              >
                {/* Tech logo mark */}
                <div className="mb-2 shrink-0">
                  <svg className="h-9 w-9 text-blue-400" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 10L18 4L30 10V26L18 32L6 26V10Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                    <path d="M18 4V32" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3"/>
                    <path d="M6 10L30 26" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M30 10L6 26" stroke="currentColor" strokeWidth="1.5"/>
                    <circle cx="18" cy="18" r="5" fill="#07132B" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                
                <h4 className="text-[10px] font-black tracking-widest text-blue-400 uppercase mb-1">
                  Your Business
                </h4>
                <h3 className="text-lg font-black text-white leading-tight mb-2 tracking-tight">
                  Growth Engine
                </h3>
                
                <div className="w-16 h-[1px] bg-gray-700/80 mb-3 mx-auto" />
                
                <p className="text-[8px] font-bold text-gray-400 tracking-wider uppercase leading-relaxed max-w-[150px]">
                  Technology • Automation • Scale
                </p>

                {/* Animated Mini status graph */}
                <div className="flex items-end gap-1.5 mt-3 h-5 justify-center">
                  <div className="w-1 bg-blue-500/60 rounded-t animate-[pulse_1.2s_infinite]" style={{ height: "40%" }} />
                  <div className="w-1 bg-blue-400 rounded-t animate-[pulse_1.5s_infinite]" style={{ height: "65%" }} />
                  <div className="w-1 bg-[#008BD9] rounded-t animate-[pulse_1s_infinite]" style={{ height: "85%" }} />
                  <div className="w-1 bg-blue-300 rounded-t animate-[pulse_1.8s_infinite]" style={{ height: "50%" }} />
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
                  className={`eco-card-node-${node.id} absolute z-20 transition-all duration-500 cursor-pointer`}
                  style={{
                    left: `${(node.x / 1000) * 100}%`,
                    top: `${(node.y / 800) * 100}%`,
                    width: `${(node.w / 1000) * 100}%`,
                    height: `${(node.h / 800) * 100}%`,
                  }}
                  animate={
                    isHovered 
                      ? { scale: 1.04, y: -8 }
                      : { scale: 1, y: 0 }
                  }
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link href={`/services/${node.slug}`} className="block h-full">
                    {/* Glassmorphic Card Container */}
                    <div 
                      className={`h-full bg-white/90 backdrop-blur-md border rounded-[24px] p-5 shadow-[0_4px_16px_rgba(0,0,0,0.015)] transition-all duration-500 relative overflow-hidden flex flex-col justify-center ${
                        isHovered 
                          ? "shadow-[0_16px_36px_rgba(0,0,0,0.04)] border-transparent" 
                          : "border-gray-100"
                      }`}
                    >
                      {/* Interactive Glow Aura on Hover */}
                      <div 
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                        style={{
                          background: `radial-gradient(150px circle at 100% 100%, ${node.color}08, transparent)`
                        }}
                      />

                      {/* Card border glow ring on hover */}
                      <div 
                        className="absolute -inset-px rounded-[24px] border-2 pointer-events-none transition-all duration-500"
                        style={{ 
                          borderColor: node.color,
                          opacity: isHovered ? 0.22 : 0,
                          boxShadow: isHovered ? `0 0 16px ${node.color}15` : 'none'
                        }}
                      />

                      <div className="flex items-center gap-4 relative z-10">
                        {/* Rounded square icon */}
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-500"
                          style={{
                            backgroundColor: `${node.color}08`,
                            borderColor: `${node.color}18`,
                            color: node.color,
                            transform: isHovered ? "scale(1.08) rotate(4deg)" : "none"
                          }}
                        >
                          <Icon name={node.icon as IconName} className="w-5 h-5" />
                        </div>

                        {/* Title and Summary */}
                        <div className="min-w-0 pr-4">
                          <h3 className="text-xs xl:text-sm font-black text-gray-900 leading-snug mb-1">
                            {node.title}
                          </h3>
                          <p className="text-[10px] xl:text-[11px] text-gray-500 leading-normal line-clamp-2">
                            {node.description}
                          </p>
                        </div>

                        {/* Edge-aligned indicator button (visual link connector) */}
                        <div 
                          className="w-7 h-7 rounded-full border flex items-center justify-center absolute transition-all duration-500 shrink-0"
                          style={{
                            right: node.side === "left" ? "-28px" : "auto",
                            left: node.side === "right" ? "-28px" : "auto",
                            backgroundColor: isHovered ? node.color : "#FFFFFF",
                            borderColor: isHovered ? node.color : "#E2E8F0",
                            color: isHovered ? "#FFFFFF" : "#94A3B8",
                            boxShadow: isHovered ? `0 0 12px ${node.color}40` : "none",
                            transform: isHovered ? "scale(1.15)" : "scale(1)"
                          }}
                        >
                          {isHovered ? (
                            <span className="text-[8px] font-black uppercase text-white px-1 whitespace-nowrap opacity-0 pointer-events-none">View Service</span>
                          ) : null}
                          <Icon 
                            name="arrow" 
                            className={`w-3.5 h-3.5 transition-transform duration-300 ${
                              node.side === "right" ? "rotate-180" : ""
                            } ${isHovered && node.side === "left" ? "translate-x-[1px]" : ""} ${
                              isHovered && node.side === "right" ? "-translate-x-[1px]" : ""
                            }`} 
                          />
                        </div>
                      </div>

                      {/* Hover text label */}
                      <div 
                        className={`absolute bottom-3 right-5 text-[9px] font-black tracking-wider uppercase transition-opacity duration-300 ${
                          isHovered ? "opacity-100" : "opacity-0"
                        }`}
                        style={{ color: node.color }}
                      >
                        View Service →
                      </div>

                    </div>
                  </Link>
                </motion.div>
              );
            })}

          </motion.div>
        </div>

        {/* ─── MOBILE / TABLET GRID LAYOUT (md and down) ─── */}
        <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div 
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border"
                      style={{
                        backgroundColor: `${node.color}08`,
                        borderColor: `${node.color}15`,
                        color: node.color
                      }}
                    >
                      <Icon name={node.icon as IconName} className="w-5 h-5" />
                    </div>
                    {/* Details */}
                    <div className="flex-grow">
                      <h3 className="font-bold text-gray-900 text-sm mb-1.5 group-hover:text-blue-600 transition-colors">
                        {node.title}
                      </h3>
                      <p className="text-xs text-gray-500 leading-relaxed mb-4">
                        {node.description}
                      </p>
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0D47A1]">
                        View Service
                        <Icon name="arrow" className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1 duration-300" />
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
