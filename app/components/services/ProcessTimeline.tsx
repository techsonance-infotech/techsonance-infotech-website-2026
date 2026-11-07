"use client";

import { useEffect, useRef } from "react";
import { Icon, type IconName } from "@/app/components/icons/Icon";
import type { Service } from "@/lib/services-data";

interface ProcessTimelineProps {
  service: Service;
}

export default function ProcessTimeline({ service }: ProcessTimelineProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ctx: { revert: () => void } | undefined;
    let mm: ReturnType<typeof import("gsap").gsap.matchMedia> | undefined;

    async function init() {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      if (!sectionRef.current || !trackRef.current) return;

      mm = gsap.matchMedia();

      // Desktop: horizontal scroll pinned
      mm.add("(min-width: 768px)", () => {
        const track = trackRef.current!;
        const scrollAmount = track.scrollWidth - track.parentElement!.clientWidth;

        ctx = gsap.context(() => {
          gsap.to(track, {
            x: -scrollAmount,
            ease: "none",
            scrollTrigger: {
              trigger: sectionRef.current!,
              pin: true,
              scrub: 0.6,
              start: "top top",
              end: () => `+=${scrollAmount}`,
              invalidateOnRefresh: true,
            },
          });
        }, sectionRef.current!);
      });

      // Mobile: simple fade-in
      mm.add("(max-width: 767px)", () => {
        const cards = trackRef.current!.querySelectorAll<HTMLElement>(".process-card");
        ctx = gsap.context(() => {
          cards.forEach((card) => {
            gsap.fromTo(
              card,
              { opacity: 0, y: 24 },
              {
                opacity: 1,
                y: 0,
                duration: 0.5,
                ease: "power2.out",
                scrollTrigger: {
                  trigger: card,
                  start: "top 90%",
                  toggleActions: "play none none none",
                },
              },
            );
          });
        }, sectionRef.current!);
      });
    }

    init();
    return () => {
      ctx?.revert();
      mm?.revert();
    };
  }, [service.process]);

  return (
    <section
      ref={sectionRef}
      className="overflow-hidden border-y border-[var(--border)] bg-[var(--bg-muted)]"
    >
      <div className="py-16 md:py-24">
        {/* Header */}
        <div className="service-container mb-10 md:mb-14">
          <div className="max-w-3xl">
            <span className="section-label">Our Approach</span>
            <h2
              className="font-medium tracking-tight text-[var(--text-primary)]"
              style={{ fontSize: "var(--text-section-title)" }}
            >
              How We Work
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base md:text-lg">
              Our structured engineering process ensures transparency, velocity, and high-fidelity
              output from kick-off to deployment.
            </p>
          </div>
        </div>

        {/* Horizontal track (desktop) / Stacked grid (mobile) */}
        <div className="relative">
          {/* Timeline bar — desktop */}
          <div className="pointer-events-none absolute top-[68px] right-0 left-0 z-0 hidden h-[2px] bg-gradient-to-r from-transparent via-[var(--accent-blue)]/20 to-transparent md:block" />

          <div
            ref={trackRef}
            className="
              grid grid-cols-1 gap-4 px-4 sm:px-6
              md:flex md:gap-0 md:px-0 md:pl-[max(2rem,calc((100vw-1200px)/2))]
            "
            style={{ willChange: "transform" }}
          >
            {service.process.map((step, i) => (
              <div key={i} className="process-card md:w-[340px] md:shrink-0 md:pr-6 lg:w-[380px]">
                {/* Timeline node — desktop only */}
                <div className="mb-6 hidden items-center justify-center md:flex">
                  <div className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 border-[var(--accent-blue)] bg-[var(--bg-muted)] shadow-sm">
                    <span className="text-[10px] font-medium text-[var(--accent-blue)]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                </div>

                {/* Card */}
                <div className="h-full rounded-xl border border-[var(--border)] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(17,85,204,0.06)] md:rounded-2xl md:p-6">
                  {/* Mobile step badge */}
                  <div className="mb-3 flex items-center gap-2.5 md:hidden">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[var(--accent-blue)]">
                      <span className="text-[9px] font-medium text-[var(--accent-blue)]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <div className="h-px flex-1 bg-[var(--border)]" />
                  </div>

                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--accent-blue)]">
                      <Icon name={step.icon as IconName} className="h-4.5 w-4.5" />
                    </div>
                    <h3 className="text-base leading-tight font-bold text-[var(--text-primary)] md:text-lg">
                      {step.title}
                    </h3>
                  </div>

                  <p className="text-[13px] leading-relaxed text-[var(--text-secondary)] md:text-[14px]">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}

            {/* Right spacer for desktop scroll */}
            <div className="hidden md:block md:w-[80px] md:shrink-0" aria-hidden />
          </div>
        </div>
      </div>
    </section>
  );
}
