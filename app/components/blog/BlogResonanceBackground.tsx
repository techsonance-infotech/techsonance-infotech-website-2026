"use client";

import React from "react";
import { m } from "motion/react";

export function BlogResonanceBackground(): React.JSX.Element {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Mesh gradient */}
      <div className="absolute top-0 right-0 left-0 h-[600px] bg-linear-to-tr from-[#FAFBFD] via-[#EEF5FF] to-[#F5F9FF] opacity-90" />

      {/* Subtle diagonal grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(45deg, #1155cc 0.5px, transparent 0.5px), 
            linear-gradient(-45deg, #1155cc 0.5px, transparent 0.5px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Glowing neon ambient orbs */}
      <div
        className="absolute top-20 left-[10%] h-[350px] w-[350px] animate-pulse rounded-full bg-[#1155CC]/5 blur-[80px]"
        style={{ animationDuration: "10s" }}
      />
      <div
        className="absolute top-40 right-[15%] h-[400px] w-[400px] animate-pulse rounded-full bg-[#22B6F6]/5 blur-[100px]"
        style={{ animationDuration: "14s" }}
      />

      {/* SVG Resonance Waves - Unique Theme Background */}
      <svg
        className="absolute top-[10%] left-0 h-[300px] w-full text-[#1155CC] opacity-[0.06]"
        viewBox="0 0 1440 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <m.path
          d="M0 150 C300 280, 600 20, 900 280 C1200 140, 1350 20, 1440 150"
          stroke="currentColor"
          strokeWidth="2"
          animate={{
            d: [
              "M0 150 C300 280, 600 20, 900 280 C1200 140, 1350 20, 1440 150",
              "M0 150 C300 20, 600 280, 900 20 C1200 280, 1350 140, 1440 150",
              "M0 150 C300 280, 600 20, 900 280 C1200 140, 1350 20, 1440 150",
            ],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <m.path
          d="M0 150 C200 80, 500 220, 800 80 C1100 220, 1300 80, 1440 150"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          animate={{
            d: [
              "M0 150 C200 80, 500 220, 800 80 C1100 220, 1300 80, 1440 150",
              "M0 150 C200 220, 500 80, 800 220 C1100 80, 1300 220, 1440 150",
              "M0 150 C200 80, 500 220, 800 80 C1100 220, 1300 80, 1440 150",
            ],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>
    </div>
  );
}
