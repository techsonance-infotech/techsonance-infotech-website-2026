"use client";

import { useEffect, useRef } from "react";
import type { Service } from "@/lib/services-data";

import HeroContactForm from "./HeroContactForm";

const SERVICE_HERO_CONTENT: Record<
  string,
  { label: string; titleStart: string; titleGradient: string; description: string }
> = {
  "custom-software-development": {
    label: "CUSTOM SOFTWARE DEVELOPMENT SERVICES",
    titleStart: "Transform Your Vision Into Powerful Enterprise Platforms With ",
    titleGradient: "Expert Software Engineers",
    description:
      "As a premier custom software engineering partner, we deliver high-velocity, reliable digital solutions that automate workflows, scale operations, and drive real business results. Our experienced team builds secure, bespoke systems tailored to your unique architecture.",
  },
  "ai-automation": {
    label: "AI & AUTOMATION SERVICES",
    titleStart: "Supercharge Workflows and Drive Intelligent Decisions With ",
    titleGradient: "Next-Gen AI Solutions",
    description:
      "Empower your business with custom LLM integrations, predictive modeling, and intelligent cognitive automation. We design, fine-tune, and deploy custom AI solutions that turn complex data into actionable operational growth.",
  },
  "saas-product-development": {
    label: "SAAS PRODUCT DEVELOPMENT SERVICES",
    titleStart: "Turn Your Vision Into a Scalable, Market-Ready Product With ",
    titleGradient: "SaaS Product Specialists",
    description:
      "Launch production-grade multi-tenant architectures, subscription systems, and intuitive dashboards designed to convert. We handle the engineering complexity, database optimization, and API design so you can scale rapidly.",
  },
  "web-development": {
    label: "WEB DEVELOPMENT SERVICES",
    titleStart: "Build Premium, Performant, and Fast Web Platforms With ",
    titleGradient: "Elite Frontend Engineers",
    description:
      "Deliver stunning user interfaces, lightning-fast response times, and premium SEO-optimized web applications. We utilize cutting-edge React/Next.js frameworks and highly responsive custom layouts that build immediate user trust.",
  },
  "mobile-development": {
    label: "MOBILE DEVELOPMENT SERVICES",
    titleStart: "Transform Your Vision Into Powerful Mobile Apps With ",
    titleGradient: "Expert App Developers",
    description:
      "As a leading mobile app development partner, we deliver native iOS, Android, and cross-platform Flutter/React Native solutions. Our experienced team creates sleek user experiences combined with robust, secure offline-first functionality.",
  },
  "cloud-devops": {
    label: "CLOUD & DEVOPS SERVICES",
    titleStart: "Scale Your Infrastructure With Zero-Downtime Pipeline & ",
    titleGradient: "Elite DevOps Architects",
    description:
      "Optimize cloud expenditures, secure your systems, and automate code deployments. We configure Kubernetes, AWS/GCP, and CI/CD pipelines to achieve maximum availability, high security, and auto-scaling performance.",
  },
  "api-integrations": {
    label: "API INTEGRATION SERVICES",
    titleStart: "Connect Your Data and Automate Cross-Platform Workflows With ",
    titleGradient: "Custom Integration Pipelines",
    description:
      "Bridge the gaps between your legacy databases, CRM platforms, ERP systems, and third-party SaaS tools. We design secure, high-throughput, and rate-limited API connectors that sync data across your ecosystem in real time.",
  },
  "product-engineering": {
    label: "PRODUCT ENGINEERING SERVICES",
    titleStart: "Translate Complex Product Concepts Into High-Fidelity & ",
    titleGradient: "Production-Grade Solutions",
    description:
      "From rapid prototyping to industrial firmware and full-stack integration, our product engineers ensure high reliability and architectural beauty. We build systems that stand the test of time and scale gracefully.",
  },
};

interface ServiceHeroProps {
  service: Service;
}

export default function ServiceHero({ service }: ServiceHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);

  const heroContent = SERVICE_HERO_CONTENT[service.slug] || {
    label: `${service.name.toUpperCase()} SERVICES`,
    titleStart: `Build Your Enterprise Applications With `,
    titleGradient: `Expert Engineers`,
    description: service.tagline,
  };

  useEffect(() => {
    let ctx: { revert: () => void } | undefined;

    async function init() {
      const { gsap } = await import("gsap");
      if (!sectionRef.current) return;

      const targets = sectionRef.current.querySelectorAll("[data-hero-item]");
      ctx = gsap.context(() => {
        gsap.fromTo(
          targets,
          { opacity: 0, y: 32 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.15,
            ease: "power2.out",
          }
        );
      }, sectionRef);
    }

    init();
    return () => ctx?.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="min-h-screen flex items-center bg-[var(--bg-base)] border-b border-[var(--border)] relative overflow-hidden"
    >
      {/* Premium Theme Gradient Grid Mesh Background (Only for the Hero section) */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(17, 85, 204, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(17, 85, 204, 0.04) 1px, transparent 1px),
            radial-gradient(circle 800px at 20% 20%, rgba(17, 85, 204, 0.08), transparent),
            radial-gradient(circle 1000px at 80% 80%, rgba(34, 182, 246, 0.08), transparent)
          `,
          backgroundSize: "48px 48px, 48px 48px, 100% 100%, 100% 100%",
        }}
      />

      <div className="service-container w-full py-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            {/* Category Label */}
            <div data-hero-item className="inline-flex items-center gap-2 bg-[#F1F5F9] border border-[#1155CC]/10 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 rounded-full bg-[#22B6F6] animate-pulse" />
              <span className="text-[10px] font-black text-[#1155CC] tracking-widest uppercase">
                {heroContent.label}
              </span>
            </div>

            <h1
              data-hero-item
              className="font-bold tracking-tight text-[var(--text-primary)] leading-[1.2] mb-6"
              style={{ fontSize: "clamp(32px, 3.8vw, 42px)" }}
            >
              {heroContent.titleStart}
              <span className="bg-gradient-to-r from-[#1155CC] to-[#22B6F6] bg-clip-text text-transparent block sm:inline">
                {heroContent.titleGradient}
              </span>
            </h1>
            <p
              data-hero-item
              className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed mb-10 max-w-xl"
            >
              {heroContent.description}
            </p>
            <div data-hero-item className="flex flex-wrap items-center gap-4">
              <a href="#project-request" className="btn-primary px-6 py-3 rounded-xl font-semibold flex justify-center items-center gap-2 text-sm shadow-[0_4px_20px_rgba(17, 85, 204,0.15)]">
                Talk to Expert &rarr;
              </a>
              <a href="#proof-of-work" className="btn-outline px-6 py-3 rounded-xl font-semibold flex justify-center items-center gap-2 text-sm bg-white">
                See Case Studies &darr;
              </a>
            </div>
          </div>

          <div data-hero-item className="relative">
            <HeroContactForm serviceName={service.name} />
          </div>
        </div>
      </div>
    </section>
  );
}
