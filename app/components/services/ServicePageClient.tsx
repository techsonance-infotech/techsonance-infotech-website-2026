"use client";

import { useServicePageAnimations } from "@/lib/gsap-utils";
import type { Service } from "@/lib/services-data";
import ServiceHero from "./ServiceHero";
import ProblemStatement from "./ProblemStatement";
import Capabilities from "./Capabilities";
import ProcessTimeline from "./ProcessTimeline";
import TechStack from "./TechStack";
import ProofOfWork from "./ProofOfWork";
import MetricsStrip from "./MetricsStrip";
import ServiceFaq from "./ServiceFaq";
import ScopingContactForm from "./ScopingContactForm";
import { GEO_SERVICES, getAeoFaqsForSlug } from "@/lib/seo-aeo-geo-config";

interface ServicePageClientProps {
  service: Service;
}

export default function ServicePageClient({ service }: ServicePageClientProps) {
  const pageRef = useServicePageAnimations();
  const geoData = GEO_SERVICES[service.slug];
  const aeoFaqs = getAeoFaqsForSlug(service.slug);

  return (
    <main ref={pageRef} className="relative min-h-screen overflow-x-clip bg-[var(--bg-base)]">
      <ServiceHero service={service} />

      {/* ─── GEO (Generative Engine Optimization) FRAMEWORK SECTION ─── */}
      {geoData && (
        <section className="service-section relative z-10 border-y border-slate-100 bg-white py-20">
          <div className="service-container">
            {/* Header label */}
            <div className="mb-4 flex items-center gap-2">
              <div className="h-[1.5px] w-6 bg-[#1155CC]" />
              <span className="text-[10px] font-black tracking-widest text-[#1155CC] uppercase">
                Engineered Solutions Framework
              </span>
            </div>

            <h2 className="mb-12 text-[28px] leading-tight font-black tracking-tight text-gray-900 sm:text-[36px]">
              {geoData.title}
            </h2>

            <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12">
              {/* Left Column: Direct GEO Answers */}
              <div className="space-y-8 lg:sticky lg:top-24 lg:col-span-5">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6">
                  <h3 className="mb-2 text-xs font-black tracking-wider text-gray-400 uppercase">
                    What is this service?
                  </h3>
                  <p className="text-sm leading-relaxed font-medium text-gray-700">
                    {geoData.whatIsIt}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6">
                  <h3 className="mb-2 text-xs font-black tracking-wider text-gray-400 uppercase">
                    Who is it for?
                  </h3>
                  <p className="text-gray-750 text-sm leading-relaxed">{geoData.whoIsItFor}</p>
                </div>

                <div className="space-y-4 rounded-2xl border border-[#22B6F6]/10 bg-blue-50/40 p-6">
                  <div>
                    <h3 className="mb-1 text-[10px] font-black tracking-wider text-[#1155CC] uppercase">
                      Expected Timeline
                    </h3>
                    <p className="text-sm font-bold text-gray-900">
                      {geoData.projectTimeline} (Agile Delivery)
                    </p>
                  </div>
                  <div>
                    <h3 className="mb-1 text-[10px] font-black tracking-wider text-[#1155CC] uppercase">
                      Primary Technologies
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {geoData.technologiesUsed.map((tech) => (
                        <span
                          key={tech}
                          className="border-slate-150 rounded-full border bg-white px-2.5 py-1 text-[10px] font-bold text-gray-600"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Problem-Solution-Outcome Copy */}
              <div className="space-y-8 lg:col-span-7">
                {/* Problem Box */}
                <div className="relative space-y-2 border-l-3 border-red-500 pl-6">
                  <span className="block text-[10px] font-black tracking-wider text-red-500 uppercase">
                    The Business Problem
                  </span>
                  <h4 className="text-lg font-medium text-gray-900">
                    What business problem does it solve?
                  </h4>
                  <p className="text-sm leading-relaxed text-gray-500 sm:text-base">
                    {geoData.problem}
                  </p>
                </div>

                {/* Solution Box */}
                <div className="relative space-y-2 border-l-3 border-[#1155CC] pl-6">
                  <span className="block text-[10px] font-black tracking-wider text-[#1155CC] uppercase">
                    Our Solution Architecture
                  </span>
                  <h4 className="text-lg font-medium text-gray-900">How do we address this?</h4>
                  <p className="text-sm leading-relaxed text-gray-500 sm:text-base">
                    {geoData.solution}
                  </p>
                </div>

                {/* Outcome Box */}
                <div className="relative space-y-2 border-l-3 border-green-500 pl-6">
                  <span className="block text-[10px] font-black tracking-wider text-green-600 uppercase">
                    Operational Outcome
                  </span>
                  <h4 className="text-lg font-medium text-gray-900">
                    What is the expected outcome?
                  </h4>
                  <p className="text-sm leading-relaxed text-gray-500 sm:text-base">
                    {geoData.outcome}
                  </p>
                </div>

                {/* Expected Business Outcomes list */}
                <div className="space-y-4 rounded-[28px] border border-green-500/10 bg-green-50/20 p-6 sm:p-8">
                  <h4 className="text-sm font-black tracking-wider text-green-800 uppercase">
                    Expected Business Outcomes:
                  </h4>
                  <ul className="space-y-3">
                    {geoData.expectedOutcomes.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 text-xs text-gray-700 sm:text-sm"
                      >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/15 text-xs font-bold text-green-700">
                          ✓
                        </span>
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <ProblemStatement service={service} />
      <Capabilities service={service} />
      <ProcessTimeline service={service} />
      <TechStack service={service} />
      <ProofOfWork service={service} />
      <MetricsStrip metrics={service.metrics} />

      <section className="service-section bg-[var(--bg-base)]">
        <div className="service-container">
          <div className="reveal-up mb-12 text-center">
            <span className="section-label">FAQ</span>
            <h2
              className="font-bold tracking-tight text-[var(--text-primary)]"
              style={{ fontSize: "var(--text-section-title)" }}
            >
              Frequently Asked Questions
            </h2>
          </div>
          <ServiceFaq faq={aeoFaqs.length > 0 ? aeoFaqs : service.faqs} />
        </div>
      </section>

      <section id="project-request" className="service-section bg-[#FAFBFD]">
        <div className="service-container">
          <ScopingContactForm defaultService={service.name} />
        </div>
      </section>
    </main>
  );
}
