"use client";

import React, { useState } from "react";
import { Icon } from "@/app/components/icons/Icon";
import { motion, AnimatePresence } from "framer-motion";
import type { FAQ } from "@/lib/services-data";

interface ServiceFaqProps {
  faq: FAQ[];
}

export default function ServiceFaq({ faq }: ServiceFaqProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="max-w-[720px] mx-auto">
      {faq.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={index} className="border-b border-[var(--border)]">
            <button
              onClick={() => toggleFaq(index)}
              className="w-full flex items-center justify-between py-5 text-left font-semibold text-[var(--text-primary)] text-[15px] hover:text-[var(--accent-blue)] transition-colors focus:outline-none"
            >
              <span className="pr-4">{item.question}</span>
              <Icon
                name="chevron"
                className={`w-4 h-4 shrink-0 text-[var(--text-muted)] transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="pb-5 text-[15px] text-[var(--text-secondary)] leading-relaxed">
                    {item.answer}
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
