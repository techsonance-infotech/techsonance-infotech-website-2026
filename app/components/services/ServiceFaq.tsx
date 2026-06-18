"use client";

import React, { useState } from "react";
import { Icon } from "@/app/components/icons/Icon";
import { motion, AnimatePresence } from "framer-motion";

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
    <div className="max-w-[800px] mx-auto space-y-4">
      {faq.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={index}
            className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
              isOpen
                ? "bg-white border-slate-100 shadow-[0_12px_30px_rgba(17,85,204,0.04)]"
                : "bg-transparent border-slate-100/60 hover:bg-slate-50/50"
            }`}
          >
            <button
              onClick={() => toggleFaq(index)}
              className="w-full flex items-center justify-between p-5 text-left font-bold text-gray-900 text-sm hover:text-[#1155CC] transition-colors focus:outline-none"
            >
              <span className="pr-4">{item.question}</span>
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                  isOpen ? "bg-[#1155CC] text-white" : "bg-slate-150/40 text-gray-500"
                }`}
              >
                <Icon
                  name="chevron"
                  className={`w-3.5 h-3.5 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
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
                  <div className="px-5 pb-5 pt-0.5 text-xs sm:text-sm text-gray-500 leading-relaxed border-t border-gray-100/50">
                    {item.directAnswer ? (
                      <div className="space-y-4 pt-4">
                        <div className="p-3.5 bg-blue-50/50 border-l-3 border-[#1155CC] rounded-r-xl">
                          <span className="text-[10px] font-black uppercase text-[#1155CC] tracking-wider block mb-1">
                            Direct Answer
                          </span>
                          <p className="text-gray-950 font-bold text-xs sm:text-sm leading-relaxed">
                            {item.directAnswer}
                          </p>
                        </div>
                        
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">
                            Technical Explanation & Integration
                          </span>
                          <p className="text-gray-500 leading-relaxed">
                            {item.expandedExplanation}
                          </p>
                        </div>

                        <div className="p-3.5 bg-green-50/40 border-l-3 border-green-500 rounded-r-xl space-y-1">
                          <span className="text-[10px] font-black uppercase text-green-700 tracking-wider block">
                            Business Benefits & ROI
                          </span>
                          <p className="text-green-800 font-semibold leading-relaxed">
                            {item.businessBenefits}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2">
                        {item.answer}
                      </div>
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
