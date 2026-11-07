"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@/app/components/icons/Icon";
import { services } from "@/data/services";
import BookConsultationModal from "@/app/components/home/BookConsultationModal";
import { Button } from "@/components/ui/button";

export default function SiteFooter() {
  const currentYear = new Date().getFullYear();
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  return (
    <>
      <footer className="relative w-full overflow-hidden border-t border-white/10 bg-[#071A35] pt-20 pb-12 text-slate-200">
        {/* Ambient glowing gradients */}
        <div className="pointer-events-none absolute top-0 left-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-[#22B6F6]/10 to-transparent opacity-40 blur-3xl" />
        <div className="pointer-events-none absolute right-1/4 bottom-0 h-[500px] w-[500px] rounded-full bg-gradient-to-bl from-[#1155CC]/10 to-transparent opacity-30 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 border-b border-white/10 pb-16 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
            {/* Column 1: Brand details */}
            <div className="flex flex-col gap-6 lg:col-span-4">
              <div>
                <Link href="/" className="group mb-6 flex items-center gap-3 self-start">
                  <Image
                    src="/images/logo-icon.png"
                    alt="TechSonance logo"
                    width={56}
                    height={56}
                    className="h-14 w-14 object-contain transition-transform duration-300 group-hover:scale-105"
                    style={{ width: "auto", height: "auto" }}
                  />
                  <div className="flex flex-col items-center">
                    <span className="flex items-center gap-1.5 font-sora text-[22px] leading-none font-bold tracking-[0.04em]">
                      <TechSvg className="text-white" />
                      <span className="bg-gradient-to-r from-[#1155CC] to-[#22B6F6] bg-clip-text text-transparent">
                        SONΛNCE
                      </span>
                    </span>
                    <span className="mt-0.5 flex w-full items-center gap-2 font-sans text-[10px] font-medium tracking-[0.25em] text-[#94A3B8] uppercase">
                      <span className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[#475569]" />
                      INFOTECH LLP
                      <span className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[#475569]" />
                    </span>
                    <span className="text-slate-355 mt-1.5 block text-center font-sans text-[7.5px] font-medium tracking-[0.15em] uppercase">
                      Where Innovation Finds Its Resonance
                    </span>
                  </div>
                </Link>

                <p className="mb-6 max-w-sm text-xs leading-relaxed text-slate-300">
                  Engineering high-performance enterprise custom platforms, multi-tenant SaaS
                  products, and agentic AI automation workflows. Built on robust types, scalability,
                  and 99.9% reliability.
                </p>

                <div className="mt-8">
                  <div className="flex items-center gap-3 text-xs font-medium text-slate-200">
                    <svg
                      className="h-4 w-4 shrink-0 text-[#22B6F6]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <a
                      href="mailto:hr@techsonance.co.in"
                      className="transition-colors hover:text-white"
                    >
                      hr@techsonance.co.in
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Core services */}
            <div className="lg:col-span-3 lg:pl-6">
              <h3 className="mb-5 text-[10px] font-black tracking-widest text-white uppercase">
                Expertise & Services
              </h3>
              <ul className="space-y-3.5 text-xs">
                {services.slice(0, 5).map((service) => (
                  <li key={service.slug}>
                    <Link
                      href={`/services/${service.slug}`}
                      className="inline-block text-slate-300 transition-colors hover:translate-x-0.5 hover:text-[#22B6F6]"
                    >
                      {service.shortTitle || service.title}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/technologies/nestjs"
                    className="inline-block text-slate-300 transition-colors hover:translate-x-0.5 hover:text-[#22B6F6]"
                  >
                    NestJS Microservices
                  </Link>
                </li>
                <li>
                  <Link
                    href="/services/rag-chatbot-development"
                    className="inline-block text-slate-300 transition-colors hover:translate-x-0.5 hover:text-[#22B6F6]"
                  >
                    Enterprise RAG Chatbots
                  </Link>
                </li>
                <li>
                  <Link
                    href="/technologies/nextjs"
                    className="inline-block text-slate-300 transition-colors hover:translate-x-0.5 hover:text-[#22B6F6]"
                  >
                    Next.js 15 & React 19
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Navigation */}
            <div className="lg:col-span-2">
              <h3 className="mb-5 text-[10px] font-black tracking-widest text-white uppercase">
                Corporate Directory
              </h3>
              <ul className="space-y-3.5 text-xs">
                <li>
                  <Link
                    href="/services"
                    className="text-slate-300 transition-colors hover:text-[#22B6F6]"
                  >
                    Our Services
                  </Link>
                </li>
                <li>
                  <Link
                    href="/portfolio"
                    className="text-slate-300 transition-colors hover:text-[#22B6F6]"
                  >
                    Case Studies
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="text-slate-300 transition-colors hover:text-[#22B6F6]"
                  >
                    About the Agency
                  </Link>
                </li>
                <li>
                  <Link
                    href="/locations/surat"
                    className="text-slate-300 transition-colors hover:text-[#22B6F6]"
                  >
                    Surat Office & Dev Hub
                  </Link>
                </li>
                <li>
                  <Link
                    href="/blog"
                    className="text-slate-300 transition-colors hover:text-[#22B6F6]"
                  >
                    Blog & Insights
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() => setIsBookModalOpen(true)}
                    className="cursor-pointer text-left text-slate-300 transition-colors hover:text-[#22B6F6]"
                  >
                    Book Scoping Call
                  </button>
                </li>
                <li>
                  <Link
                    href="/careers"
                    className="text-slate-300 transition-colors hover:text-[#22B6F6]"
                  >
                    Careers (We&apos;re Hiring)
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Contact/Newsletter info */}
            <div className="lg:col-span-3">
              <h3 className="mb-5 text-[10px] font-black tracking-widest text-white uppercase">
                Contact Tech Lead
              </h3>
              <p className="mb-4 text-xs leading-relaxed text-slate-300">
                Schedule a tech scoping session to review your product design, system flowcharts,
                and architecture roadmap.
              </p>
              <Button
                onClick={() => setIsBookModalOpen(true)}
                variant="secondary"
                size="sm"
                className="hover:bg-slate-850 group cursor-pointer border-slate-800 text-white shadow-md transition-all hover:border-slate-700 hover:text-white"
              >
                Book Free Session
                <Icon
                  name="arrow"
                  className="ml-2 h-3.5 w-3.5 transform text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-white"
                />
              </Button>
              <div className="mt-6 text-[10px] leading-relaxed text-slate-400">
                Office Hours: Mon - Fri, 9AM - 6PM IST <br />
                Standard response timeline: 24 Hours
              </div>
            </div>
          </div>

          {/* Center row: Follow Us socials */}
          <div className="flex flex-col items-center justify-center gap-4 border-b border-white/10 py-8 sm:flex-row">
            <span className="text-xs font-bold tracking-wider text-slate-300">Follow Us:</span>
            <div className="flex items-center gap-3">
              <a
                href="https://linkedin.com/company/techsonance-infotech/"
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 transition-all hover:border-[#22B6F6] hover:bg-slate-800/80 hover:text-white"
                aria-label="LinkedIn Profile"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect x="2" y="9" width="4" height="12" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
              <a
                href="https://x.com/techsonance_in"
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 transition-all hover:border-[#22B6F6] hover:bg-slate-800/80 hover:text-white"
                aria-label="Twitter X Profile"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/techsonance_infotech/?igsh=MTZqNm04enMxaGZmbg%3D%3D#"
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 transition-all hover:border-[#22B6F6] hover:bg-slate-800/80 hover:text-white"
                aria-label="Instagram Profile"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a
                href="https://www.facebook.com/people/TechSonance-InfoTech/61583918872159/?rdid=hWr8x5FiMIPKTaVJ&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1TKgqjwQ9u%2F"
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 transition-all hover:border-[#22B6F6] hover:bg-slate-800/80 hover:text-white"
                aria-label="Facebook Profile"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a
                href="https://github.com/techsonance-infotech"
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 transition-all hover:border-[#22B6F6] hover:bg-slate-800/80 hover:text-white"
                aria-label="GitHub Profile"
              >
                <svg
                  className="h-4.5 w-4.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                </svg>
              </a>
            </div>
          </div>

          {/* Lower row: copyright & compliance */}
          <div className="flex flex-col items-center justify-between gap-5 pt-8 text-[11px] text-slate-400 md:flex-row">
            <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
              <span>
                © {currentYear} All rights reserved by{" "}
                <span className="font-medium text-[#22B6F6]">TechSonance InfoTech LLP</span>
              </span>
            </div>
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 md:justify-end">
              <Link href="/careers" className="hover:text-slate-350 transition-colors">
                Career
              </Link>
              <span className="text-slate-800">•</span>
              <Link href="/about" className="hover:text-slate-350 transition-colors">
                About Us
              </Link>
              <span className="text-slate-800">•</span>
              <Link href="/privacy-policy" className="hover:text-slate-350 transition-colors">
                Privacy Policy
              </Link>
              <span className="text-slate-800">•</span>
              <Link href="/terms" className="hover:text-slate-350 transition-colors">
                Terms & Conditions
              </Link>
              <span className="text-slate-800">•</span>
              <Link href="/sitemap" className="hover:text-slate-350 transition-colors">
                Sitemap
              </Link>
            </div>
          </div>
        </div>
      </footer>
      <BookConsultationModal isOpen={isBookModalOpen} onClose={() => setIsBookModalOpen(false)} />
    </>
  );
}

function TechSvg({ className = "text-white" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 74 24"
      className={`h-[0.72em] w-auto ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="3.2"
      strokeLinecap="butt"
      strokeLinejoin="miter"
    >
      {/* T */}
      <g transform="translate(0, 0)">
        <path d="M1.5,4.5 L16.5,4.5" />
        <path d="M9,4.5 L9,19.5" />
      </g>
      {/* E */}
      <g transform="translate(18, 0)">
        <path
          d="M16.5,4.5 L8.5,4.5 C6.2,4.5 4.5,6.2 4.5,8.5 L4.5,15.5 C4.5,17.8 6.2,19.5 8.5,19.5 L16.5,19.5"
          strokeLinejoin="round"
        />
        <path d="M4.5,12 L13.5,12" />
      </g>
      {/* C */}
      <g transform="translate(36, 0)">
        <path
          d="M16.5,4.5 L8.5,4.5 C6.2,4.5 4.5,6.2 4.5,8.5 L4.5,15.5 C4.5,17.8 6.2,19.5 8.5,19.5 L16.5,19.5"
          strokeLinejoin="round"
        />
      </g>
      {/* H */}
      <g transform="translate(54, 0)">
        <path d="M4.5,4.5 L4.5,19.5" />
        <path d="M16.5,4.5 L16.5,19.5" />
        <path d="M4.5,12 L16.5,12" />
      </g>
    </svg>
  );
}
