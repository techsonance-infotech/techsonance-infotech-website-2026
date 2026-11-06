"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

export default function LenisProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  useEffect(() => {
    // Disable smooth-scrolling entirely inside Admin Studio and CMS authoring pages.
    // Admin dashboards require native, unhindered scrolling for dense forms, nested panels, and dropdowns.
    if (isAdmin) {
      if (typeof window !== "undefined") {
        if (window.__lenis) {
          window.__lenis.destroy();
          delete window.__lenis;
        }
        document.documentElement.classList.remove(
          "lenis",
          "lenis-smooth",
          "lenis-stopped",
          "lenis-scrolling",
        );
        document.body.classList.remove(
          "lenis",
          "lenis-smooth",
          "lenis-stopped",
          "lenis-scrolling",
        );
      }
      return;
    }

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      prevent: (node) => {
        return (
          node.hasAttribute("data-lenis-prevent") || Boolean(node.closest?.("[data-lenis-prevent]"))
        );
      },
    });

    window.__lenis = lenis;

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
      if (window.__lenis === lenis) {
        delete window.__lenis;
      }
      lenis.destroy();
    };
  }, [isAdmin]);

  return <>{children}</>;
}
