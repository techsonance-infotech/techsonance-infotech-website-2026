"use client";

import React, { useState } from "react";
import { HelpCircle, ChevronDown } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
}

const PRICING_FAQS: FaqItem[] = [
  {
    question: "How does currency conversion and invoicing work for international clients?",
    answer:
      "All invoices and contract scopes are denominated in your preferred currency (USD, EUR, GBP, AED, or INR). We provide transparent milestone breakdowns with no hidden foreign exchange markups, supporting international SWIFT/wire transfers, Stripe, and localized payment rails.",
  },
  {
    question: "Who owns the code, repository, and intellectual property?",
    answer:
      "You retain 100% full intellectual property (IP) and repository ownership. For both fixed-scope and dedicated pod contracts, source code is developed directly in your private GitHub/GitLab repositories with zero lock-in.",
  },
  {
    question: "How is daily communication and timezone overlap managed?",
    answer:
      "We guarantee 4 to 6 hours of synchronous daily overlap with your business hours — whether you are based in North America (EST/PST), the United Kingdom (GMT), Europe (CET), or the Middle East (GST). You have direct access to your lead engineers via Slack, Teams, and daily or bi-weekly video standups.",
  },
  {
    question: "What is your bug warranty and post-launch guarantee?",
    answer:
      "Fixed-price MVP sprints include a comprehensive 30-day post-launch warranty covering any scope bugs at zero additional cost. Dedicated pods and enterprise platforms include continuous maintenance, active monitoring, and SLA agreements.",
  },
  {
    question: "Can we start with a small pilot or discovery sprint first?",
    answer:
      "Yes. Most enterprise partners start with our 2 to 3-week Discovery & MVP Sprint to validate engineering velocity, architecture design, and communication before scaling up into a full dedicated pod.",
  },
];

export function PricingFaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Got Questions?</span>
          </div>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Frequently Asked Pricing Questions
          </h2>
          <p className="mt-2 text-xs text-slate-500 sm:text-sm">
            Everything you need to know about billing, contracts, and international delivery.
          </p>
        </div>

        <div className="mt-8 space-y-3">
          {PRICING_FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={faq.question}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="flex w-full items-center justify-between p-4.5 text-left text-xs font-bold text-slate-900 sm:text-sm"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-[#1155CC]" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="border-t border-slate-100 px-4.5 pt-2 pb-4.5 text-xs leading-relaxed text-slate-600 sm:text-sm">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
