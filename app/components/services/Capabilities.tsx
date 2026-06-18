"use client";

import { Icon, type IconName } from "@/app/components/icons/Icon";
import type { Capability, Service } from "@/lib/services-data";

interface CapabilitiesProps {
  service: Service;
}

function CapabilityCard({
  cap,
  featured = false,
}: {
  cap: Capability;
  featured?: boolean;
}) {
  return (
    <div
      className={`capability-card flex flex-col p-5 sm:p-6 md:p-7 bg-white ${
        featured ? "h-full md:min-h-[420px]" : "min-h-[240px] md:min-h-[280px]"
      }`}
      data-capability-card
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-[var(--accent-blue)] shrink-0">
          <Icon name={cap.icon as IconName} className="w-4.5 h-4.5" />
        </div>
      </div>

      <h3 className="text-[17px] font-bold text-[#0A0A0A] mb-2 leading-snug">
        {cap.title}
      </h3>
      <p className="text-[14px] text-[#525252] leading-relaxed mb-4">
        {cap.description}
      </p>

      {featured && cap.connectedItems && cap.connectedItems.length > 0 && (
        <div className="mb-4 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-blue)] mb-3">
            What gets connected
          </p>
          <ul className="space-y-1.5">
            {cap.connectedItems.map((item) => (
              <li
                key={item}
                className="text-[13px] text-[#525252] flex items-start gap-2"
              >
                <span className="text-[var(--accent-blue)] mt-0.5">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {cap.tags && cap.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {cap.tags.map((tag) => (
            <span
              key={tag}
              className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#F4F4F5] border border-[#E5E5E5] text-[#525252]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto space-y-3">
        {cap.outcome && (
          <div className="flex items-start gap-2 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] px-3 py-2.5">
            <svg
              className="w-4 h-4 text-[#059669] shrink-0 mt-0.5"
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
            <p className="text-[12px] text-[#065F46] leading-relaxed font-medium">
              {cap.outcome}
            </p>
          </div>
        )}
        <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--accent-blue)]">
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
        <div className="reveal-up flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-5 h-px bg-[var(--accent-blue)]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--accent-blue)]">
                Capabilities
              </span>
            </div>
            <h2
              className="font-bold tracking-tight text-[#0A0A0A] leading-[1.1]"
              style={{ fontSize: "clamp(32px, 4vw, 44px)" }}
            >
              What we{" "}
              <span className="text-[var(--accent-blue)]">actually</span> ship
            </h2>
          </div>
          <div className="flex items-center gap-8 shrink-0">
            <div>
              <p className="text-2xl font-bold text-[#0A0A0A]">15+</p>
              <p className="text-[13px] text-[#737373]">Production projects</p>
            </div>
            <div className="w-px h-10 bg-[#E5E5E5]" />
            <div>
              <p className="text-2xl font-bold text-[#0A0A0A]">99.9%</p>
              <p className="text-[13px] text-[#737373]">Uptime SLA</p>
            </div>
          </div>
        </div>

        {/* Bento grid */}
        <div
          className="rounded-2xl border border-[#E5E5E5] overflow-hidden bg-white grid grid-cols-1 lg:grid-cols-3"
          data-capability-grid
        >
          {/* Column 1 */}
          <div className="grid grid-cols-1 divide-y divide-[#E5E5E5] lg:border-r border-[#E5E5E5]">
            {c0 && <CapabilityCard cap={c0} />}
            {c1 && <CapabilityCard cap={c1} />}
          </div>

          {/* Column 2 */}
          <div className="grid grid-cols-1 divide-y divide-[#E5E5E5] lg:border-r border-[#E5E5E5]">
            {c2 && <CapabilityCard cap={c2} />}
            {c3 && <CapabilityCard cap={c3} />}
          </div>

          {/* Column 3 — featured */}
          {featured && (
            <div className="border-t lg:border-t-0 border-[#E5E5E5]">
              <CapabilityCard cap={featured} featured />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
