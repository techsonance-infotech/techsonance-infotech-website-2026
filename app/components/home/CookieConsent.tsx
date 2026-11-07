"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if consent has already been given
    const consent = localStorage.getItem("techsonance-cookie-consent");
    if (!consent) {
      // Show banner after 2.5 seconds delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("techsonance-cookie-consent", "accepted");
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("techsonance-cookie-consent", "declined");
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed right-0 bottom-0 left-0 z-50 w-full border-t border-slate-100 bg-white/95 text-slate-800 shadow-[0_-10px_40px_rgba(17,85,204,0.06)] backdrop-blur-md"
        >
          {/* Glowing brand gradient line on top */}
          <div className="h-[2px] w-full bg-gradient-to-r from-[#1155CC] via-[#22B6F6] to-[#00E5FF]" />

          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5 md:flex-row lg:px-8">
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
              {/* Shield Icon */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#1155CC]/10 bg-[#1155CC]/5 text-[#1155CC] shadow-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div className="space-y-1">
                <h3 className="font-sora text-xs font-medium tracking-tight text-slate-900 sm:text-sm">
                  Privacy & Cookies Preferences
                </h3>
                <p className="max-w-4xl text-xs leading-relaxed font-semibold text-slate-600">
                  We use cookies to optimize site navigation, analyze traffic, and support marketing
                  efforts. By continuing or clicking "Accept All", you agree to our{" "}
                  <Link href="/privacy-policy" className="font-bold text-[#1155CC] hover:underline">
                    Privacy Policy
                  </Link>{" "}
                  and{" "}
                  <Link href="/terms" className="font-bold text-[#1155CC] hover:underline">
                    Terms of Use
                  </Link>
                  .
                </p>
              </div>
            </div>

            <div className="flex w-full shrink-0 items-center justify-center gap-3 md:w-auto md:justify-end">
              <Button
                onClick={handleDecline}
                variant="secondary"
                size="sm"
                className="hover:border-slate-350 w-1/2 border-slate-200 text-slate-500 shadow-sm hover:bg-slate-50 hover:text-slate-800 sm:w-auto"
              >
                Decline
              </Button>
              <Button
                onClick={handleAccept}
                variant="primary"
                size="sm"
                className="w-1/2 sm:w-auto"
              >
                Accept All
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
