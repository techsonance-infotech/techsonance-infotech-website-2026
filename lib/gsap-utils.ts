"use client";
// ─── GSAP Utility Hooks & Helpers ───────────────────────────────────────────
// All GSAP interactions are client-side only.
// Usage: import in "use client" components.

import { useEffect, useRef } from "react";

// ─── Service page scroll animations ──────────────────────────────────────────
export function useServicePageAnimations() {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let active = true;
    let ctx: { revert: () => void } | undefined;

    async function init() {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      if (!active || !ref.current) return;

      ctx = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>(".reveal-up").forEach((el) => {
          gsap.fromTo(
            el,
            { opacity: 0, y: 40 },
            {
              opacity: 1,
              y: 0,
              duration: 0.7,
              ease: "power2.out",
              scrollTrigger: {
                trigger: el,
                start: "top 85%",
                toggleActions: "play none none none",
              },
            }
          );
        });

        gsap.utils.toArray<HTMLElement>(".card-grid").forEach((grid) => {
          const cards = grid.querySelectorAll<HTMLElement>(".card");
          gsap.fromTo(
            cards,
            { opacity: 0, y: 50 },
            {
              opacity: 1,
              y: 0,
              duration: 0.5,
              stagger: 0.1,
              ease: "power2.out",
              scrollTrigger: {
                trigger: grid,
                start: "top 80%",
                toggleActions: "play none none none",
              },
            }
          );
        });

        gsap.utils.toArray<HTMLElement>("[data-capability-card]").forEach((card, i) => {
          gsap.fromTo(
            card,
            { clipPath: "inset(100% 0 0 0)" },
            {
              clipPath: "inset(0% 0 0 0)",
              duration: 0.4,
              delay: (i % 2) * 0.1,
              ease: "power2.out",
              scrollTrigger: {
                trigger: card,
                start: "top 85%",
                toggleActions: "play none none none",
              },
            }
          );
        });

        gsap.utils.toArray<HTMLElement>(".tech-reveal").forEach((el, i) => {
          gsap.fromTo(
            el,
            { opacity: 0, y: 24 },
            {
              opacity: 1,
              y: 0,
              duration: 0.5,
              delay: i * 0.1,
              ease: "power2.out",
              scrollTrigger: {
                trigger: el,
                start: "top 85%",
                toggleActions: "play none none none",
              },
            }
          );
        });
      }, ref);
    }

    init();
    return () => {
      active = false;
      ctx?.revert();
    };
  }, []);

  return ref;
}

// ─── Scroll Reveal (stagger fade-up) ─────────────────────────────────────────
export function useScrollReveal(deps: unknown[] = []) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let active = true;
    let ctx: { revert: () => void } | undefined;

    async function init() {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      if (!active || !ref.current) return;

      ctx = gsap.context(() => {
        const targets = ref.current!.querySelectorAll("[data-reveal]");
        if (!targets.length) return;

        gsap.fromTo(
          targets,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.75,
            stagger: 0.12,
            ease: "power3.out",
            scrollTrigger: {
              trigger: ref.current,
              start: "top 82%",
              once: true,
            },
          }
        );
      }, ref);
    }

    init();

    return () => {
      active = false;
      ctx?.revert();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}

// ─── Parallax on scroll ────────────────────────────────────────────────────────
export function useParallax(speed = 0.3) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let active = true;
    let ctx: { revert: () => void } | undefined;

    async function init() {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      if (!active || !ref.current) return;

      ctx = gsap.context(() => {
        gsap.to(ref.current, {
          yPercent: speed * 100,
          ease: "none",
          scrollTrigger: {
            trigger: ref.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });
      }, ref);
    }
    init();

    return () => {
      active = false;
      ctx?.revert();
    };
  }, [speed]);

  return ref;
}

// ─── Counter animation ─────────────────────────────────────────────────────────
export function useCounterAnimation(end: number, duration = 2, decimals = 0) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let active = true;
    let ctx: { revert: () => void } | undefined;

    async function init() {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      if (!active || !ref.current) return;
      const el = ref.current;

      ctx = gsap.context(() => {
        ScrollTrigger.create({
          trigger: el,
          start: "top 85%",
          once: true,
          onEnter: () => {
            gsap.fromTo(
              { val: 0 },
              { val: end, duration, ease: "power2.out" },
              {
                val: end,
                duration,
                ease: "power2.out",
                onUpdate: function () {
                  el.textContent = this.targets()[0].val.toFixed(decimals);
                },
              }
            );
          },
        });
      }, el);
    }
    init();

    return () => {
      active = false;
      ctx?.revert();
    };
  }, [end, duration, decimals]);

  return ref;
}

// ─── Pinned horizontal section ────────────────────────────────────────────────
export function usePinnedSection() {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let active = true;
    let ctx: { revert: () => void } | undefined;

    async function init() {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      if (!active || !ref.current) return;

      ctx = gsap.context(() => {
        const panels = ref.current!.querySelectorAll<HTMLElement>("[data-panel]");
        if (panels.length < 2) return;

        gsap.to(panels, {
          xPercent: -100 * (panels.length - 1),
          ease: "none",
          scrollTrigger: {
            trigger: ref.current,
            pin: true,
            scrub: 1,
            end: () => `+=${ref.current!.offsetWidth * (panels.length - 1)}`,
            snap: 1 / (panels.length - 1),
          },
        });
      }, ref);
    }
    init();

    return () => {
      active = false;
      ctx?.revert();
    };
  }, []);

  return ref;
}
