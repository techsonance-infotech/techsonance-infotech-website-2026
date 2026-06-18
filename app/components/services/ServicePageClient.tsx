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

interface ServicePageClientProps {
  service: Service;
}

export default function ServicePageClient({ service }: ServicePageClientProps) {
  const pageRef = useServicePageAnimations();

  return (
    <main ref={pageRef} className="bg-[var(--bg-base)] min-h-screen">
      <ServiceHero service={service} />
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
              Common Questions
            </h2>
          </div>
          <ServiceFaq faq={service.faqs} />
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
