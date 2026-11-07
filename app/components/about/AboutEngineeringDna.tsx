"use client";

import React, { useRef, useState } from "react";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
}

function TiltCard({ children, className = "" }: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glowStyle, setGlowStyle] = useState<React.CSSProperties>({});

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const rX = ((mouseY - height / 2) / (height / 2)) * -12;
    const rY = ((mouseX - width / 2) / (width / 2)) * 12;

    setRotateX(rX);
    setRotateY(rY);
    setGlowStyle({
      background: `radial-gradient(circle 220px at ${mouseX}px ${mouseY}px, rgba(17, 85, 204, 0.12), transparent)`,
    });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlowStyle({});
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative cursor-pointer overflow-hidden transition-all duration-200 ease-out select-none ${className}`}
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transformStyle: "preserve-3d",
      }}
    >
      <div className="pointer-events-none absolute inset-0" style={glowStyle} />
      <div style={{ transform: "translateZ(30px)" }}>{children}</div>
    </div>
  );
}

const DNA_ITEMS = [
  {
    title: "Architecture First",
    desc: "We design highly-decoupled, modular microservices and state architectures from day one. Zero architectural shortcuts.",
    icon: "schema",
  },
  {
    title: "Automation by Default",
    desc: "Every build, pipeline, deployment, and testing run is automated. Humans think; machines compile and deliver.",
    icon: "auto",
  },
  {
    title: "Performance Obsessed",
    desc: "We track load bounds, query times, and bundle weights to guarantee sub-100ms API responses and stellar Lighthouse scores.",
    icon: "speed",
  },
  {
    title: "Production Ready",
    desc: "Type-safety, row-level security audits, integration monitors, and continuous automated backup verification are non-negotiable.",
    icon: "shield",
  },
];

export function AboutEngineeringDna() {
  return (
    <section className="relative border-b border-slate-100 bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-3 text-xs font-bold tracking-widest text-[#1155CC] uppercase">
            Our Principles
          </h2>
          <h3 className="text-3xl font-medium tracking-tight text-gray-900 sm:text-4xl">
            Our Engineering DNA
          </h3>
          <p className="mt-3 text-sm font-medium text-slate-500">
            We replace standard vision cards with execution directives that actually shape the code
            we ship.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {DNA_ITEMS.map((dna) => (
            <TiltCard
              key={dna.title}
              className="rounded-3xl border border-slate-100 bg-[#FAFBFD] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.015)] transition-colors hover:border-blue-100"
            >
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-100 bg-white text-[#1155CC] shadow-sm">
                {dna.icon === "schema" && (
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M18 18.75a2.25 2.25 0 002.25-2.25V5.25A2.25 2.25 0 0018 3H6A2.25 2.25 0 003.75 5.25V16.5A2.25 2.25 0 006 18.75h12zm0 0v1.5a2.25 2.25 0 01-2.25 2.25H8.25A2.25 2.25 0 016 20.25v-1.5m12 0h-12"
                    />
                  </svg>
                )}
                {dna.icon === "auto" && (
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                    />
                  </svg>
                )}
                {dna.icon === "speed" && (
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
                {dna.icon === "shield" && (
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                    />
                  </svg>
                )}
              </div>
              <h4 className="mb-3 text-lg font-bold text-gray-900">{dna.title}</h4>
              <p className="text-xs leading-relaxed font-medium text-slate-500">{dna.desc}</p>
            </TiltCard>
          ))}
        </div>
      </div>
    </section>
  );
}
