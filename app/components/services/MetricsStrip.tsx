import type { Metric } from "@/lib/services-data";

interface MetricsStripProps {
  metrics: Metric[];
}

export default function MetricsStrip({ metrics }: MetricsStripProps) {
  return (
    <section className="bg-[#F4F4F5] border-y border-[var(--border)]">
      <div className="service-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[var(--border-strong)]">
          {metrics.map((metric, i) => (
            <div key={i} className="text-center py-6 md:py-0 md:px-8 first:md:pl-0 last:md:pr-0">
              <div className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-1">
                {metric.value}
              </div>
              <div className="text-[14px] text-[var(--text-secondary)]">
                {metric.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
