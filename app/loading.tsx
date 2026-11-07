"use client";

import React from "react";
import { motion } from "motion/react";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/95 backdrop-blur-md">
      {/* Background soft glow rings */}
      <div className="pointer-events-none absolute h-[400px] w-[400px] rounded-full bg-[#1155CC]/5 blur-[80px]" />
      <div className="pointer-events-none absolute h-[300px] w-[300px] rounded-full bg-[#22B6F6]/5 blur-[60px]" />

      {/* Spinner & Core Animation */}
      <div className="relative flex h-24 w-24 items-center justify-center">
        {/* Pulsing outer circle */}
        <motion.div
          className="absolute inset-0 rounded-full border border-[#1155CC]/15"
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.3, 0, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Spin track ring */}
        <motion.div
          className="h-16 w-16 rounded-full border-[3px] border-slate-100 border-t-[#1155CC] border-r-[#1155CC]/40"
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Logo Text center */}
        <div className="absolute text-center">
          <span className="block font-sora text-xs font-black tracking-wider text-[#1155CC]">
            TS
          </span>
        </div>
      </div>

      {/* Loading subtext */}
      <motion.p
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 text-[11px] font-bold tracking-widest text-slate-400 uppercase"
      >
        Initializing Resonance
      </motion.p>
    </div>
  );
}
