"use client";
import React, { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Icon } from "@/app/components/icons/Icon";
import BookConsultationModal from "@/app/components/home/BookConsultationModal";
import { Button } from "@/components/ui/button";

function HeroCTAButtons({ onBookClick }: { onBookClick: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
      <Button
        onClick={onBookClick}
        variant="primary"
        size="default"
        showArrow
      >
        Book Free Consultation
      </Button>

      <Button
        asChild
        variant="secondary"
        size="default"
        showArrow
      >
        <a href="#">View Case Studies</a>
      </Button>
    </div>
  );
}

function HeroHeadline() {
  return (
    <h1 className="text-[2.25rem] font-medium leading-[1.15] tracking-tight text-gray-900 sm:text-5xl md:text-6xl lg:text-[4rem] 2xl:text-[4.5rem]">
      We Build <span className="italic text-[#1155CC]">Digital Products</span>
      <br />
      That Drive Growth.
    </h1>
  );
}

/**
 * ---------------------------------------------------------------------------
 * Trusted-clients marquee
 * ---------------------------------------------------------------------------
 * Real client logos, shown in full color at all times (no grayscale
 * treatment — these are polished brand marks, not placeholder text, so
 * desaturating them would waste that work). Each logo card is a fixed
 * height with `object-contain`, so wildly different logo aspect ratios
 * (a wide horizontal wordmark vs. a compact square mark) all sit on the
 * same visual baseline instead of some looking huge and others tiny.
 *
 * Mechanics: the track is duplicated once and the whole pair animates with
 * a single `translateX(-50%)` keyframe — since the second copy is
 * pixel-identical to the first, the loop point is invisible, so it reads as
 * a genuinely infinite stream rather than a strip that resets/jumps.
 */
interface ClientLogoData {
  name: string;
  url: string;
  src: string;
  /** Some logos (e.g. wide wordmarks) need more width than others to render
   * at a comparable visual size — kept per-logo rather than forcing one
   * fixed width on every card. */
  width: number;
  className?: string;
}

const trustedClients: ClientLogoData[] = [
  { name: "Zion", url: "/portfolio/zion", src: "/images/clients/zion.png", width: 180, className: "h-10 sm:h-12 scale-125" },
  { name: "Utsav", url: "/portfolio/utsav", src: "/images/clients/utsav.png", width: 150, className: "h-9 sm:h-11 scale-110" },
  { name: "AccuNest", url: "https://accunest.techsonance.co.in/", src: "/images/clients/accunest.webp", width: 150 },
  { name: "TechSonance Marketplace", url: "https://marketplace.techsonance.co.in/", src: "/images/clients/marketplace.png", width: 170 },
  { name: "SyncServe", url: "https://syncserve.techsonance.co.in/", src: "/images/clients/syncserve.png", width: 140 },
  { name: "FreightFlow", url: "https://freightflow.techsonance.co.in/", src: "/images/clients/freightflow.png", width: 240 },
  { name: "Masterweg", url: "https://masterweg.com/", src: "/images/clients/masterweg.png", width: 150 },
];

function ClientLogo({ client }: { client: ClientLogoData }) {
  const isExternal = client.url.startsWith("http");
  return (
    <a
      href={client.url}
      {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="flex h-16 shrink-0 items-center justify-center px-8 transition-transform duration-300 ease-out hover:-translate-y-0.5 hover:scale-105"
      aria-label={client.name}
    >
      <Image
        src={client.src}
        alt={client.name}
        width={client.width}
        height={48}
        loading="eager"
        className={`w-auto object-contain ${client.className || "h-8 sm:h-10"}`}
      />
    </a>
  );
}

function TrustedClientsMarquee() {
  return (
    <div className="w-full border-t border-gray-100 py-10">
      <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">
        Engineered &amp; Trusted by Global Clients
      </p>

      <div
        className="relative w-full overflow-hidden"
        style={{ maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)" }}
      >
        <div className="marquee-track flex w-max items-center">
          {[...trustedClients, ...trustedClients].map((client, i) => (
            <ClientLogo key={`${client.name}-${i}`} client={client} />
          ))}
        </div>
      </div>

      <style jsx>{`
        .marquee-track {
          animation: marquee-scroll 28s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
        @keyframes marquee-scroll {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}

export default function HeroSection() {
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  return (
    <>
      <section className="relative flex flex-col items-center overflow-hidden bg-white px-4 sm:px-6 xl:px-10 min-[1920px]:px-15 pb-4 pt-30 sm:pt-36 lg:pt-40">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mx-auto flex w-full max-w-4xl flex-col items-center text-center"
        >
          <HeroHeadline />

          <p className="mt-6 max-w-xl text-base leading-relaxed text-gray-500 sm:text-lg">
            From startups to global brands. we design, develop, and deliver
            high-performing web and mobile solutions that turn ideas into
            impact.
          </p>

          <div className="mt-10">
            <HeroCTAButtons onBookClick={() => setIsBookModalOpen(true)} />
          </div>
        </motion.div>

        <div className="mt-20 w-full max-w-7xl mx-auto">
          <TrustedClientsMarquee />
        </div>
      </section>
      <BookConsultationModal isOpen={isBookModalOpen} onClose={() => setIsBookModalOpen(false)} />
    </>
  );
}

// "use client";
// import React, { useState } from "react";
// import { motion } from "framer-motion";
// import { Icon } from "@/app/components/icons/Icon";
// import BookConsultationModal from "@/app/components/home/BookConsultationModal";

// /**
//  * ---------------------------------------------------------------------------
//  * Design intent (matched from the reference):
//  * - Centered, single-column layout — no side illustration competing for
//  *   attention. The headline IS the visual.
//  * - Huge, confident type with a mixed weight/style treatment (regular +
//  *   italic) instead of a flat block of bold text.
//  * - Two pill-shaped CTAs: one solid (primary), one outline (secondary) —
//  *   both quiet in color so the type stays the hero, not the buttons.
//  * - Generous vertical whitespace above and below; nothing else on the page
//  *   competes with this block.
//  * ---------------------------------------------------------------------------
//  */

// function HeroCTAButtons({ onBookClick }: { onBookClick: () => void }) {
//   return (
//     <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
//       <button
//         onClick={onBookClick}
//         className="group relative flex cursor-pointer items-center gap-2 overflow-hidden rounded-full bg-[#1155CC] px-7 py-3.5 text-sm
//         font-semibold uppercase tracking-wide text-white shadow-[0_4px_14px_rgba(17,85,204,0.35)] transition-all duration-300 ease-out
//         hover:-translate-y-0.5 hover:bg-[#0d3f99] hover:shadow-[0_10px_28px_rgba(17,85,204,0.45)] active:translate-y-0 active:shadow-[0_4px_14px_rgba(17,85,204,0.35)]"
//       >
//         {/* subtle diagonal sheen that sweeps across on hover */}
//         <span
//           className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent
//           transition-transform duration-700 ease-out group-hover:translate-x-full"
//         />
//         <span className="relative">Book Free Consultation</span>
//         <Icon name="arrow" className="relative h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1" />
//       </button>
 
//       <a
//         href="#"
//         className="group relative flex items-center gap-2 rounded-full border border-gray-300 px-7 py-3.5 text-sm font-semibold
//         uppercase tracking-wide text-gray-800 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-[#1155CC]
//         hover:text-[#1155CC] hover:shadow-[0_8px_20px_rgba(17,85,204,0.15)] active:translate-y-0"
//       >
//         View Case Studies
//         <Icon
//           name="arrow"
//           className="h-4 w-4 -translate-x-1 opacity-0 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:opacity-100"
//         />
//       </a>
//     </div>
//   );
// }

// function HeroHeadline() {
//   return (
//     <h1 className="text-[2.25rem] font-medium leading-[1.15] tracking-tight text-gray-900 sm:text-5xl md:text-6xl lg:text-[4rem] 2xl:text-[4.5rem]">
//       We Build <span className="italic text-[#1155CC]">Digital Products</span>
//       <br />
//       That Drive Growth.
//     </h1>
//   );
// }

// export default function HeroSection() {
//   const [isBookModalOpen, setIsBookModalOpen] = useState(false);

//   return (
//     <>
//       <section className="relative flex items-center justify-center overflow-hidden bg-white px-4 py-28 sm:px-6 sm:py-32 lg:py-36">
//         <motion.div
//           initial={{ opacity: 0, y: 16 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.5, ease: "easeOut" }}
//           className="mx-auto flex w-full max-w-4xl flex-col items-center text-center"
//         >
//           <HeroHeadline />

//           <p className="mt-6 max-w-xl text-base leading-relaxed text-gray-500 sm:text-lg">
//             From startups to global brands, we design, develop, and deliver
//             high-performing web and mobile solutions that turn ideas into
//             impact.
//           </p>

//           <div className="mt-10">
//             <HeroCTAButtons onBookClick={() => setIsBookModalOpen(true)} />
//           </div>
//         </motion.div>
//       </section>
//       <BookConsultationModal isOpen={isBookModalOpen} onClose={() => setIsBookModalOpen(false)} />
//     </>
//   );
// }

// "use client";
// import React, { useState } from "react";
// import Image from "next/image";
// import { motion, type Variants } from "framer-motion";
// import { Icon, type IconName } from "@/app/components/icons/Icon";
// import BookConsultationModal from "@/app/components/home/BookConsultationModal";

// /**
//  * ---------------------------------------------------------------------------
//  * Types
//  * ---------------------------------------------------------------------------
//  */
// interface HeroNodeData {
//   icon: IconName;
//   title: string;
//   className: string; // positional utility classes (%-based, scales with parent)
//   color: string;
//   animation: "floatOne" | "floatTwo" | "floatThree";
// }

// interface TrustItemData {
//   text: string;
//   icon: IconName;
// }

// /**
//  * ---------------------------------------------------------------------------
//  * Data
//  * ---------------------------------------------------------------------------
//  */
// export const heroNodes: HeroNodeData[] = [
//   {
//     icon: "code",
//     title: "Custom Software Development",
//     className: "left-1/2 top-[8%] -translate-x-1/2",
//     color: "text-[#1155CC] bg-[#EDF5FF]",
//     animation: "floatOne",
//   },
//   {
//     icon: "database",
//     title: "RAG Pipeline Development",
//     className: "right-[4%] top-[34%]",
//     color: "text-[#A855F7] bg-[#FAF0FF]",
//     animation: "floatTwo",
//   },
//   {
//     icon: "cloud",
//     title: "SaaS Product Development",
//     className: "bottom-[18%] right-[14%]",
//     color: "text-[#6366F1] bg-[#EEF2FF]",
//     animation: "floatThree",
//   },
//   {
//     icon: "box",
//     title: "AI Orchestration & Engineering",
//     className: "bottom-[18%] left-[14%]",
//     color: "text-[#0F766E] bg-[#ECFDF5]",
//     animation: "floatTwo",
//   },
//   {
//     icon: "bolt",
//     title: "AI Integration",
//     className: "left-[4%] top-[34%]",
//     color: "text-[#0891B2] bg-[#ECFEFF]",
//     animation: "floatOne",
//   },
// ];

// export const trustItems: TrustItemData[] = [
//   { text: "No Obligations", icon: "check" },
//   { text: "Expert Guidance", icon: "check" },
//   { text: "Quick Response", icon: "check" },
// ];

// const NODE_FLOAT_VARIANTS: Variants = {
//   floatOne: { y: [0, -10, 0] },
//   floatTwo: { y: [0, -14, 0], x: [0, 5, 0] },
//   floatThree: { y: [0, -8, 0], x: [0, -7, 0] },
// };

// /**
//  * ---------------------------------------------------------------------------
//  * IMPORTANT — why fixed breakpoint steps instead of vw/clamp():
//  * The right-hand diagram lives inside a grid column that is roughly HALF the
//  * viewport width (once the layout goes two-column), not the full viewport.
//  * Any `vw`-based size (e.g. `11vw`) is calculated against the FULL viewport,
//  * so it renders far too large for the space it actually has — this was the
//  * root cause of the oversized headline (wrapped to 3 lines) and the
//  * cramped/overlapping diagram nodes on a ~1440–1500px window.
//  * Fixed px/rem steps per breakpoint are chosen against the real column
//  * width at that breakpoint, so they can never overshoot their container.
//  * ---------------------------------------------------------------------------
//  */

// function EyebrowBadge({ label }: { label: string }) {
//   return (
//     <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#1155CC]/15 bg-[#F1F5F9] px-4 py-1.5">
//       <span className="text-[11px] font-bold uppercase tracking-wide text-[#1155CC] sm:text-xs">
//         {label}
//       </span>
//     </div>
//   );
// }

// function TrustBadgeList({ items }: { items: TrustItemData[] }) {
//   return (
//     <div className="grid grid-cols-1 gap-4 pt-3.5 sm:grid-cols-3">
//       {items.map((item) => (
//         <span
//           key={item.text}
//           className="flex items-center gap-3 text-sm font-semibold text-gray-700"
//         >
//           <span className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-full border border-[#1155CC]/10 bg-[#1155CC]/10 p-1.5 text-[#1155CC] shadow-sm">
//             <Icon name={item.icon} className="h-4.5 w-4.5 stroke-[2.8]" />
//           </span>
//           {item.text}
//         </span>
//       ))}
//     </div>
//   );
// }

// function HeroCTAButtons({ onBookClick }: { onBookClick: () => void }) {
//   return (
//     <div className="flex flex-col gap-3 sm:flex-row">
//       <button
//         onClick={onBookClick}
//         className="btn-primary flex cursor-pointer items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold"
//       >
//         Book Free Consultation
//         <Icon name="arrow" className="h-5 w-5" />
//       </button>
//       <a
//         href="#"
//         className="btn-outline flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold"
//       >
//         View Case Studies
//         <Icon name="arrow" className="h-5 w-5" />
//       </a>
//     </div>
//   );
// }

// function HeroContent({ onBookClick }: { onBookClick: () => void }) {
//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.5, ease: "easeOut" }}
//       className="flex flex-col gap-5 lg:pr-6 xl:pr-10"
//     >
//       <EyebrowBadge label="AI & Custom Software Engineering Partner" />

//       {/*
//         Sizes are chosen for the LEFT COLUMN width, not the viewport:
//         ~40px column font at lg (two-col starts here) keeps "We Build Digital
//         Products" on one line even on a ~700px column, and only grows once
//         there's genuinely more room (xl/2xl/4K).
//       */}
//       <h1 className="text-[1.9rem] font-medium leading-[1.4] tracking-tight text-gray-900 sm:text-4xl lg:text-[2.5rem] xl:text-5xl 2xl:text-[3.25rem] min-[2560px]:text-6xl">
//         We Build Digital Products
//         <br />
//         <span className="text-[#1155CC]">That Drive Growth.</span>
//       </h1>

//       <p className="max-w-lg text-base leading-relaxed text-gray-600 sm:text-lg 2xl:text-xl">
//         We build custom web applications, SaaS platforms, AI integrations,
//         RAG pipelines and intelligent solutions that help businesses
//         innovate, automate and scale.
//       </p>

//       <HeroCTAButtons onBookClick={onBookClick} />
//       <TrustBadgeList items={trustItems} />
//     </motion.div>
//   );
// }

// function HeroCenterLogo() {
//   return (
//     <div className="absolute z-20 flex h-20 w-20 flex-col items-center justify-center rounded-full border-4 border-blue-50 bg-white shadow-[0_0_30px_rgba(0,102,255,0.15)] sm:h-24 sm:w-24 md:h-28 md:w-28 xl:h-32 xl:w-32 2xl:h-36 2xl:w-36">
//       <Image
//         src="/images/logo-icon.png"
//         alt="TechSonance logo"
//         width={40}
//         height={40}
//         className="mb-0.5 h-6 w-6 object-contain sm:h-7 sm:w-7 md:h-8 md:w-8 xl:h-9 xl:w-9 2xl:h-10 2xl:w-10"
//         priority
//       />
//       <span className="text-center text-[10px] font-bold leading-tight text-[#111827] sm:text-xs md:text-sm">
//         TechSonance
//       </span>
//       <span className="mt-0.5 text-center text-[7px] font-medium leading-tight text-[#6B7280] sm:text-[8px] md:text-[9px]">
//         Engineering
//         <br />
//         Excellence
//       </span>
//     </div>
//   );
// }

// function HeroNodeCard({ node }: { node: HeroNodeData }) {
//   return (
//     <motion.div
//       animate={node.animation}
//       variants={NODE_FLOAT_VARIANTS}
//       transition={{
//         duration: node.animation === "floatTwo" ? 8 : 6,
//         repeat: Infinity,
//         ease: "easeInOut",
//       }}
//       className={`absolute z-10 flex w-[84px] flex-col items-center justify-center rounded-xl border
//       border-gray-100 bg-white/90 p-1.5 text-center shadow-lg backdrop-blur-sm sm:w-[100px] sm:rounded-2xl
//       sm:p-2 md:w-[118px] xl:w-[132px] xl:p-3 2xl:w-[150px] ${node.className}`}
//     >
//       <span
//         className={`mb-1 flex h-5 w-5 items-center justify-center rounded-full sm:mb-2 sm:h-6 sm:w-6 md:h-7 md:w-7 ${node.color}`}
//       >
//         <Icon name={node.icon} className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
//       </span>
//       <span className="text-[8px] font-semibold leading-tight text-gray-900 sm:text-[9px] md:text-[10px] xl:text-[11px]">
//         {node.title}
//       </span>
//     </motion.div>
//   );
// }

// function HeroDiagramRings() {
//   return (
//     <svg
//       className="pointer-events-none absolute inset-0 h-full w-full"
//       viewBox="0 0 100 100"
//       aria-hidden="true"
//     >
//       <circle cx="50" cy="50" r="28" fill="none" stroke="#DDE8F5" strokeDasharray="1.4 2.2" strokeWidth="0.35" />
//       <circle cx="50" cy="50" r="40" fill="none" stroke="#DDE8F5" strokeDasharray="1.4 2.2" strokeWidth="0.35" />
//       <line x1="50" x2="50" y1="50" y2="16" stroke="#CBD8EA" strokeWidth="0.35" />
//       <line x1="50" x2="82" y1="50" y2="42" stroke="#CBD8EA" strokeWidth="0.35" />
//       <line x1="50" x2="72" y1="50" y2="74" stroke="#CBD8EA" strokeWidth="0.35" />
//       <line x1="50" x2="28" y1="50" y2="74" stroke="#CBD8EA" strokeWidth="0.35" />
//       <line x1="50" x2="18" y1="50" y2="42" stroke="#CBD8EA" strokeWidth="0.35" />
//     </svg>
//   );
// }

// function HeroDiagram() {
//   return (
//     <motion.div
//       initial={{ opacity: 0, scale: 0.98 }}
//       animate={{ opacity: 1, scale: 1 }}
//       transition={{ duration: 0.55, ease: "easeOut", delay: 0.1 }}
//       className="relative mx-auto mt-10 w-full max-w-[300px] rounded-3xl p-3 sm:max-w-[360px] md:max-w-[420px]
//       lg:mt-0 lg:max-w-[440px] xl:max-w-[520px] xl:p-5 2xl:max-w-[600px] min-[2560px]:max-w-[720px]"
//     >
//       <div className="relative flex aspect-square w-full items-center justify-center">
//         <HeroDiagramRings />
//         <HeroCenterLogo />
//         {heroNodes.map((node) => (
//           <HeroNodeCard key={node.title} node={node} />
//         ))}
//       </div>
//     </motion.div>
//   );
// }

// /**
//  * ---------------------------------------------------------------------------
//  * Section (composition root)
//  * No more forced `min-height: 100vh` — that was creating dead space below
//  * the content on shorter/ultra-wide viewports (e.g. 1920×1080). The section
//  * now sizes itself to its content plus comfortable top/bottom breathing
//  * room, which stays visually consistent whether the viewport is 4K or a
//  * laptop screen.
//  * ---------------------------------------------------------------------------
//  */
// export default function HeroSection() {
//   const [isBookModalOpen, setIsBookModalOpen] = useState(false);

//   return (
//     <>
//       <section className="relative flex items-center overflow-hidden bg-[#FAFBFD] py-16 pt-28 sm:pt-32 lg:py-20 lg:pt-24">
//         <div className="pointer-events-none absolute inset-0 z-0 select-none">
//           <Image
//             src="/images/hero-background.png"
//             alt="Hero Background"
//             fill
//             priority
//             className="object-cover object-center"
//           />
//         </div>

//         <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 xl:max-w-[1360px] 2xl:max-w-[1600px] 2xl:px-12 min-[2560px]:max-w-[1900px] min-[2560px]:px-20">
//           <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-8 xl:gap-14 2xl:gap-20">
//             <HeroContent onBookClick={() => setIsBookModalOpen(true)} />
//             <HeroDiagram />
//           </div>
//         </div>
//       </section>
//       <BookConsultationModal isOpen={isBookModalOpen} onClose={() => setIsBookModalOpen(false)} />
//     </>
//   );
// }

// "use client";
// import React, { useState } from "react";
// import Image from "next/image";
// import { motion } from "framer-motion";
// import { Icon } from "@/app/components/icons/Icon";
// import BookConsultationModal from "@/app/components/home/BookConsultationModal";

// export const heroNodes = [
//   {
//     icon: "code" as const,
//     title: "Custom Software Development",
//     className: "left-1/2 top-[8%] -translate-x-1/2",
//     color: "text-[#1155CC] bg-[#EDF5FF]",
//     animation: "floatOne",
//   },
//   {
//     icon: "database" as const,
//     title: "RAG Pipeline Development",
//     className: "right-[4%] top-[34%]",
//     color: "text-[#A855F7] bg-[#FAF0FF]",
//     animation: "floatTwo",
//   },
//   {
//     icon: "cloud" as const,
//     title: "SaaS Product Development",
//     className: "bottom-[18%] right-[14%]",
//     color: "text-[#6366F1] bg-[#EEF2FF]",
//     animation: "floatThree",
//   },
//   {
//     icon: "box" as const,
//     title: "AI Orchestration & Engineering",
//     className: "bottom-[18%] left-[14%]",
//     color: "text-[#0F766E] bg-[#ECFDF5]",
//     animation: "floatTwo",
//   },
//   {
//     icon: "bolt" as const,
//     title: "AI Integration",
//     className: "left-[4%] top-[34%]",
//     color: "text-[#0891B2] bg-[#ECFEFF]",
//     animation: "floatOne",
//   },
// ];

// export const trustItems = [
//   { text: "No Obligations", icon: "check" as const },
//   { text: "Expert Guidance", icon: "check" as const },
//   { text: "Quick Response", icon: "check" as const },
// ];

// export default function HeroSection() {
//   const [isBookModalOpen, setIsBookModalOpen] = useState(false);

//   return (
//     <>
//     <section className="relative overflow-hidden bg-[#FAFBFD] flex items-center pt-20" style={{ minHeight: 'calc(100vh)' }}>
//       <div className="absolute inset-0 pointer-events-none z-0 select-none">
//         <Image
//           src="/images/hero-background.png"
//           alt="Hero Background"
//           fill
//           priority
//           className="object-cover object-center"
//         />
//       </div>

//       <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full py-10 lg:py-0">
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-6 items-center">
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.5, ease: "easeOut" }}
//             className="flex flex-col gap-5 pr-0 lg:pr-10"
//           >
//             <div className="flex flex-col gap-3">
//               <div className="inline-flex w-fit items-center gap-2 bg-[#F1F5F9] border border-[#1155CC]/15 rounded-full px-4 py-1.5">
//                 <span className="text-xs font-bold text-[#1155CC] tracking-wide uppercase">
//                   AI & Custom Software Engineering Partner
//                 </span>
//               </div>
//             </div>

//             <h1 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-gray-900 leading-[1.08] tracking-tight">
//               We Build Digital Products
//               <br />
//               <span className="text-[#1155CC]">That Drive Growth.</span>
//             </h1>

//             <p className="text-lg text-gray-600 max-w-lg leading-relaxed">
//               We build custom web applications, SaaS platforms, AI integrations,
//               RAG pipelines and intelligent solutions that help businesses
//               innovate, automate and scale.
//             </p>

//             <div className="flex flex-col sm:flex-row gap-3">
//               <button
//                 onClick={() => setIsBookModalOpen(true)}
//                 className="btn-primary px-6 py-3 rounded-xl font-semibold flex justify-center items-center gap-2 text-sm cursor-pointer"
//               >
//                 Book Free Consultation
//                 <Icon name="arrow" className="h-5 w-5" />
//               </button>
//               <a
//                 href="#"
//                 className="btn-outline px-6 py-3 rounded-xl font-semibold flex justify-center items-center gap-2 text-sm"
//               >
//                 View Case Studies
//                 <Icon name="arrow" className="h-5 w-5" />
//               </a>
//             </div>

//             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3.5">
//               {trustItems.map((item) => (
//                 <span
//                   key={item.text}
//                   className="flex items-center gap-3 text-sm text-gray-700 font-semibold"
//                 >
//                   <span className="flex h-7.5 w-7.5 items-center justify-center rounded-full bg-[#1155CC]/10 text-[#1155CC] p-1.5 shrink-0 shadow-sm border border-[#1155CC]/10">
//                     <Icon name={item.icon} className="h-4.5 w-4.5 stroke-[2.8]" />
//                   </span>
//                   {item.text}
//                 </span>
//               ))}
//             </div>
//           </motion.div>

//           <HeroDiagram />
//         </div>
//       </div>
//     </section>
//     <BookConsultationModal isOpen={isBookModalOpen} onClose={() => setIsBookModalOpen(false)} />
//     </>
//   );
// }

// function HeroDiagram() {
//   return (
//     <motion.div
//       initial={{ opacity: 0, scale: 0.98 }}
//       animate={{ opacity: 1, scale: 1 }}
//       transition={{ duration: 0.55, ease: "easeOut", delay: 0.1 }}
//       className="relative mx-auto flex w-full max-w-[600px] flex-col rounded-3xl p-3 sm:p-5 mt-10 lg:mt-0"
//     >
//       <div className="relative w-full aspect-square flex items-center justify-center">
//         <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 100 100">
//           <circle cx="50" cy="50" r="28" fill="none" stroke="#DDE8F5" strokeDasharray="1.4 2.2" strokeWidth="0.35" />
//           <circle cx="50" cy="50" r="40" fill="none" stroke="#DDE8F5" strokeDasharray="1.4 2.2" strokeWidth="0.35" />
//           <line x1="50" x2="50" y1="50" y2="16" stroke="#CBD8EA" strokeWidth="0.35" />
//           <line x1="50" x2="82" y1="50" y2="42" stroke="#CBD8EA" strokeWidth="0.35" />
//           <line x1="50" x2="72" y1="50" y2="74" stroke="#CBD8EA" strokeWidth="0.35" />
//           <line x1="50" x2="28" y1="50" y2="74" stroke="#CBD8EA" strokeWidth="0.35" />
//           <line x1="50" x2="18" y1="50" y2="42" stroke="#CBD8EA" strokeWidth="0.35" />
//         </svg>

//         <div className="absolute z-20 flex w-24 h-24 sm:w-28 sm:h-28 xl:w-34 xl:h-34 flex-col items-center justify-center rounded-full border-4 border-blue-50 bg-white shadow-[0_0_30px_rgba(0,102,255,0.15)]">
//           <Image
//             src="/images/logo-icon.png"
//             alt="TechSonance logo"
//             width={40}
//             height={40}
//             className="mb-0.5 h-6 w-6 sm:h-7 sm:w-7 xl:h-10 xl:w-10 object-contain"
//             priority
//           />
//           <span className="text-center text-[10px] sm:text-[11px] xl:text-sm font-bold leading-tight text-[#111827]">
//             TechSonance
//           </span>
//           <span className="mt-0.5 text-center text-[7px] sm:text-[8px] xl:text-[10px] font-medium leading-tight text-[#6B7280]">
//             Engineering
//             <br />
//             Excellence
//           </span>
//         </div>

//         {heroNodes.map((node) => (
//           <motion.div
//             key={node.title}
//             animate={node.animation}
//             variants={{
//               floatOne: { y: [0, -10, 0] },
//               floatTwo: { y: [0, -14, 0], x: [0, 5, 0] },
//               floatThree: { y: [0, -8, 0], x: [0, -7, 0] },
//             }}
//             transition={{ duration: node.animation === "floatTwo" ? 8 : 6, repeat: Infinity, ease: "easeInOut" }}
//             className={`absolute z-10 flex w-[88px] sm:w-[115px] xl:w-[140px] flex-col items-center justify-center rounded-xl sm:rounded-2xl border border-gray-100 bg-white/90 p-1 sm:p-2 xl:p-3 text-center shadow-lg backdrop-blur-sm ${node.className}`}
//           >
//             <span className={`mb-1 sm:mb-2 flex h-5 w-5 sm:h-6 xl:h-8 xl:w-8 items-center justify-center rounded-full ${node.color}`}>
//               <Icon name={node.icon} className="h-3 w-3 sm:h-3.5 xl:h-4 xl:w-4" />
//             </span>
//             <span className="text-[8px] sm:text-[9.5px] xl:text-[11px] font-semibold leading-tight text-gray-900">
//               {node.title}
//             </span>
//           </motion.div>
//         ))}
//       </div>
//     </motion.div>
//   );
// }
