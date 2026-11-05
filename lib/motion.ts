"use client";

export * from "@/lib/gsap-utils";

export const EASING = {
  spring: [0.16, 1, 0.3, 1],
  smooth: [0.25, 0.1, 0.25, 1],
  outExpo: [0.19, 1, 0.22, 1],
} as const;

export const DURATIONS = {
  fast: 0.15,
  base: 0.26,
  slow: 0.5,
} as const;
