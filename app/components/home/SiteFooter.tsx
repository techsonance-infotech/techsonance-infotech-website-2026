"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Icon, type IconName } from "@/app/components/icons/Icon";
import { services } from "@/data/services";
import BookConsultationModal from "@/app/components/home/BookConsultationModal";

export default function SiteFooter() {
  const currentYear = new Date().getFullYear();
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  return (
    <>
      <footer className="w-full bg-[#071A35] text-slate-200 border-t border-white/10 pt-20 pb-12 relative overflow-hidden">
        {/* Ambient glowing gradients */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-tr from-[#22B6F6]/10 to-transparent rounded-full blur-3xl opacity-40 pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-bl from-[#1155CC]/10 to-transparent rounded-full blur-3xl opacity-30 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-16 border-b border-white/10">

            {/* Column 1: Brand details */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div>
                <Link href="/" className="flex items-center gap-3 mb-6 self-start group">
                  <Image
                    src="/images/logo-icon.png"
                    alt="TechSonance logo"
                    width={56}
                    height={56}
                    className="h-14 w-14 object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="flex flex-col items-center">
                    <span className="flex items-center gap-1.5 text-[22px] font-bold font-sora leading-none tracking-[0.04em]">
                      <TechSvg className="text-white" />
                      <span className="bg-gradient-to-r from-[#1155CC] to-[#22B6F6] bg-clip-text text-transparent">SONΛNCE</span>
                    </span>
                    <span className="w-full flex items-center gap-2 text-[10px] font-medium font-sans uppercase tracking-[0.25em] text-[#94A3B8] mt-0.5">
                      <span className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[#475569]" />
                      INFOTECH LLP
                      <span className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[#475569]" />
                    </span>
                    <span className="block text-[7.5px] font-medium font-sans uppercase tracking-[0.15em] text-slate-355 mt-1.5 text-center">
                      Where Innovation Finds Its Resonance
                    </span>
                  </div>
                </Link>

                <p className="text-xs text-slate-300 leading-relaxed max-w-sm mb-6">
                  Engineering high-performance enterprise custom platforms, multi-tenant SaaS products, and agentic AI automation workflows. Built on robust types, scalability, and 99.9% reliability.
                </p>

                <div className="mt-8">
                  <div className="flex items-center gap-3 text-xs text-slate-200 font-medium">
                    <svg className="w-4 h-4 text-[#22B6F6] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <a href="mailto:hr@techsonance.co.in" className="hover:text-white transition-colors">hr@techsonance.co.in</a>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Core services */}
            <div className="lg:col-span-3 lg:pl-6">
              <h3 className="text-[10px] font-black text-white uppercase tracking-widest mb-5">
                Expertise & Services
              </h3>
              <ul className="space-y-3.5 text-xs">
                {services.slice(0, 6).map((service) => (
                  <li key={service.slug}>
                    <Link
                      href={`/services/${service.slug}`}
                      className="text-slate-300 hover:text-[#22B6F6] transition-colors hover:translate-x-0.5 inline-block"
                    >
                      {service.shortTitle || service.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Navigation */}
            <div className="lg:col-span-2">
              <h3 className="text-[10px] font-black text-white uppercase tracking-widest mb-5">
                Corporate Directory
              </h3>
              <ul className="space-y-3.5 text-xs">
                <li>
                  <Link href="/services" className="text-slate-300 hover:text-[#22B6F6] transition-colors">
                    Our Services
                  </Link>
                </li>
                <li>
                  <Link href="/portfolio" className="text-slate-300 hover:text-[#22B6F6] transition-colors">
                    Case Studies
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-slate-300 hover:text-[#22B6F6] transition-colors">
                    About the Agency
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="text-slate-300 hover:text-[#22B6F6] transition-colors">
                    Blog & Insights
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() => setIsBookModalOpen(true)}
                    className="text-slate-300 hover:text-[#22B6F6] transition-colors cursor-pointer text-left"
                  >
                    Book Scoping Call
                  </button>
                </li>
                <li>
                  <Link href="/careers" className="text-slate-300 hover:text-[#22B6F6] transition-colors">
                    Careers (We're Hiring)
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Contact/Newsletter info */}
            <div className="lg:col-span-3">
              <h3 className="text-[10px] font-black text-white uppercase tracking-widest mb-5">
                Contact Tech Lead
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Schedule a tech scoping session to review your product design, system flowcharts, and architecture roadmap.
              </p>
              <button
                onClick={() => setIsBookModalOpen(true)}
                className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-white hover:bg-slate-800 hover:border-slate-700 transition-all shadow-md group cursor-pointer"
              >
                Book Free Session
                <Icon name="arrow" className="w-3.5 h-3.5 text-slate-300 group-hover:text-white transition-all transform group-hover:translate-x-0.5" />
              </button>
              <div className="mt-6 text-[10px] text-slate-400 leading-relaxed">
                Office Hours: Mon - Fri, 9AM - 6PM IST <br />
                Standard response timeline: 24 Hours
              </div>
            </div>

          </div>

          {/* Center row: Follow Us socials */}
          <div className="py-8 flex flex-col sm:flex-row justify-center items-center gap-4 border-b border-white/10">
            <span className="text-xs font-bold text-slate-300 tracking-wider">Follow Us:</span>
            <div className="flex items-center gap-3">
              <a
                href="https://linkedin.com/company/techsonance-infotech/"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-[#22B6F6] hover:bg-slate-800/80 transition-all"
                aria-label="LinkedIn Profile"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect x="2" y="9" width="4" height="12" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
              <a
                href="https://x.com/techsonance_in"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-[#22B6F6] hover:bg-slate-800/80 transition-all"
                aria-label="Twitter X Profile"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/techsonance_infotech/?igsh=MTZqNm04enMxaGZmbg%3D%3D#"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-[#22B6F6] hover:bg-slate-800/80 transition-all"
                aria-label="Instagram Profile"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a
                href="https://www.facebook.com/people/TechSonance-InfoTech/61583918872159/?rdid=hWr8x5FiMIPKTaVJ&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1TKgqjwQ9u%2F"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-[#22B6F6] hover:bg-slate-800/80 transition-all"
                aria-label="Facebook Profile"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a
                href="https://github.com/techsonance-infotech"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-[#22B6F6] hover:bg-slate-800/80 transition-all"
                aria-label="GitHub Profile"
              >
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                </svg>
              </a>
            </div>
          </div>

          {/* Lower row: copyright & compliance */}
          <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-5 text-[11px] text-slate-400">
            <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
              <span>© {currentYear} All rights reserved by <span className="font-medium text-[#22B6F6]">TechSonance InfoTech LLP</span></span>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 justify-center md:justify-end">
              <Link href="/careers" className="hover:text-slate-350 transition-colors">Career</Link>
              <span className="text-slate-800">•</span>
              <Link href="/about" className="hover:text-slate-350 transition-colors">About Us</Link>
              <span className="text-slate-800">•</span>
              <Link href="/privacy-policy" className="hover:text-slate-350 transition-colors">Privacy Policy</Link>
              <span className="text-slate-800">•</span>
              <Link href="/terms" className="hover:text-slate-350 transition-colors">Terms & Conditions</Link>
              <span className="text-slate-800">•</span>
              <Link href="/sitemap" className="hover:text-slate-350 transition-colors">Sitemap</Link>
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
        <path d="M16.5,4.5 L8.5,4.5 C6.2,4.5 4.5,6.2 4.5,8.5 L4.5,15.5 C4.5,17.8 6.2,19.5 8.5,19.5 L16.5,19.5" strokeLinejoin="round" />
        <path d="M4.5,12 L13.5,12" />
      </g>
      {/* C */}
      <g transform="translate(36, 0)">
        <path d="M16.5,4.5 L8.5,4.5 C6.2,4.5 4.5,6.2 4.5,8.5 L4.5,15.5 C4.5,17.8 6.2,19.5 8.5,19.5 L16.5,19.5" strokeLinejoin="round" />
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
