"use client";

import { Icon, type IconName } from "@/app/components/icons/Icon";
import type { Capability, Service } from "@/lib/services-data";

interface CapabilitiesProps {
  service: Service;
}

function CapabilityCard({ cap, featured = false }: { cap: Capability; featured?: boolean }) {
  return (
    <div
      className={`capability-card flex flex-col bg-white p-5 sm:p-6 md:p-7 ${
        featured ? "h-full md:min-h-[420px]" : "min-h-[240px] md:min-h-[280px]"
      }`}
      data-capability-card
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-[var(--accent-blue)]">
          <Icon name={cap.icon as IconName} className="h-4.5 w-4.5" />
        </div>
      </div>

      <h3 className="mb-2 text-[17px] leading-snug font-bold text-[#0A0A0A]">{cap.title}</h3>
      <p className="mb-4 text-[14px] leading-relaxed text-[#525252]">{cap.description}</p>

      {featured && cap.connectedItems && cap.connectedItems.length > 0 && (
        <div className="mb-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4">
          <p className="mb-3 text-[10px] font-bold tracking-widest text-[var(--accent-blue)] uppercase">
            What gets connected
          </p>
          <ul className="space-y-1.5">
            {cap.connectedItems.map((item) => (
              <li key={item} className="flex items-start gap-2 text-[13px] text-[#525252]">
                <span className="mt-0.5 text-[var(--accent-blue)]">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {cap.tags && cap.tags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {cap.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[#E5E5E5] bg-[#F4F4F5] px-2.5 py-1 text-[11px] font-medium text-[#525252]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto space-y-3">
        {cap.outcome && (
          <div className="flex items-start gap-2 rounded-lg border border-[#A7F3D0] bg-[#ECFDF5] px-3 py-2.5">
            <svg
              className="mt-0.5 h-4 w-4 shrink-0 text-[#059669]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M7 17l5-5 5 5" />
              <path d="M12 7v10" />
            </svg>
            <p className="text-[12px] leading-relaxed font-medium text-[#065F46]">{cap.outcome}</p>
          </div>
        )}
        <p className="text-[11px] font-bold tracking-widest text-[var(--accent-blue)] uppercase">
          • {cap.clientLabel ?? cap.usedInProject.replace(/\s+/g, "").toUpperCase()}
        </p>
      </div>
    </div>
  );
}

export default function Capabilities({ service }: CapabilitiesProps) {
  const caps = service.capabilities.slice(0, 5);
  const [c0, c1, c2, c3, featured] = caps;

  return (
    <section className="service-section bg-white">
      <div className="service-container">
        {/* Header */}
        <div className="reveal-up mb-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="h-px w-5 bg-[var(--accent-blue)]" />
              <span className="text-[11px] font-bold tracking-[0.12em] text-[var(--accent-blue)] uppercase">
                Capabilities
              </span>
            </div>
            <h2
              className="leading-[1.1] font-bold tracking-tight text-[#0A0A0A]"
              style={{ fontSize: "clamp(32px, 4vw, 44px)" }}
            >
              What we <span className="text-[var(--accent-blue)]">actually</span> ship
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-8">
            <div>
              <p className="text-2xl font-bold text-[#0A0A0A]">15+</p>
              <p className="text-[13px] text-[#737373]">Production projects</p>
            </div>
            <div className="h-10 w-px bg-[#E5E5E5]" />
            <div>
              <p className="text-2xl font-bold text-[#0A0A0A]">99.9%</p>
              <p className="text-[13px] text-[#737373]">Uptime SLA</p>
            </div>
          </div>
        </div>

        {/* Bento grid */}
        <div
          className="grid grid-cols-1 overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white lg:grid-cols-3"
          data-capability-grid
        >
          {/* Column 1 */}
          <div className="grid grid-cols-1 divide-y divide-[#E5E5E5] border-[#E5E5E5] lg:border-r">
            {c0 && <CapabilityCard cap={c0} />}
            {c1 && <CapabilityCard cap={c1} />}
          </div>

          {/* Column 2 */}
          <div className="grid grid-cols-1 divide-y divide-[#E5E5E5] border-[#E5E5E5] lg:border-r">
            {c2 && <CapabilityCard cap={c2} />}
            {c3 && <CapabilityCard cap={c3} />}
          </div>

          {/* Column 3 — featured */}
          {featured && (
            <div className="border-t border-[#E5E5E5] lg:border-t-0">
              <CapabilityCard cap={featured} featured />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
