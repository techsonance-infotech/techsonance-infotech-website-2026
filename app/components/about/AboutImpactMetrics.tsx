"use client";

import React, { useRef, useState, useEffect } from "react";
import { useInView } from "motion/react";

interface CountUpProps {
  value: number;
  suffix?: string;
  delay?: number;
}

function CountUp({ value, suffix = "", delay = 0 }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (isInView) {
      const duration = 2000;
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOutQuad = progress * (2 - progress);
        setCount(Math.floor(easeOutQuad * value));

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setCount(value);
        }
      };

      const timeout = setTimeout(() => {
        requestAnimationFrame(animate);
      }, delay * 1000);

      return () => clearTimeout(timeout);
    }
  }, [isInView, value, delay]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

const STATS = [
  { val: 4, suffix: "+", label: "Years Experience" },
  { val: 15, suffix: "+", label: "Products Delivered" },
  { val: 100, suffix: "K+", label: "Lines of Code" },
  { val: 5, suffix: "+", label: "Industries Served" },
  { val: 99.9, suffix: "%", label: "Uptime Delivered" },
];

export function AboutImpactMetrics() {
  return (
    <section className="relative overflow-hidden border-t border-slate-900 bg-[#050B14] py-24 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:50px_50px]" />

      {/* Expanding glows */}
      <div className="pointer-events-none absolute top-1/2 left-1/4 h-96 w-96 -translate-y-1/2 rounded-full bg-[#1155CC]/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 right-1/4 h-96 w-96 -translate-y-1/2 rounded-full bg-[#22B6F6]/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-5 md:gap-4">
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-4 backdrop-blur-sm"
            >
              <div className="mb-2 font-mono text-4xl font-black text-white sm:text-5xl">
                <CountUp value={stat.val} suffix={stat.suffix} delay={i * 0.15} />
              </div>
              <div className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase sm:text-xs">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
