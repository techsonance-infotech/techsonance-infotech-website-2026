"use client";

import React from "react";
import { m } from "motion/react";

interface AboutHeroBackgroundProps {
  mounted: boolean;
  isMobile: boolean;
}

export function AboutHeroBackground({ mounted, isMobile }: AboutHeroBackgroundProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-0">
      {/* Base Premium Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#EFF5FA] via-[#F6FAFD] to-[#FAFBFD]" />

      {/* Glowing Drifting Blobs */}
      {mounted && !isMobile ? (
        <>
          <m.div
            animate={{
              x: [0, 40, -20, 0],
              y: [0, -30, 20, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -top-20 -left-20 h-[400px] w-[400px] rounded-full bg-blue-400/10 blur-[100px]"
          />
          <m.div
            animate={{
              x: [0, -50, 30, 0],
              y: [0, 40, -30, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-1/3 right-[-100px] h-[500px] w-[500px] rounded-full bg-cyan-300/10 blur-[120px]"
          />
        </>
      ) : (
        mounted && (
          <>
            <div className="absolute -top-10 -left-10 h-[200px] w-[200px] rounded-full bg-blue-400/10 blur-[60px]" />
            <div className="absolute top-1/3 right-[-50px] h-[250px] w-[250px] rounded-full bg-cyan-300/10 blur-[80px]" />
          </>
        )
      )}

      {/* Animated SVG Grid Lines & Light Beams */}
      <svg className="absolute inset-0 h-full w-full opacity-60" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grid-glow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1155CC" stopOpacity="0" />
            <stop offset="50%" stopColor="#1155CC" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#1155CC" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="grid-glow-cyan" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#22B6F6" stopOpacity="0" />
            <stop offset="50%" stopColor="#22B6F6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#22B6F6" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Horizontal Grid Lines */}
        <line x1="0" y1="15%" x2="100%" y2="15%" stroke="#E2E8F0" strokeWidth="1" />
        <line x1="0" y1="45%" x2="100%" y2="45%" stroke="#E2E8F0" strokeWidth="1" />
        <line x1="0" y1="75%" x2="100%" y2="75%" stroke="#E2E8F0" strokeWidth="1" />

        {/* Vertical Grid Lines */}
        <line x1="25%" y1="0" x2="25%" y2="100%" stroke="#E2E8F0" strokeWidth="1" />
        <line x1="55%" y1="0" x2="55%" y2="100%" stroke="#E2E8F0" strokeWidth="1" />
        <line x1="85%" y1="0" x2="85%" y2="100%" stroke="#E2E8F0" strokeWidth="1" />

        {/* Light trails animation */}
        {mounted && !isMobile && (
          <>
            <m.path
              d="M 0,45% L 100vw,45%"
              fill="none"
              stroke="url(#grid-glow)"
              strokeWidth="2"
              strokeDasharray="200 800"
              animate={{
                strokeDashoffset: [-1000, 1000],
              }}
              transition={{
                duration: 9,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            <m.path
              d="M 55%,0 L 55%,100vh"
              fill="none"
              stroke="url(#grid-glow-cyan)"
              strokeWidth="2"
              strokeDasharray="150 700"
              animate={{
                strokeDashoffset: [900, -900],
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </>
        )}
      </svg>
    </div>
  );
}
