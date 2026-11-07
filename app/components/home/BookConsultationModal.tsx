"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { trackBookingModalOpen } from "@/lib/analytics";

interface BookConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CAL_URL = "https://cal.id/techsonance-infotech/connect-with-founder?duration=15";

function BookConsultationDialog({ onClose }: { onClose: () => void }) {
  const [iframeLoading, setIframeLoading] = useState(true);

  return (
    <div
      data-lenis-prevent
      data-lenis-prevent-wheel
      data-lenis-prevent-touch
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-3 sm:p-6"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 15 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        data-lenis-prevent
        data-lenis-prevent-wheel
        data-lenis-prevent-touch
        className="relative z-10 flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl sm:h-[80vh] sm:rounded-3xl"
      >
        {/* Modal Header */}
        <div className="relative shrink-0 border-b border-slate-100 bg-gradient-to-br from-white to-slate-50/80 px-5 py-3 sm:px-8 sm:py-3.5">
          <button
            onClick={onClose}
            className="absolute top-2.5 right-4 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all hover:bg-slate-200 hover:text-slate-800 sm:top-3 sm:right-5 sm:h-8 sm:w-8"
            aria-label="Close modal"
          >
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex flex-col pr-8">
            <h2 className="text-sm leading-tight font-black text-[#0F172A] sm:text-base">
              Schedule Your <span className="text-[#1155CC]">Free Consultation</span>
            </h2>
            <p className="mt-1 text-[10px] leading-none font-medium text-slate-500 sm:text-xs">
              Pick a time that works for you - 15 min with our technical lead.
            </p>
          </div>
        </div>

        {/* Embedded Cal.id iframe with loading state */}
        <div className="relative flex-1 bg-[#FAFBFD]">
          {iframeLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#FAFBFD]">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1155CC] border-t-transparent" />
              <p className="animate-pulse text-xs font-medium text-slate-500">
                Loading calendar...
              </p>
            </div>
          )}
          <iframe
            src={CAL_URL}
            title="Book a consultation with TechSonance"
            className="h-full w-full border-0"
            allow="calendar; payment"
            onLoad={() => setIframeLoading(false)}
          />
        </div>
      </motion.div>
    </div>
  );
}

export default function BookConsultationModal({ isOpen, onClose }: BookConsultationModalProps) {
  // Lock body scroll and pause Lenis when modal is open
  useEffect(() => {
    if (isOpen) {
      trackBookingModalOpen("global_modal");
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      window.__lenis?.stop();
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      window.__lenis?.start();
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      window.__lenis?.start();
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>{isOpen && <BookConsultationDialog onClose={onClose} />}</AnimatePresence>
  );
}
