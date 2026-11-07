"use client";

import React, { useState } from "react";
import { Icon } from "@/app/components/icons/Icon";
import { motion, AnimatePresence } from "motion/react";

export interface FAQ {
  question: string;
  answer?: string;
  directAnswer?: string;
  expandedExplanation?: string;
  businessBenefits?: string;
}

interface ServiceFaqProps {
  faq: FAQ[];
}

export default function ServiceFaq({ faq }: ServiceFaqProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="mx-auto max-w-[800px] space-y-4">
      {faq.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={index}
            className={`overflow-hidden rounded-2xl border transition-all duration-300 ${
              isOpen
                ? "bg-white border-slate-100 shadow-[0_12px_30px_rgba(17,85,204,0.04)]"
                : "bg-transparent border-slate-100/60 hover:bg-slate-50/50"
            }`}
          >
            <button
              onClick={() => toggleFaq(index)}
              className="flex w-full items-center justify-between p-5 text-left text-sm font-bold text-gray-900 transition-colors hover:text-[#1155CC] focus:outline-none"
            >
              <span className="pr-4">{item.question}</span>
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                  isOpen ? "bg-[#1155CC] text-white" : "bg-slate-150/40 text-gray-500"
                }`}
              >
                <Icon
                  name="chevron"
                  className={`h-3.5 w-3.5 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                />
              </div>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                >
                  <div className="border-t border-gray-100/50 px-5 pt-0.5 pb-5 text-xs leading-relaxed text-gray-500 sm:text-sm">
                    {item.directAnswer ? (
                      <div className="space-y-4 pt-4">
                        <div className="rounded-r-xl border-l-3 border-[#1155CC] bg-blue-50/50 p-3.5">
                          <span className="mb-1 block text-[10px] font-black tracking-wider text-[#1155CC] uppercase">
                            Direct Answer
                          </span>
                          <p className="text-xs leading-relaxed font-bold text-gray-950 sm:text-sm">
                            {item.directAnswer}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <span className="block text-[10px] font-black tracking-wider text-gray-400 uppercase">
                            Technical Explanation & Integration
                          </span>
                          <p className="leading-relaxed text-gray-500">
                            {item.expandedExplanation}
                          </p>
                        </div>

                        <div className="space-y-1 rounded-r-xl border-l-3 border-green-500 bg-green-50/40 p-3.5">
                          <span className="block text-[10px] font-black tracking-wider text-green-700 uppercase">
                            Business Benefits & ROI
                          </span>
                          <p className="leading-relaxed font-semibold text-green-800">
                            {item.businessBenefits}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2">{item.answer}</div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
