"use client";

import React, { useRef, useState } from "react";
import { m } from "motion/react";
import { Button } from "@/components/ui/button";

interface MagneticButtonProps {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

function MagneticButton({ href, onClick, children, className = "" }: MagneticButtonProps) {
  const btnRef = useRef<HTMLElement>(null);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!btnRef.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = btnRef.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const distanceX = clientX - centerX;
    const distanceY = clientY - centerY;

    setX(distanceX * 0.35);
    setY(distanceY * 0.35);
  };

  const handleMouseLeave = () => {
    setX(0);
    setY(0);
  };

  if (onClick) {
    return (
      <m.button
        ref={btnRef as React.RefObject<HTMLButtonElement>}
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        animate={{ x, y }}
        transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
        className={`inline-block cursor-pointer ${className}`}
      >
        {children}
      </m.button>
    );
  }

  return (
    <m.a
      ref={btnRef as React.RefObject<HTMLAnchorElement>}
      href={href}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x, y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      className={`inline-block ${className}`}
    >
      {children}
    </m.a>
  );
}

interface AboutCtaSectionProps {
  onBookCall: () => void;
}

export function AboutCtaSection({ onBookCall }: AboutCtaSectionProps) {
  return (
    <section className="relative overflow-hidden border-t border-slate-900 bg-[#050B14] py-28 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:40px_40px]" />

      {/* Glowing background gradient mesh */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[300px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-[#1155CC]/20 to-[#22B6F6]/15 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
        <m.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="mx-auto mb-6 max-w-2xl text-3xl leading-tight font-medium tracking-tight text-white sm:text-4xl lg:text-5xl">
            Ready to Build Something That Moves Your Business Forward?
          </h2>
          <p className="mx-auto mb-10 max-w-xl text-xs leading-relaxed text-slate-400 sm:text-sm">
            From custom database engineering to intelligent workflow automation, we take ownership
            of backend complexity so you can focus on business growth.
          </p>

          <MagneticButton onClick={onBookCall}>
            <Button
              variant="secondary"
              className="border-transparent bg-white text-[#1155CC] shadow-lg hover:border-transparent hover:bg-slate-50 hover:text-[#1155CC] hover:shadow-xl focus:ring-white/20"
            >
              Book a Strategy Call
            </Button>
          </MagneticButton>
        </m.div>
      </div>
    </section>
  );
}
