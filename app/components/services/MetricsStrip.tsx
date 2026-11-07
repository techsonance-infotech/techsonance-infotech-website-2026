import type { Metric } from "@/lib/services-data";

interface MetricsStripProps {
  metrics: Metric[];
}

export default function MetricsStrip({ metrics }: MetricsStripProps) {
  return (
    <section className="border-y border-[var(--border)] bg-[#F4F4F5]">
      <div className="service-container py-12">
        <div className="grid grid-cols-1 divide-y divide-[var(--border-strong)] md:grid-cols-3 md:divide-x md:divide-y-0">
          {metrics.map((metric, i) => (
            <div key={i} className="py-6 text-center md:px-8 md:py-0 first:md:pl-0 last:md:pr-0">
              <div className="mb-1 text-3xl font-bold text-[var(--text-primary)] md:text-4xl">
                {metric.value}
              </div>
              <div className="text-[14px] text-[var(--text-secondary)]">{metric.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
