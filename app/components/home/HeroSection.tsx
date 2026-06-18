"use client";
import React, { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Icon } from "@/app/components/icons/Icon";
import BookConsultationModal from "@/app/components/home/BookConsultationModal";

export const heroNodes = [
  {
    icon: "code" as const,
    title: "Custom Software Development",
    className: "left-1/2 top-[8%] -translate-x-1/2",
    color: "text-[#1155CC] bg-[#EDF5FF]",
    animation: "floatOne",
  },
  {
    icon: "database" as const,
    title: "RAG Pipeline Development",
    className: "right-[4%] top-[34%]",
    color: "text-[#A855F7] bg-[#FAF0FF]",
    animation: "floatTwo",
  },
  {
    icon: "cloud" as const,
    title: "SaaS Product Development",
    className: "bottom-[18%] right-[14%]",
    color: "text-[#6366F1] bg-[#EEF2FF]",
    animation: "floatThree",
  },
  {
    icon: "box" as const,
    title: "AI Orchestration & Engineering",
    className: "bottom-[18%] left-[14%]",
    color: "text-[#0F766E] bg-[#ECFDF5]",
    animation: "floatTwo",
  },
  {
    icon: "bolt" as const,
    title: "AI Integration",
    className: "left-[4%] top-[34%]",
    color: "text-[#0891B2] bg-[#ECFEFF]",
    animation: "floatOne",
  },
];

export const trustItems = [
  { text: "No Obligations", icon: "check" as const },
  { text: "Expert Guidance", icon: "check" as const },
  { text: "Quick Response", icon: "check" as const },
];

export default function HeroSection() {
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  return (
    <>
    <section className="relative overflow-hidden bg-[#FAFBFD] flex items-center pt-20" style={{ minHeight: 'calc(100vh)' }}>
      <div className="absolute inset-0 pointer-events-none z-0 select-none">
        <Image
          src="/images/hero-background.png"
          alt="Hero Background"
          fill
          priority
          className="object-cover object-center"
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full py-10 lg:py-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-6 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col gap-5 pr-0 lg:pr-10"
          >
            <div className="flex flex-col gap-3">
              <div className="inline-flex w-fit items-center gap-2 bg-[#F1F5F9] border border-[#1155CC]/15 rounded-full px-4 py-1.5">
                <span className="text-xs font-bold text-[#1155CC] tracking-wide uppercase">
                  AI & Custom Software Engineering Partner
                </span>
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-[1.08] tracking-tight">
              Build Fast.
              <br />
              Scale Faster.
              <br />
              <span className="text-[#1155CC]">Deliver Results.</span>
            </h1>

            <p className="text-lg text-gray-600 max-w-lg leading-relaxed">
              We build custom web applications, SaaS platforms, AI integrations,
              RAG pipelines and intelligent solutions that help businesses
              innovate, automate and scale.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setIsBookModalOpen(true)}
                className="btn-primary px-6 py-3 rounded-xl font-semibold flex justify-center items-center gap-2 text-sm cursor-pointer"
              >
                Book Free Consultation
                <Icon name="arrow" className="h-5 w-5" />
              </button>
              <a
                href="#"
                className="btn-outline px-6 py-3 rounded-xl font-semibold flex justify-center items-center gap-2 text-sm"
              >
                View Case Studies
                <Icon name="arrow" className="h-5 w-5" />
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3.5">
              {trustItems.map((item) => (
                <span
                  key={item.text}
                  className="flex items-center gap-3 text-sm text-gray-700 font-semibold"
                >
                  <span className="flex h-7.5 w-7.5 items-center justify-center rounded-full bg-[#1155CC]/10 text-[#1155CC] p-1.5 shrink-0 shadow-sm border border-[#1155CC]/10">
                    <Icon name={item.icon} className="h-4.5 w-4.5 stroke-[2.8]" />
                  </span>
                  {item.text}
                </span>
              ))}
            </div>
          </motion.div>

          <HeroDiagram />
        </div>
      </div>
    </section>
    <BookConsultationModal isOpen={isBookModalOpen} onClose={() => setIsBookModalOpen(false)} />
    </>
  );
}

function HeroDiagram() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.55, ease: "easeOut", delay: 0.1 }}
      className="relative mx-auto flex w-full max-w-[600px] flex-col rounded-3xl p-3 sm:p-5 mt-10 lg:mt-0"
    >
      <div className="relative w-full aspect-square flex items-center justify-center">
        <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="28" fill="none" stroke="#DDE8F5" strokeDasharray="1.4 2.2" strokeWidth="0.35" />
          <circle cx="50" cy="50" r="40" fill="none" stroke="#DDE8F5" strokeDasharray="1.4 2.2" strokeWidth="0.35" />
          <line x1="50" x2="50" y1="50" y2="16" stroke="#CBD8EA" strokeWidth="0.35" />
          <line x1="50" x2="82" y1="50" y2="42" stroke="#CBD8EA" strokeWidth="0.35" />
          <line x1="50" x2="72" y1="50" y2="74" stroke="#CBD8EA" strokeWidth="0.35" />
          <line x1="50" x2="28" y1="50" y2="74" stroke="#CBD8EA" strokeWidth="0.35" />
          <line x1="50" x2="18" y1="50" y2="42" stroke="#CBD8EA" strokeWidth="0.35" />
        </svg>

        <div className="absolute z-20 flex w-24 h-24 sm:w-28 sm:h-28 xl:w-34 xl:h-34 flex-col items-center justify-center rounded-full border-4 border-blue-50 bg-white shadow-[0_0_30px_rgba(0,102,255,0.15)]">
          <Image
            src="/images/logo-icon.png"
            alt="TechSonance logo"
            width={40}
            height={40}
            className="mb-0.5 h-6 w-6 sm:h-7 sm:w-7 xl:h-10 xl:w-10 object-contain"
            priority
          />
          <span className="text-center text-[10px] sm:text-[11px] xl:text-sm font-bold leading-tight text-[#111827]">
            TechSonance
          </span>
          <span className="mt-0.5 text-center text-[7px] sm:text-[8px] xl:text-[10px] font-medium leading-tight text-[#6B7280]">
            Engineering
            <br />
            Excellence
          </span>
        </div>

        {heroNodes.map((node) => (
          <motion.div
            key={node.title}
            animate={node.animation}
            variants={{
              floatOne: { y: [0, -10, 0] },
              floatTwo: { y: [0, -14, 0], x: [0, 5, 0] },
              floatThree: { y: [0, -8, 0], x: [0, -7, 0] },
            }}
            transition={{ duration: node.animation === "floatTwo" ? 8 : 6, repeat: Infinity, ease: "easeInOut" }}
            className={`absolute z-10 flex w-[88px] sm:w-[115px] xl:w-[140px] flex-col items-center justify-center rounded-xl sm:rounded-2xl border border-gray-100 bg-white/90 p-1 sm:p-2 xl:p-3 text-center shadow-lg backdrop-blur-sm ${node.className}`}
          >
            <span className={`mb-1 sm:mb-2 flex h-5 w-5 sm:h-6 xl:h-8 xl:w-8 items-center justify-center rounded-full ${node.color}`}>
              <Icon name={node.icon} className="h-3 w-3 sm:h-3.5 xl:h-4 xl:w-4" />
            </span>
            <span className="text-[8px] sm:text-[9.5px] xl:text-[11px] font-semibold leading-tight text-gray-900">
              {node.title}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
