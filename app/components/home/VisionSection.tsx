"use client";
import React from "react";
import { motion } from "framer-motion";
import SemiCircleDashboard from "./vision/SemiCircleDashboard";
import Stats from "./vision/Stats";
import { AvatarGroup, StatItem } from "./vision/types";

// Unified grouped team avatar data with exactly 5 members per category
const GROUPS: AvatarGroup[] = [
  {
    id: "g-core",
    title: "Our Core Team",
    members: [
      { id: "ct-1", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80" },
      { id: "ct-2", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80" },
      { id: "ct-3", avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&h=150&q=80" },
      { id: "ct-4", avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80" },
      { id: "ct-5", avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&h=150&q=80" },
    ],
  },
  {
    id: "g-talent",
    title: "Talent",
    members: [
      { id: "t-1", avatarUrl: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=150&h=150&q=80" },
      { id: "t-2", avatarUrl: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=150&h=150&q=80" },
      { id: "t-3", avatarUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&h=150&q=80" },
      { id: "t-4", avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&h=150&q=80" },
      { id: "t-5", avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&h=150&q=80" },
    ],
  },
  {
    id: "g-experts",
    title: "Experts",
    members: [
      { id: "e-1", avatarUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&h=150&q=80" },
      { id: "e-2", avatarUrl: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=150&h=150&q=80" },
      { id: "e-3", avatarUrl: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=150&h=150&q=80" },
      { id: "e-4", avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&h=150&q=80" },
      { id: "e-5", avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&h=150&q=80" },
    ],
  },
];

const STATS_ITEMS: StatItem[] = [
  { value: "10+", label: "Projects Delivered" },
  { value: "100%", label: "Client Satisfaction" },
];

export default function VisionSection() {
  return (
    <section className="w-full bg-[#F8FAFC] max-w-7xl mx-auto relative overflow-hidden select-none">
      {/* Container max-width 1440px with exact padding constraints */}
      <div className="max-w-[1440px] mx-auto px-[24px] sm:px-[40px] lg:px-[60px] py-[60px] sm:py-[80px] lg:py-[100px] flex flex-col lg:flex-row gap-12 lg:gap-[120px] justify-between items-start">

        {/* Left Column: Heading and semi-circular dashboard (flex-1 max-w-480px) */}
        <div className="flex-1 w-full lg:max-w-[480px] flex flex-col justify-start">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-[36px] sm:text-[46px] lg:text-[56px] font-medium leading-[1.15] tracking-tight text-[#111827] tracking-tight"
          >
            <span className="lg:whitespace-nowrap">A Team of Builders &amp;</span><br />
            <span className="italic text-[#2563EB] font-medium">Innovators</span>
          </motion.h2>

          {/* Semicircle Dashboard (moved upward to sit close to the title) */}
          <div className="mt-6 lg:mt-[24px] w-full">
            <SemiCircleDashboard groups={GROUPS} />
          </div>
        </div>

        {/* Right Column: Paragraph and stats (flex-1 max-w-480px) */}
        <div className="flex-1 w-full lg:max-w-[480px] flex flex-col justify-start space-y-6 lg:space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="space-y-6 animate-fade-in"
          >
            <h3 className="text-[20px] sm:text-[22px] lg:text-[24px] font-semibold text-[#111827] leading-[1.45]">
              we combine creativity with engineering discipline to build products that users love.
            </h3>
            <p className="text-[16px] sm:text-[17px] lg:text-[18px] font-normal text-[#6B7280] leading-relaxed">
              From <span className="font-semibold text-gray-800">early-stage</span> startups to established enterprises, we help our clients transform complex problems into simple, elegant solutions.
            </p>
          </motion.div>

          {/* Metric Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            className="w-full"
          >
            <Stats items={STATS_ITEMS} />
          </motion.div>
        </div>

      </div>
    </section>
  );
}

// ==========================================
// ORIGINAL VISION SECTION CODE (PRESERVED)
// ==========================================
// export const visionBenefits = [
//   {
//     icon: "bolt" as const,
//     title: "Automate Processes",
//     description: "Eliminate manual work and improve efficiency.",
//   },
//   {
//     icon: "database" as const,
//     title: "Reduce Costs",
//     description: "Smart engineering that reduces operational costs.",
//   },
//   {
//     icon: "trend" as const,
//     title: "Drive Growth",
//     description: "Scalable solutions that accelerate business growth.",
//   },
// ];
//
// export function OriginalVisionSection() {
//   return (
//     <section className="w-full py-20 bg-[#f9f9ff] relative overflow-hidden">
//       {/* Background Animated Orbits (Margins) */}
//       {/* Top Right Orbit */}
//       <div className="absolute right-[-150px] top-[-150px] w-[500px] h-[500px] pointer-events-none hidden md:block opacity-90 z-0">
//         {/* Outer orbit (dashed) */}
//         <div className="absolute inset-0 border-2 border-dashed border-[#0066ff]/40 rounded-full animate-[spin_80s_linear_infinite]">
//           {/* Floating Icon 1: React */}
//           <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center border border-[#e7eeff]">
//             <svg className="w-5 h-5 text-[#00ccf9] animate-[spin_10s_linear_infinite]" viewBox="-11.5 -10.23174 23 20.46348" fill="none" stroke="currentColor" strokeWidth="1.5">
//               <circle r="2.05" fill="currentColor" />
//               <ellipse rx="11" ry="4.2" />
//               <ellipse rx="11" ry="4.2" transform="rotate(60)" />
//               <ellipse rx="11" ry="4.2" transform="rotate(120)" />
//             </svg>
//           </div>
//           {/* Floating Icon 2: Next.js */}
//           <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center border border-[#e7eeff]">
//             <svg className="w-5 h-5 text-[#111c2d]" viewBox="0 0 180 180" fill="none">
//               <mask id="next-mask-bg" maskUnits="userSpaceOnUse" x="0" y="0" width="180" height="180">
//                 <circle cx="90" cy="90" r="90" fill="black" />
//               </mask>
//               <g mask="url(#next-mask-bg)">
//                 <circle cx="90" cy="90" r="90" fill="currentColor" />
//                 <path d="M149.508 157.52L69.142 54H54v72h14.4V78.37l70.737 91.24a90.36 90.36 0 0010.371-12.09z" fill="white" />
//                 <path d="M115.2 54v72h14.4V54H115.2z" fill="white" />
//               </g>
//             </svg>
//           </div>
//         </div>
//
//         {/* Middle Orbit */}
//         <div className="absolute inset-16 border-2 border-[#5d60eb]/30 rounded-full animate-[spin_50s_linear_infinite_reverse]">
//           {/* Floating Icon 3: Tailwind */}
//           <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center border border-[#e7eeff]">
//             <svg className="w-5 h-5 text-[#00ccf9]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//               <path d="M12 6.00001C12.5 3.00001 15 1.50001 20 1.50001C21 6.50001 19.5 9.00001 15.5 10C19.5 11 21 13.5 20 18.5C15 18.5 12.5 17 12 14C11.5 17 9 18.5 4 18.5C3 13.5 4.5 11 8.5 10C4.5 9.00001 3 6.50001 4 1.50001C9 1.50001 11.5 3.00001 12 6.00001Z" />
//             </svg>
//           </div>
//         </div>
//
//         {/* Inner Orbit SVG detailing */}
//         <div className="absolute inset-32 border border-[#0066ff]/20 rounded-full flex items-center justify-center">
//           <svg className="w-full h-full text-[#0066ff]/20" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
//             <path d="M 50 10 A 40 40 0 0 1 90 50" strokeDasharray="2 2" />
//             <path d="M 50 90 A 40 40 0 0 1 10 50" />
//             <path d="M 15 50 A 35 35 0 0 1 85 50" strokeDasharray="4 2" />
//           </svg>
//         </div>
//
//         {/* Center glow */}
//         <div className="absolute inset-[180px] rounded-full bg-gradient-to-tr from-[#0066ff] to-[#1155CC] opacity-20 blur-xl" />
//       </div>
//
//       {/* Bottom Left Orbit */}
//       <div className="absolute left-[-120px] bottom-[-120px] w-[400px] h-[400px] pointer-events-none hidden md:block opacity-90 z-0">
//         {/* Outer orbit (dashed) */}
//         <div className="absolute inset-0 border-2 border-dashed border-[#1155CC]/30 rounded-full animate-[spin_60s_linear_infinite_reverse]">
//           {/* Floating Icon 4: TypeScript */}
//           <div className="absolute bottom-1/2 left-0 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center border border-[#e7eeff]">
//             <svg className="w-5 h-5 text-[#1155CC]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//               <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" />
//               <path d="M7 10h4" />
//               <path d="M9 10v6" />
//               <path d="M15 10c.8 0 1.5.7 1.5 1.5v3c0 .8-.7 1.5-1.5 1.5h-1" />
//               <path d="M14 13h2" />
//             </svg>
//           </div>
//         </div>
//
//         {/* Inner Orbit */}
//         <div className="absolute inset-16 border-2 border-[#0066ff]/20 rounded-full" />
//
//         {/* Center glow */}
//         <div className="absolute inset-[130px] rounded-full bg-gradient-to-br from-[#1155CC] to-[#00ccf9] opacity-20 blur-xl" />
//       </div>
//
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
//         <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-12 items-center relative overflow-hidden">
//           {/* Ambient Glows */}
//           <div className="absolute -left-20 -bottom-20 w-64 h-64 rounded-full bg-[#1155CC]/10 blur-3xl pointer-events-none" />
//           <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-[#0066ff]/10 blur-3xl pointer-events-none" />
//
//           {/* Left Column */}
//           <div className="lg:w-1/2 space-y-6 relative z-10">
//             <h2 className="text-4xl lg:text-6xl font-medium text-gray-900 leading-tight">
//               Your Vision.
//               <br />
//               <span className="text-[#1155CC]">
//                 Our Engineering.
//                 <br />
//                 Real Results.
//               </span>
//             </h2>
//             <p className="text-lg text-gray-600 leading-relaxed max-w-lg">
//               From idea to execution, we build intelligent software solutions
//               that help your business grow, scale and lead.
//             </p>
//           </div>
//
//           {/* Right Column: Benefit Cards */}
//           <div className="lg:w-1/2 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-1 gap-6 w-full relative z-10">
//             {visionBenefits.map((benefit) => (
//               <div
//                 key={benefit.title}
//                 className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_20px_rgba(17, 85, 204,0.08)] hover:border-[#1155CC]/15 transition-all group"
//               >
//                 <span className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#1155CC] shrink-0">
//                   {/* icon placeholder or component */}
//                 </span>
//                 <div>
//                   <h4 className="font-bold text-gray-900 mb-1 text-base">{benefit.title}</h4>
//                   <p className="text-sm text-gray-600">{benefit.description}</p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }
