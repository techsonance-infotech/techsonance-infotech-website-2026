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
import { GEO_SERVICES, AEO_FAQS } from "@/lib/seo-aeo-geo-config";

interface ServicePageClientProps {
  service: Service;
}

// Map slug to AEO FAQ slices from the config database
function getAeoFaqsForSlug(slug: string) {
  switch (slug) {
    case "custom-software-development":
      return AEO_FAQS.slice(5, 11);
    case "ai-automation":
      return AEO_FAQS.slice(11, 18);
    case "saas-product-development":
      return AEO_FAQS.slice(18, 24);
    case "web-development":
      return AEO_FAQS.slice(24, 30);
    case "mobile-development":
      return AEO_FAQS.slice(30, 36);
    case "cloud-devops":
      return AEO_FAQS.slice(36, 41);
    case "api-integrations":
      return AEO_FAQS.slice(41, 45);
    case "product-engineering":
      return AEO_FAQS.slice(45, 50);
    default:
      return [];
  }
}

export default function ServicePageClient({ service }: ServicePageClientProps) {
  const pageRef = useServicePageAnimations();
  const geoData = GEO_SERVICES[service.slug];
  const aeoFaqs = getAeoFaqsForSlug(service.slug);

  return (
    <main ref={pageRef} className="bg-[var(--bg-base)] min-h-screen relative overflow-x-clip">
      <ServiceHero service={service} />

      {/* ─── GEO (Generative Engine Optimization) FRAMEWORK SECTION ─── */}
      {geoData && (
        <section className="service-section py-20 bg-white border-y border-slate-100 relative z-10">
          <div className="service-container">
            {/* Header label */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-[1.5px] bg-[#1155CC]" />
              <span className="text-[10px] font-black uppercase text-[#1155CC] tracking-widest">
                Engineered Solutions Framework
              </span>
            </div>

            <h2 className="text-[28px] sm:text-[36px] font-black text-gray-900 leading-tight tracking-tight mb-12">
              {geoData.title}
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              {/* Left Column: Direct GEO Answers */}
              <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-24">
                <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100">
                  <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-2">
                    What is this service?
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed font-medium">
                    {geoData.whatIsIt}
                  </p>
                </div>

                <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100">
                  <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-2">
                    Who is it for?
                  </h3>
                  <p className="text-sm text-gray-750 leading-relaxed">
                    {geoData.whoIsItFor}
                  </p>
                </div>

                <div className="bg-blue-50/40 rounded-2xl p-6 border border-[#22B6F6]/10 space-y-4">
                  <div>
                    <h3 className="text-[10px] font-black uppercase text-[#1155CC] tracking-wider mb-1">
                      Expected Timeline
                    </h3>
                    <p className="text-sm font-bold text-gray-900">
                      {geoData.projectTimeline} (Agile Delivery)
                    </p>
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black uppercase text-[#1155CC] tracking-wider mb-1">
                      Primary Technologies
                    </h3>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {geoData.technologiesUsed.map((tech) => (
                        <span key={tech} className="bg-white border border-slate-150 text-[10px] font-bold text-gray-600 px-2.5 py-1 rounded-full">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Problem-Solution-Outcome Copy */}
              <div className="lg:col-span-7 space-y-8">
                {/* Problem Box */}
                <div className="relative pl-6 border-l-3 border-red-500 space-y-2">
                  <span className="text-[10px] font-black uppercase text-red-500 tracking-wider block">
                    The Business Problem
                  </span>
                  <h4 className="text-lg font-medium text-gray-900">
                    What business problem does it solve?
                  </h4>
                  <p className="text-sm sm:text-base text-gray-500 leading-relaxed">
                    {geoData.problem}
                  </p>
                </div>

                {/* Solution Box */}
                <div className="relative pl-6 border-l-3 border-[#1155CC] space-y-2">
                  <span className="text-[10px] font-black uppercase text-[#1155CC] tracking-wider block">
                    Our Solution Architecture
                  </span>
                  <h4 className="text-lg font-medium text-gray-900">
                    How do we address this?
                  </h4>
                  <p className="text-sm sm:text-base text-gray-500 leading-relaxed">
                    {geoData.solution}
                  </p>
                </div>

                {/* Outcome Box */}
                <div className="relative pl-6 border-l-3 border-green-500 space-y-2">
                  <span className="text-[10px] font-black uppercase text-green-600 tracking-wider block">
                    Operational Outcome
                  </span>
                  <h4 className="text-lg font-medium text-gray-900">
                    What is the expected outcome?
                  </h4>
                  <p className="text-sm sm:text-base text-gray-500 leading-relaxed">
                    {geoData.outcome}
                  </p>
                </div>

                {/* Expected Business Outcomes list */}
                <div className="bg-green-50/20 border border-green-500/10 rounded-[28px] p-6 sm:p-8 space-y-4">
                  <h4 className="text-sm font-black text-green-800 uppercase tracking-wider">
                    Expected Business Outcomes:
                  </h4>
                  <ul className="space-y-3">
                    {geoData.expectedOutcomes.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-gray-700">
                        <span className="w-5 h-5 rounded-full bg-green-500/15 text-green-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
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
          <div className="reveal-up text-center mb-12">
            <span className="section-label">FAQ</span>
            <h2
              className="text-[var(--text-primary)] font-bold tracking-tight"
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
