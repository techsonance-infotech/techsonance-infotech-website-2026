"use client";

import React from "react";
import { Check, Minus, Layers } from "lucide-react";

interface ComparisonRow {
  feature: string;
  mvp: string | boolean;
  pod: string | boolean;
  enterprise: string | boolean;
}

function renderCell(val: string | boolean) {
  if (typeof val === "boolean") {
    return val ? (
      <Check className="mx-auto h-4 w-4 text-emerald-600" />
    ) : (
      <Minus className="mx-auto h-4 w-4 text-slate-300" />
    );
  }
  return <span className="text-xs font-semibold text-slate-700">{val}</span>;
}

const COMPARISON_ROWS: ComparisonRow[] = [
  {
    feature: "Typical Delivery Timeline",
    mvp: "3 - 4 Weeks",
    pod: "Monthly Sprints (Bi-weekly demos)",
    enterprise: "8 - 16 Weeks Custom",
  },
  {
    feature: "Code & IP Ownership",
    mvp: "100% Transfer upon completion",
    pod: "Continuous Day-1 repo transfer",
    enterprise: "Full IP + custom SLA ownership",
  },
  {
    feature: "Architecture Stack",
    mvp: "Next.js 16 + React 19 + Supabase",
    pod: "Bespoke (Next.js / Flutter / AI)",
    enterprise: "Multi-tenant / Cloudflare / AWS",
  },
  {
    feature: "Dedicated Solutions Architect",
    mvp: false,
    pod: true,
    enterprise: true,
  },
  {
    feature: "Guaranteed Timezone Overlap",
    mvp: "4 Hours Daily",
    pod: "4 - 6 Hours Daily",
    enterprise: "Full Regional Alignment",
  },
  {
    feature: "Automated CI/CD & Testing",
    mvp: "GitHub Actions Baseline",
    pod: "Strict CI/CD + Vitest suites",
    enterprise: "Full SOC2 ready pipeline",
  },
  {
    feature: "Post-Launch Warranty",
    mvp: "30 Days included",
    pod: "Continuous during retainer",
    enterprise: "90 Days + SLA guarantee",
  },
  {
    feature: "Multi-Currency Wire / Invoicing",
    mvp: true,
    pod: true,
    enterprise: true,
  },
];

export function PricingComparison() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
            <Layers className="h-3.5 w-3.5" />
            <span>Detailed Breakdown</span>
          </div>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Compare Engagement Models
          </h2>
          <p className="mt-2 text-xs text-slate-500 sm:text-sm">
            Evaluate deliverables, velocity, and architecture support across our 3 engagement tiers.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="mt-10 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75">
                  <th className="py-4 pr-4 pl-6 font-bold text-slate-900">Deliverable / Scope</th>
                  <th className="px-4 py-4 text-center font-bold text-slate-900">MVP Sprint</th>
                  <th className="px-4 py-4 text-center font-bold text-[#1155CC]">
                    Dedicated Pod (Popular)
                  </th>
                  <th className="py-4 pr-6 pl-4 text-center font-bold text-slate-900">
                    Enterprise Platform
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.feature} className="hover:bg-slate-50/50">
                    <td className="py-3.5 pr-4 pl-6 font-medium text-slate-800">{row.feature}</td>
                    <td className="px-4 py-3.5 text-center">{renderCell(row.mvp)}</td>
                    <td className="bg-[#1155CC]/5 px-4 py-3.5 text-center">
                      {renderCell(row.pod)}
                    </td>
                    <td className="py-3.5 pr-6 pl-4 text-center">{renderCell(row.enterprise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
