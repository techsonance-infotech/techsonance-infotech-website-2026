"use client";

import React from "react";
import { motion } from "framer-motion";

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-white/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center">
      {/* Background soft glow rings */}
      <div className="absolute w-[400px] h-[400px] bg-[#1155CC]/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute w-[300px] h-[300px] bg-[#22B6F6]/5 rounded-full blur-[60px] pointer-events-none" />

      {/* Spinner & Core Animation */}
      <div className="relative flex items-center justify-center w-24 h-24">
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
          className="w-16 h-16 rounded-full border-[3px] border-slate-100 border-t-[#1155CC] border-r-[#1155CC]/40"
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Logo Text center */}
        <div className="absolute text-center">
          <span className="text-xs font-black tracking-wider text-[#1155CC] font-sora block">TS</span>
        </div>
      </div>

      {/* Loading subtext */}
      <motion.p
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-6"
      >
        Initializing Resonance
      </motion.p>
    </div>
  );
}
