"use client";

import React, { useState } from "react";
import Link from "next/link";
import SiteHeader from "@/app/components/home/SiteHeader";
import SiteFooter from "@/app/components/home/SiteFooter";
import BookConsultationModal from "@/app/components/home/BookConsultationModal";
import { Button } from "@/components/ui/button";
import { Icon } from "@/app/components/icons/Icon";
import type { LandingPageData } from "@/data/landing-pages";

interface LandingPageTemplateProps {
  data: LandingPageData;
}

export default function LandingPageTemplate({ data }: LandingPageTemplateProps) {
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <>
      <SiteHeader transparent={true} />

      <main className="bg-[#FAFBFD] min-h-screen pt-28 pb-20 relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-[#EEF5FF] via-[#F5F9FF] to-transparent opacity-80" />
          <div className="absolute top-28 left-[10%] w-[380px] h-[380px] bg-[#1155CC]/4 rounded-full blur-[90px]" />
          <div className="absolute top-48 right-[10%] w-[420px] h-[420px] bg-[#22B6F6]/4 rounded-full blur-[100px]" />
        </div>

        {/* =========================================================================
            1. HERO SECTION & DIRECT ANSWER BLOCK (AEO SNIPPET OPTIMIZED)
        ========================================================================= */}
        <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/90 border border-[#1155CC]/15 rounded-full px-4 py-1.5 mb-6 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-[#22B6F6] animate-pulse" />
            <span className="text-[11px] font-bold text-[#1155CC] tracking-wider uppercase">
              {data.badge}
            </span>
          </div>

          {/* H1 */}
          <h1 className="text-3xl sm:text-5xl lg:text-[3.5rem] font-black text-gray-900 tracking-tight leading-[1.12] mb-6">
            {data.h1}
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8">
            {data.subheading}
          </p>

          {/* 40-60 Word Direct Answer Box for AI Overviews & Featured Snippets */}
          <div className="max-w-3xl mx-auto bg-white border border-blue-100/80 rounded-2xl p-6 sm:p-7 shadow-[0_10px_30px_rgba(17,85,204,0.03)] text-left mb-10 relative overflow-hidden">
            <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-gradient-to-b from-[#1155CC] to-[#22B6F6]" />
            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-[#1155CC]/10 text-[#1155CC] flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#1155CC] block mb-1">
                  Summary & Quick Answer
                </span>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  {data.directAnswer}
                </p>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={() => setIsBookModalOpen(true)}
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
              <Link href="/portfolio">Explore Production Work</Link>
            </Button>
          </div>
        </section>

        {/* =========================================================================
            2. OVERVIEW & FOUNDER ARCHITECTURE SECTION
        ========================================================================= */}
        <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 border-t border-slate-100">
          <div className="bg-white border border-slate-100 rounded-3xl p-8 sm:p-12 shadow-[0_12px_35px_rgba(17,85,204,0.02)]">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#1155CC] block mb-2">
              ENGINEERING APPROACH
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-6">
              {data.overviewHeadline}
            </h2>
            <div className="space-y-4 text-sm sm:text-base text-slate-600 leading-relaxed">
              {data.overviewParagraphs.map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>

            {/* Office Coordinates & Verified Contact Strip */}
            <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Headquarters</span>
                <p className="text-xs font-semibold text-slate-800">UG-15, Palladium Plaza, VIP Road, Vesu, Surat 395007</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Direct Engineering Contact</span>
                <p className="text-xs font-semibold text-slate-800">+91 9173101711 &bull; info@techsonance.co.in</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Timezone Coverage</span>
                <p className="text-xs font-semibold text-slate-800">IST (UTC+5:30) with US/UK/Gulf Overlap</p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            3. CAPABILITIES GRID
        ========================================================================= */}
        <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#1155CC] block mb-2">
              CORE EXPERTISE
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight">
              {data.capabilitiesHeadline}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.capabilities.map((cap, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-[#1155CC] flex items-center justify-center font-bold text-sm mb-4">
                    0{idx + 1}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">
                    {cap.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {cap.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* =========================================================================
            4. TECH STACK SECTION
        ========================================================================= */}
        <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="bg-white border border-slate-100 rounded-3xl p-8 sm:p-12 shadow-sm">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#1155CC] block mb-2">
                TECHNOLOGY ARCHITECTURE
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                {data.techStackHeadline}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {data.techStack.map((group, idx) => (
                <div key={idx} className="bg-[#FAFBFD] border border-slate-100 rounded-2xl p-5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 pb-2 border-b border-slate-200/60">
                    {group.category}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {group.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="text-xs font-semibold text-slate-700 bg-white border border-slate-200/80 px-2.5 py-1 rounded-lg shadow-2xs"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================================
            5. FEATURED CASE STUDIES SECTION
        ========================================================================= */}
        <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#1155CC] block mb-2">
              PROVEN RESULTS
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight">
              Production Systems Built by Our Team
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {data.featuredCaseStudies.map((cs) => (
              <div
                key={cs.slug}
                className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <span className="text-[9px] font-bold text-[#1155CC] uppercase tracking-wider block mb-2">
                    {cs.client}
                  </span>
                  <Link href={`/portfolio/${cs.slug}`}>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#1155CC] transition-colors mb-2">
                      {cs.title}
                    </h3>
                  </Link>
                  <div className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-lg inline-block mb-3">
                    {cs.metric}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {cs.description}
                  </p>
                </div>

                <div>
                  <div className="flex flex-wrap gap-1.5 mb-6 pt-4 border-t border-slate-100">
                    {cs.tags.map((t) => (
                      <span key={t} className="text-[9px] font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded">
                        {t}
                      </span>
                    ))}
                  </div>
                  <Link
                    href={`/portfolio/${cs.slug}`}
                    className="text-xs font-bold text-[#1155CC] hover:underline flex items-center gap-1.5 group/link"
                  >
                    Read Detailed Case Study
                    <Icon name="arrow" className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* =========================================================================
            6. ENGAGEMENT MODELS
        ========================================================================= */}
        <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#1155CC] block mb-2">
              ENGAGEMENT OPTIONS
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight">
              Flexible Engineering Collaboration Models
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {data.engagementModels.map((model, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <span className="text-[9px] font-black text-[#1155CC] bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full uppercase tracking-wider inline-block mb-4">
                    {model.badge}
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {model.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-6">
                    {model.description}
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-700 font-medium border-t border-slate-100 pt-5">
                    {model.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#00D26A] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100">
                  <Button
                    onClick={() => setIsBookModalOpen(true)}
                    variant="primary"
                    size="sm"
                    className="w-full justify-center"
                  >
                    Select Model
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* =========================================================================
            7. VISIBLE FAQ ACCORDION (100% MATCH WITH FAQPAGE JSON-LD)
        ========================================================================= */}
        <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="text-center mb-10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#1155CC] block mb-2">
              FREQUENTLY ASKED QUESTIONS
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Questions About Working With Our Team
            </h2>
          </div>

          <div className="space-y-4">
            {data.faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-2xs transition-all"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-900 hover:text-[#1155CC] transition-colors cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <span>{faq.question}</span>
                    <span className={`w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180 bg-blue-50 text-[#1155CC]" : "text-slate-400"}`}>
                      &darr;
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-50 pt-4">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* =========================================================================
            8. INTERNAL LINKING HUB TO RELATED SERVICES
        ========================================================================= */}
        <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 border-t border-slate-100">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#1155CC] block mb-2">
              EXPLORE OUR SERVICES
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Related Engineering Specializations
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.relatedServices.map((service, idx) => (
              <Link
                key={idx}
                href={service.href}
                className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-[#1155CC]/30 hover:shadow-md transition-all group"
              >
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#1155CC] transition-colors mb-1.5 flex items-center justify-between">
                  {service.title}
                  <Icon name="arrow" className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {service.description}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* =========================================================================
            9. FINAL CONSULTATION CTA STRIP
        ========================================================================= */}
        <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6 text-center">
          <div className="bg-gradient-to-tr from-[#071A35] to-[#0A2540] text-white rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#22B6F6]/10 rounded-full blur-3xl pointer-events-none" />
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight mb-4 relative z-10">
              Ready to Scope Your Software Architecture?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto mb-8 relative z-10 leading-relaxed">
              Meet directly with our technical leadership at our Vesu, Surat office or schedule a virtual scoping session across any global timezone.
            </p>
            <div className="relative z-10">
              <Button
                onClick={() => setIsBookModalOpen(true)}
                variant="primary"
                size="default"
                showArrow
              >
                Book 15-Min Scoping Session
              </Button>
            </div>
          </div>
        </section>

      </main>

      <SiteFooter />
      <BookConsultationModal isOpen={isBookModalOpen} onClose={() => setIsBookModalOpen(false)} />
    </>
  );
}
