"use client";

import React from "react";

export function AboutTrustCredibility() {
  return (
    <section className="bg-[#FAFBFD] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-2 text-xs font-bold tracking-widest text-[#1155CC] uppercase">
            Systems Trust
          </h2>
          <h3 className="text-3xl font-medium tracking-tight text-gray-900 sm:text-4xl">
            Trust & Credibility
          </h3>
          <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
            Measurable reliability indicators supporting our operations.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Box 1 */}
          <div className="flex flex-col justify-between rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#1155CC]">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-9h1.5m-1.5 3h1.5m-1.5 3h1.5M9 16.5h1.5m3 0h1.5"
                />
              </svg>
            </div>
            <div>
              <h4 className="mb-1 text-sm font-bold text-gray-900">5+ Industries Served</h4>
              <p className="text-[11px] font-medium text-slate-400">
                Logistics, Retail, FinTech, E-Commerce, and SaaS.
              </p>
            </div>
          </div>

          {/* Box 2 */}
          <div className="flex flex-col justify-between rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#1155CC]">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h4 className="mb-1 text-sm font-bold text-gray-900">98% On-Time Sprints</h4>
              <p className="text-[11px] font-medium text-slate-400">
                Rigorous sprint planning ensures features are delivered on schedule.
              </p>
            </div>
          </div>

          {/* Box 3 */}
          <div className="flex flex-col justify-between rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#1155CC]">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h4 className="mb-1 text-sm font-bold text-gray-900">&lt; 2-Hour SLA Response</h4>
              <p className="text-[11px] font-medium text-slate-400">
                Active telemetry reports trigger instant response protocols from senior engineers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
