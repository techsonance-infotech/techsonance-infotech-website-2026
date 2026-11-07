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

      <main className="relative min-h-screen overflow-hidden bg-[#FAFBFD] pt-28 pb-20">
        {/* Ambient background glows */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/2 h-[500px] w-[1000px] -translate-x-1/2 bg-gradient-to-b from-[#EEF5FF] via-[#F5F9FF] to-transparent opacity-80" />
          <div className="absolute top-28 left-[10%] h-[380px] w-[380px] rounded-full bg-[#1155CC]/4 blur-[90px]" />
          <div className="absolute top-48 right-[10%] h-[420px] w-[420px] rounded-full bg-[#22B6F6]/4 blur-[100px]" />
        </div>

        {/* =========================================================================
            1. HERO SECTION & DIRECT ANSWER BLOCK (AEO SNIPPET OPTIMIZED)
        ========================================================================= */}
        <section className="relative z-10 mx-auto max-w-5xl px-4 pt-8 pb-16 text-center sm:px-6 lg:px-8">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#1155CC]/15 bg-white/90 px-4 py-1.5 shadow-sm">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#22B6F6]" />
            <span className="text-[11px] font-bold tracking-wider text-[#1155CC] uppercase">
              {data.badge}
            </span>
          </div>

          {/* H1 */}
          <h1 className="mb-6 text-3xl leading-[1.12] font-black tracking-tight text-gray-900 sm:text-5xl lg:text-[3.5rem]">
            {data.h1}
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            {data.subheading}
          </p>

          {/* 40-60 Word Direct Answer Box for AI Overviews & Featured Snippets */}
          <div className="relative mx-auto mb-10 max-w-3xl overflow-hidden rounded-2xl border border-blue-100/80 bg-white p-6 text-left shadow-[0_10px_30px_rgba(17,85,204,0.03)] sm:p-7">
            <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-gradient-to-b from-[#1155CC] to-[#22B6F6]" />
            <div className="flex items-start gap-3.5">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1155CC]/10 text-[#1155CC]">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <span className="mb-1 block text-[10px] font-black tracking-wider text-[#1155CC] uppercase">
                  Summary & Quick Answer
                </span>
                <p className="text-xs leading-relaxed font-medium text-slate-700 sm:text-sm">
                  {data.directAnswer}
                </p>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              onClick={() => setIsBookModalOpen(true)}
              variant="primary"
              size="default"
              showArrow
            >
              Book Free Consultation
            </Button>
            <Button asChild variant="secondary" size="default" showArrow>
              <Link href="/portfolio">Explore Production Work</Link>
            </Button>
          </div>
        </section>

        {/* =========================================================================
            2. OVERVIEW & FOUNDER ARCHITECTURE SECTION
        ========================================================================= */}
        <section className="relative z-10 mx-auto max-w-5xl border-t border-slate-100 px-4 py-14 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-[0_12px_35px_rgba(17,85,204,0.02)] sm:p-12">
            <span className="mb-2 block text-[10px] font-bold tracking-widest text-[#1155CC] uppercase">
              ENGINEERING APPROACH
            </span>
            <h2 className="mb-6 text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
              {data.overviewHeadline}
            </h2>
            <div className="space-y-4 text-sm leading-relaxed text-slate-600 sm:text-base">
              {data.overviewParagraphs.map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>

            {/* Office Coordinates & Verified Contact Strip */}
            <div className="mt-8 grid grid-cols-1 gap-6 border-t border-slate-100 pt-6 text-left sm:grid-cols-3">
              <div>
                <span className="mb-1 block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Headquarters
                </span>
                <p className="text-xs font-semibold text-slate-800">
                  UG-15, Palladium Plaza, VIP Road, Vesu, Surat 395007
                </p>
              </div>
              <div>
                <span className="mb-1 block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Direct Engineering Contact
                </span>
                <p className="text-xs font-semibold text-slate-800">
                  +91 9173101711 &bull; info@techsonance.co.in
                </p>
              </div>
              <div>
                <span className="mb-1 block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Timezone Coverage
                </span>
                <p className="text-xs font-semibold text-slate-800">
                  IST (UTC+5:30) with US/UK/Gulf Overlap
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            3. CAPABILITIES GRID
        ========================================================================= */}
        <section className="relative z-10 mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <span className="mb-2 block text-[10px] font-bold tracking-widest text-[#1155CC] uppercase">
              CORE EXPERTISE
            </span>
            <h2 className="text-2xl font-black tracking-tight text-gray-900 sm:text-4xl">
              {data.capabilitiesHeadline}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {data.capabilities.map((cap, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                <div>
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-sm font-bold text-[#1155CC]">
                    0{idx + 1}
                  </div>
                  <h3 className="mb-2 text-base font-bold text-slate-900">{cap.title}</h3>
                  <p className="text-xs leading-relaxed text-slate-600">{cap.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* =========================================================================
            4. TECH STACK SECTION
        ========================================================================= */}
        <section className="relative z-10 mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm sm:p-12">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <span className="mb-2 block text-[10px] font-bold tracking-widest text-[#1155CC] uppercase">
                TECHNOLOGY ARCHITECTURE
              </span>
              <h2 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
                {data.techStackHeadline}
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {data.techStack.map((group, idx) => (
                <div key={idx} className="rounded-2xl border border-slate-100 bg-[#FAFBFD] p-5">
                  <h4 className="mb-3 border-b border-slate-200/60 pb-2 text-xs font-bold tracking-wider text-slate-400 uppercase">
                    {group.category}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {group.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs"
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
        <section className="relative z-10 mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <span className="mb-2 block text-[10px] font-bold tracking-widest text-[#1155CC] uppercase">
              PROVEN RESULTS
            </span>
            <h2 className="text-2xl font-black tracking-tight text-gray-900 sm:text-4xl">
              Production Systems Built by Our Team
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {data.featuredCaseStudies.map((cs) => (
              <div
                key={cs.slug}
                className="group flex flex-col justify-between rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg sm:p-8"
              >
                <div>
                  <span className="mb-2 block text-[9px] font-bold tracking-wider text-[#1155CC] uppercase">
                    {cs.client}
                  </span>
                  <Link href={`/portfolio/${cs.slug}`}>
                    <h3 className="mb-2 text-lg font-bold text-slate-900 transition-colors group-hover:text-[#1155CC]">
                      {cs.title}
                    </h3>
                  </Link>
                  <div className="mb-3 inline-block rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">
                    {cs.metric}
                  </div>
                  <p className="mb-4 text-xs leading-relaxed text-slate-600">{cs.description}</p>
                </div>

                <div>
                  <div className="mb-6 flex flex-wrap gap-1.5 border-t border-slate-100 pt-4">
                    {cs.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded bg-slate-50 px-2 py-0.5 text-[9px] font-semibold text-slate-500"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <Link
                    href={`/portfolio/${cs.slug}`}
                    className="group/link flex items-center gap-1.5 text-xs font-bold text-[#1155CC] hover:underline"
                  >
                    Read Detailed Case Study
                    <Icon
                      name="arrow"
                      className="h-3 w-3 transition-transform group-hover/link:translate-x-0.5"
                    />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* =========================================================================
            6. ENGAGEMENT MODELS
        ========================================================================= */}
        <section className="relative z-10 mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <span className="mb-2 block text-[10px] font-bold tracking-widest text-[#1155CC] uppercase">
              ENGAGEMENT OPTIONS
            </span>
            <h2 className="text-2xl font-black tracking-tight text-gray-900 sm:text-4xl">
              Flexible Engineering Collaboration Models
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {data.engagementModels.map((model, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between rounded-3xl border border-slate-100 bg-white p-8 shadow-sm"
              >
                <div>
                  <span className="mb-4 inline-block rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[9px] font-black tracking-wider text-[#1155CC] uppercase">
                    {model.badge}
                  </span>
                  <h3 className="mb-2 text-xl font-bold text-slate-900">{model.title}</h3>
                  <p className="mb-6 text-xs leading-relaxed text-slate-600">{model.description}</p>
                  <ul className="space-y-2.5 border-t border-slate-100 pt-5 text-xs font-medium text-slate-700">
                    {model.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-2">
                        <svg
                          className="h-4 w-4 shrink-0 text-[#00D26A]"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 border-t border-slate-100 pt-6">
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
        <section className="relative z-10 mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <span className="mb-2 block text-[10px] font-bold tracking-widest text-[#1155CC] uppercase">
              FREQUENTLY ASKED QUESTIONS
            </span>
            <h2 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
              Questions About Working With Our Team
            </h2>
          </div>

          <div className="space-y-4">
            {data.faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xs transition-all"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left text-sm font-bold text-slate-900 transition-colors hover:text-[#1155CC] sm:text-base"
                    aria-expanded={isOpen}
                  >
                    <span>{faq.question}</span>
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-50 transition-transform duration-200 ${isOpen ? "rotate-180 bg-blue-50 text-[#1155CC]" : "text-slate-400"}`}
                    >
                      &darr;
                    </span>
                  </button>
                  {isOpen && (
                    <div className="border-t border-slate-50 px-6 pt-4 pb-6 text-xs leading-relaxed text-slate-600 sm:text-sm">
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
        <section className="relative z-10 mx-auto max-w-7xl border-t border-slate-100 px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <span className="mb-2 block text-[10px] font-bold tracking-widest text-[#1155CC] uppercase">
              EXPLORE OUR SERVICES
            </span>
            <h2 className="text-xl font-black tracking-tight text-gray-900 sm:text-2xl">
              Related Engineering Specializations
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {data.relatedServices.map((service, idx) => (
              <Link
                key={idx}
                href={service.href}
                className="group rounded-2xl border border-slate-100 bg-white p-5 transition-all hover:border-[#1155CC]/30 hover:shadow-md"
              >
                <h4 className="mb-1.5 flex items-center justify-between text-sm font-bold text-slate-900 transition-colors group-hover:text-[#1155CC]">
                  {service.title}
                  <Icon
                    name="arrow"
                    className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
                  />
                </h4>
                <p className="text-xs leading-relaxed text-slate-500">{service.description}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* =========================================================================
            9. FINAL CONSULTATION CTA STRIP
        ========================================================================= */}
        <section className="relative z-10 mx-auto max-w-5xl px-4 pt-10 pb-6 text-center sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-[#071A35] to-[#0A2540] p-8 text-white shadow-xl sm:p-12">
            <div className="pointer-events-none absolute top-0 right-0 h-80 w-80 rounded-full bg-[#22B6F6]/10 blur-3xl" />
            <h2 className="relative z-10 mb-4 text-2xl font-black tracking-tight sm:text-4xl">
              Ready to Scope Your Software Architecture?
            </h2>
            <p className="relative z-10 mx-auto mb-8 max-w-xl text-xs leading-relaxed text-slate-300 sm:text-sm">
              Meet directly with our technical leadership at our Vesu, Surat office or schedule a
              virtual scoping session across any global timezone.
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
