"use client";
import { useEffect } from "react";
import Lenis from "lenis";

export default function LenisProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
    });

    let gsapTicker: ((time: number) => void) | null = null;
    let destroyed = false;

    async function setupScrollTrigger() {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (destroyed) return;

      gsap.registerPlugin(ScrollTrigger);
      lenis.on("scroll", ScrollTrigger.update);

      gsapTicker = (time: number) => {
        lenis.raf(time * 1000);
      };
      gsap.ticker.add(gsapTicker);
      gsap.ticker.lagSmoothing(0);
    }

    setupScrollTrigger();

    return () => {
      destroyed = true;
      if (gsapTicker) {
        import("gsap").then(({ gsap }) => {
          gsap.ticker.remove(gsapTicker!);
        });
      }
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
