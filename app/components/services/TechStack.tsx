"use client";

import { useState } from "react";
import type { Service } from "@/lib/services-data";

interface TechStackProps {
  service: Service;
}

export default function TechStack({ service }: TechStackProps) {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  return (
    <section className="service-section bg-[var(--bg-base)]">
      <div className="service-container">
        <div className="reveal-up mb-12">
          <span className="section-label">Technology</span>
          <h2
            className="text-[var(--text-primary)] font-bold tracking-tight"
            style={{ fontSize: "var(--text-section-title)" }}
          >
            Technology Stack
          </h2>
        </div>
        <div className="tech-stack-grid grid grid-cols-1 md:grid-cols-3 gap-10">
          {service.techStack.map((group, gi) => (
            <div key={gi} className="tech-reveal">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 pb-2 border-b border-[var(--border)]">
                {group.category}
              </h3>
              <div className="flex flex-wrap gap-2">
                {group.items.map((item, ii) => {
                  const key = `${gi}-${ii}`;
                  return (
                    <div key={key} className="relative">
                      <button
                        type="button"
                        className="tech-badge px-3 py-1.5 text-[13px] font-medium text-[var(--text-primary)] bg-[var(--bg-muted)] border border-[var(--border)] rounded-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]"
                        onMouseEnter={() => item.why && setActiveTooltip(key)}
                        onMouseLeave={() => setActiveTooltip(null)}
                        onFocus={() => item.why && setActiveTooltip(key)}
                        onBlur={() => setActiveTooltip(null)}
                      >
                        {item.name}
                      </button>
                      {item.why && activeTooltip === key && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 px-3 py-2 text-[12px] text-white bg-[var(--text-primary)] rounded-lg shadow-lg z-10 pointer-events-none">
                          {item.why}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--text-primary)]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
