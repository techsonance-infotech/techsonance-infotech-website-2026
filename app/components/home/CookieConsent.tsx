"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

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
          className="fixed bottom-0 left-0 right-0 w-full z-50 border-t border-slate-100 bg-white/95 backdrop-blur-md text-slate-800 shadow-[0_-10px_40px_rgba(17,85,204,0.06)]"
        >
          {/* Glowing brand gradient line on top */}
          <div className="h-[2px] w-full bg-gradient-to-r from-[#1155CC] via-[#22B6F6] to-[#00E5FF]" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start text-center sm:text-left">
              {/* Shield Icon */}
              <div className="w-10 h-10 rounded-xl bg-[#1155CC]/5 text-[#1155CC] flex items-center justify-center shrink-0 border border-[#1155CC]/10 shadow-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
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
                <h3 className="text-xs sm:text-sm font-extrabold tracking-tight font-sora text-slate-900">
                  Privacy & Cookies Preferences
                </h3>
                <p className="text-xs font-semibold text-slate-600 leading-relaxed max-w-4xl">
                  We use cookies to optimize site navigation, analyze traffic, and support marketing efforts. By continuing or clicking "Accept All", you agree to our{" "}
                  <Link href="/privacy-policy" className="text-[#1155CC] hover:underline font-bold">
                    Privacy Policy
                  </Link>{" "}
                  and{" "}
                  <Link href="/terms" className="text-[#1155CC] hover:underline font-bold">
                    Terms of Use
                  </Link>
                  .
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-center md:justify-end">
              <button
                onClick={handleDecline}
                className="px-4 py-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100 text-slate-500 hover:text-slate-800 font-bold rounded-xl text-xs transition-all w-1/2 sm:w-auto text-center"
              >
                Decline
              </button>
              <button
                onClick={handleAccept}
                className="px-6 py-2.5 bg-gradient-to-r from-[#1155CC] to-[#22B6F6] hover:brightness-110 active:scale-[0.98] text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-[#1155CC]/25 w-1/2 sm:w-auto text-center"
              >
                Accept All
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
