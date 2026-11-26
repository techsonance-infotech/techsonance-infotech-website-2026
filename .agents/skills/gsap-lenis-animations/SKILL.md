---
name: gsap-lenis-animations
description: "Best practices and memory leak prevention for GSAP ScrollTrigger, Lenis smooth scrolling, and Framer Motion in React 19 / Next.js client components."
---

# GSAP & Lenis Smooth Scrolling Runbook

Use this skill when implementing, refactoring, or debugging animations, scroll triggers, hero sequences, or card reveals across TechSonance pages.

## Architecture

- Client-only helper utilities are located in `lib/gsap-utils.ts`.
- Smooth scrolling is managed via Lenis and synced with GSAP's `ScrollTrigger.update`.

## Implementation Rules

1. **Strict Context Cleanup (`gsap.context`)**:
   - Always wrap GSAP timeline and ScrollTrigger creation in `gsap.context()` inside a `useEffect` and return `ctx.revert()` in the cleanup function:
     ```ts
     useEffect(() => {
       const ctx = gsap.context(() => {
         // animations here
       }, containerRef);
       return () => ctx.revert();
     }, []);
     ```
   - This prevents duplicate ScrollTrigger instances, ghost pins, and memory leaks during React 19 fast refresh / component unmounting.

2. **Dynamic Imports**:
   - For SSR compatibility in Next.js, import GSAP and ScrollTrigger dynamically or within `"use client"` files only.

3. **Lenis Integration**:
   - Ensure `lenis.on('scroll', ScrollTrigger.update)` is active.
   - Use `gsap.ticker.add((time) => lenis.raf(time * 1000))` for frame rate alignment and `gsap.ticker.lagSmoothing(0)` to prevent stutter during rapid scrolling.

4. **Reduced Motion**:
   - Always honor `window.matchMedia('(prefers-reduced-motion: reduce)')`. Disable aggressive parallax or transforms when users request reduced motion.
