"use client";

import React, { useEffect, useState } from "react";
import { LazyMotion, domAnimation, m, AnimatePresence } from "motion/react";
import { trackBookingModalOpen } from "@/lib/analytics";

interface BookConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CAL_URL = "https://cal.id/techsonance-infotech/connect-with-founder?duration=15";

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const DATE_CELL_KEYS = [
  "c-1",
  "c-2",
  "c-3",
  "c-4",
  "c-5",
  "c-6",
  "c-7",
  "c-8",
  "c-9",
  "c-10",
  "c-11",
  "c-12",
  "c-13",
  "c-14",
  "c-15",
  "c-16",
  "c-17",
  "c-18",
  "c-19",
  "c-20",
  "c-21",
  "c-22",
  "c-23",
  "c-24",
  "c-25",
  "c-26",
  "c-27",
  "c-28",
  "c-29",
  "c-30",
  "c-31",
  "c-32",
  "c-33",
  "c-34",
  "c-35",
] as const;
const TIME_SLOT_KEYS = ["s-1", "s-2", "s-3", "s-4", "s-5", "s-6", "s-7", "s-8"] as const;

function CalendarSkeleton(): React.JSX.Element {
  return (
    <div
      aria-busy="true"
      aria-label="Loading booking calendar"
      className="absolute inset-0 z-10 flex flex-col overflow-y-auto bg-[#FAFBFD] p-3 sm:p-5"
    >
      <div className="mx-auto flex w-full max-w-[820px] animate-pulse flex-col gap-3 sm:gap-4">
        {/* Top bar controls */}
        <div className="flex items-center justify-between px-1">
          <div className="h-6 w-6 rounded-md bg-slate-200" />
          <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
            <div className="h-5 w-5 rounded bg-slate-200" />
            <div className="h-5 w-5 rounded bg-slate-200" />
            <div className="h-5 w-5 rounded bg-slate-200" />
          </div>
        </div>

        {/* Main card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:p-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-12 md:gap-6">
            {/* Left column: Host details */}
            <div className="flex flex-col gap-2.5 md:col-span-4 md:border-r md:border-slate-100 md:pr-5">
              <div className="h-9 w-9 rounded-lg bg-slate-200" />
              <div className="h-3 w-28 rounded bg-slate-200" />
              <div className="h-4.5 w-40 rounded bg-slate-300" />
              <div className="space-y-1 pt-1">
                <div className="h-2 w-full rounded bg-slate-200" />
                <div className="h-2 w-5/6 rounded bg-slate-200" />
                <div className="h-2 w-2/3 rounded bg-slate-200" />
              </div>
              <div className="flex gap-1.5 pt-1">
                <div className="h-5 w-11 rounded-full bg-slate-200" />
                <div className="h-5 w-11 rounded-full bg-slate-200" />
              </div>
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded bg-slate-200" />
                  <div className="h-2.5 w-20 rounded bg-slate-200" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded bg-slate-200" />
                  <div className="h-2.5 w-24 rounded bg-slate-200" />
                </div>
              </div>
            </div>

            {/* Middle column: Calendar month & dates */}
            <div className="flex flex-col md:col-span-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="h-3.5 w-24 rounded bg-slate-300" />
                <div className="flex gap-1.5">
                  <div className="h-4 w-4 rounded bg-slate-200" />
                  <div className="h-4 w-4 rounded bg-slate-200" />
                </div>
              </div>
              <div className="mb-2 grid grid-cols-7 gap-1 text-center">
                {DAY_KEYS.map((key) => (
                  <div key={key} className="mx-auto h-2 w-5 rounded bg-slate-200" />
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                {DATE_CELL_KEYS.map((key) => (
                  <div key={key} className="aspect-square rounded-md bg-slate-100" />
                ))}
              </div>
            </div>

            {/* Right column: Time slots (visible on md+) */}
            <div className="hidden flex-col gap-2 md:col-span-3 md:flex md:border-l md:border-slate-100 md:pl-5">
              <div className="mb-1.5 flex items-center justify-between">
                <div className="h-3 w-14 rounded bg-slate-200" />
                <div className="h-4 w-12 rounded bg-slate-200" />
              </div>
              <div className="flex flex-col gap-1.5">
                {TIME_SLOT_KEYS.map((key) => (
                  <div
                    key={key}
                    className="h-7 w-full rounded-md border border-slate-200/70 bg-slate-50"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer brand */}
        <div className="flex justify-center pb-1">
          <div className="h-2.5 w-24 rounded bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

function BookConsultationDialog({ onClose }: { onClose: () => void }): React.JSX.Element {
  const [iframeLoading, setIframeLoading] = useState(true);

  return (
    <div
      aria-modal="true"
      aria-labelledby="consultation-modal-title"
      data-lenis-prevent
      data-lenis-prevent-wheel
      data-lenis-prevent-touch
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-3 sm:p-6"
    >
      {/* Backdrop */}
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal panel */}
      <m.div
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
            <h2
              id="consultation-modal-title"
              className="text-sm leading-tight font-black text-[#0F172A] sm:text-base"
            >
              Schedule Your <span className="text-[#1155CC]">Free Consultation</span>
            </h2>
            <p className="mt-1 text-[10px] leading-none font-medium text-slate-500 sm:text-xs">
              Pick a time that works for you - 15 min with our technical lead.
            </p>
          </div>
        </div>

        {/* Embedded Cal.id iframe with layout-matching skeleton */}
        <div className="relative flex-1 bg-[#FAFBFD]">
          {iframeLoading && <CalendarSkeleton />}
          <iframe
            src={CAL_URL}
            title="Book a consultation with TechSonance"
            className="h-full w-full border-0"
            allow="calendar; payment"
            sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
            onLoad={() => setIframeLoading(false)}
          />
        </div>
      </m.div>
    </div>
  );
}

export default function BookConsultationModal({
  isOpen,
  onClose,
}: BookConsultationModalProps): React.JSX.Element {
  // Lock body scroll and pause Lenis when modal is open
  useEffect(() => {
    const win =
      typeof window !== "undefined"
        ? (window as unknown as Record<string, { stop: () => void; start: () => void }>)
        : null;
    if (isOpen) {
      trackBookingModalOpen("global_modal");
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      if (win && win["__lenis"]) {
        win["__lenis"].stop();
      }
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      if (win && win["__lenis"]) {
        win["__lenis"].start();
      }
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      if (win && win["__lenis"]) {
        win["__lenis"].start();
      }
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
    <LazyMotion features={domAnimation} strict>
      <AnimatePresence>{isOpen && <BookConsultationDialog onClose={onClose} />}</AnimatePresence>
    </LazyMotion>
  );
}
