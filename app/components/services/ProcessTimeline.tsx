"use client";

import { useEffect, useRef } from "react";
import { Icon, type IconName } from "@/app/components/icons/Icon";
import type { Service } from "@/lib/services-data";

interface ProcessTimelineProps {
  service: Service;
}

export default function ProcessTimeline({ service }: ProcessTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ctx: { revert: () => void } | undefined;
    let mm: ReturnType<typeof import("gsap").gsap.matchMedia> | undefined;

    async function init() {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      if (!containerRef.current) return;

      mm = gsap.matchMedia();

      // Desktop/Tablet animations: Smooth staggered fade and slide up
      mm.add("(min-width: 768px)", () => {
        const steps = containerRef.current!.querySelectorAll<HTMLElement>(".process-step-item");

        ctx = gsap.context(() => {
          steps.forEach((step, index) => {
            gsap.fromTo(
              step,
              { opacity: 0, y: 40 },
              {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: "power2.out",
                scrollTrigger: {
                  trigger: step,
                  start: "top 85%",
                  toggleActions: "play none none none",
                },
              }
            );
          });
        }, containerRef.current!);
      });

      // Mobile: Instant layout, avoid scrolling lag or unexpected positioning shifts
      mm.add("(max-width: 767px)", () => {
        const steps = containerRef.current!.querySelectorAll<HTMLElement>(".process-step-item");
        ctx = gsap.context(() => {
          gsap.set(steps, { opacity: 1, y: 0 });
        }, containerRef.current!);
      });
    }

    init();
    return () => {
      ctx?.revert();
      mm?.revert();
    };
  }, [service.process]);

  return (
    <section ref={containerRef} className="bg-[var(--bg-muted)] border-y border-[var(--border)] py-20 md:py-28 overflow-hidden">
      <div className="service-container">
        <div className="reveal-up mb-16 md:mb-24 max-w-3xl">
          <span className="section-label">Our Approach</span>
          <h2
            className="text-[var(--text-primary)] font-extrabold tracking-tight"
            style={{ fontSize: "var(--text-section-title)" }}
          >
            How We Work
          </h2>
          <p className="text-[var(--text-secondary)] mt-4 text-base md:text-lg leading-relaxed">
            Our structured engineering process ensures transparency, velocity, and high-fidelity output from kick-off to deployment.
          </p>
        </div>

        {/* Vertical Timeline Track */}
        <div className="relative max-w-3xl mx-auto pl-10 md:pl-16 space-y-16 md:space-y-24">
          {/* Vertical timeline line background */}
          <div className="absolute top-2 bottom-2 left-[19px] md:left-[27px] w-0.5 bg-gradient-to-b from-[var(--accent-blue)] via-[var(--border-strong)] to-transparent pointer-events-none" />

          {service.process.map((step, i) => (i < service.process.length && (
            <div
              key={i}
              className="process-step-item relative transition-all duration-300"
            >
              {/* Timeline Indicator Node */}
              <div className="absolute -left-[30px] md:-left-[47px] top-1 flex items-center justify-center z-10">
                <div className="w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-[var(--accent-blue)] bg-[var(--bg-muted)] flex items-center justify-center shadow-md">
                  <div className="w-2 h-2 rounded-full bg-[var(--accent-blue)] animate-pulse" />
                </div>
              </div>

              {/* Step content */}
              <div>
                <span className="text-5xl md:text-6xl font-extrabold text-[var(--border-strong)] opacity-50 font-mono leading-none block mb-4 select-none">
                  {String(i + 1).padStart(2, "0")}
                </span>

                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl border border-[var(--border)] bg-[var(--bg-subtle)] flex items-center justify-center text-[var(--accent-blue)] shadow-[var(--shadow-card)] shrink-0">
                    <Icon name={step.icon as IconName} className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-[var(--text-primary)]">
                    {step.title}
                  </h3>
                </div>

                <p className="text-[var(--text-secondary)] leading-relaxed text-[15px] md:text-[16px] max-w-xl">
                  {step.description}
                </p>
              </div>
            </div>
          )))}
        </div>
      </div>
    </section>
  );
}
