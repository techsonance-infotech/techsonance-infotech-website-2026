"use client";

import React, { useEffect, useState } from "react";
import SafeImage from "@/app/components/SafeImage";
import { motion } from "motion/react";

// --- The ArcGalleryHero Component ---
type ArcGalleryHeroProps = {
  images: string[];
  startAngle?: number;
  endAngle?: number;
  // radius for different screen sizes
  radiusLg?: number;
  radiusMd?: number;
  radiusSm?: number;
  // size of each card for different screen sizes
  cardSizeLg?: number;
  cardSizeMd?: number;
  cardSizeSm?: number;
  // optional extra class on outer section
  className?: string;
  title?: string;
  description?: string;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  children?: React.ReactNode;
};

export const ArcGalleryHero: React.FC<ArcGalleryHeroProps> = ({
  images,
  startAngle = 20,
  endAngle = 160,
  radiusLg = 480,
  radiusMd = 360,
  radiusSm = 260,
  cardSizeLg = 120,
  cardSizeMd = 100,
  cardSizeSm = 80,
  className = "",
  title = "Rediscover Your Memories with AI",
  description = "Our intelligent platform finds, organizes, and brings your most cherished moments back to life.",
  primaryButtonText = "Explore Your Past",
  secondaryButtonText = "How It Works",
  children,
}) => {
  const [dimensions, setDimensions] = useState({
    radius: radiusLg,
    cardSize: cardSizeLg,
  });

  // Effect to handle responsive resizing of the arc and cards
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        // Dynamically scale radius and card size on mobile to prevent overflow
        const dynamicRadius = Math.max(120, Math.min(radiusSm, width * 0.42));
        const dynamicCardSize = Math.max(50, Math.min(cardSizeSm, width * 0.22));
        setDimensions({ radius: dynamicRadius, cardSize: dynamicCardSize });
      } else if (width < 1024) {
        setDimensions({ radius: radiusMd, cardSize: cardSizeMd });
      } else {
        setDimensions({ radius: radiusLg, cardSize: cardSizeLg });
      }
    };

    handleResize(); // Set initial size
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [radiusLg, radiusMd, radiusSm, cardSizeLg, cardSizeMd, cardSizeSm]);

  // Ensure at least 2 points to distribute angles for the arc calculation
  const count = Math.max(images.length, 2);
  const step = (endAngle - startAngle) / (count - 1);

  return (
    <section className={`relative flex min-h-screen flex-col overflow-hidden ${className}`}>
      {/* Unique Background Animated Light Trails & Ambient Morphs */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {/* Ambient morphs */}
        <div
          className="pointer-events-none absolute top-[-10%] left-[-10%] h-[300px] w-[300px] animate-pulse rounded-full bg-gradient-to-tr from-[#1155CC]/5 to-[#22B6F6]/5 blur-[100px] sm:h-[600px] sm:w-[600px]"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="pointer-events-none absolute right-[-10%] bottom-[10%] h-[250px] w-[250px] animate-pulse rounded-full bg-gradient-to-br from-[#22B6F6]/5 to-[#1155CC]/5 blur-[120px] sm:h-[600px] sm:w-[600px]"
          style={{ animationDuration: "12s", animationDelay: "3s" }}
        />

        {/* Intersecting sleek curves & moving light trails */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full text-[#1155CC] opacity-[0.06]"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="hero-trail-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1155CC" stopOpacity="0" />
              <stop offset="50%" stopColor="#22B6F6" stopOpacity="1" />
              <stop offset="100%" stopColor="#1155CC" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Structural wire-mesh lines */}
          <path
            d="M-10 20 L110 60"
            stroke="currentColor"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            fill="none"
          />
          <path
            d="M-10 50 C 30 30, 70 70, 110 40"
            stroke="currentColor"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            fill="none"
          />
          <path
            d="M20 -10 L80 110"
            stroke="currentColor"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            fill="none"
          />

          {/* Animating light streaks along these paths */}
          <motion.path
            d="M-10 20 L110 60"
            stroke="url(#hero-trail-grad)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
            fill="none"
            initial={{ strokeDasharray: "15 100", strokeDashoffset: 0 }}
            animate={{ strokeDashoffset: -115 }}
            transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
          />

          <motion.path
            d="M-10 50 C 30 30, 70 70, 110 40"
            stroke="url(#hero-trail-grad)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
            fill="none"
            initial={{ strokeDasharray: "15 100", strokeDashoffset: 0 }}
            animate={{ strokeDashoffset: -115 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear", delay: 1.5 }}
          />

          <motion.path
            d="M20 -10 L80 110"
            stroke="url(#hero-trail-grad)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
            fill="none"
            initial={{ strokeDasharray: "15 100", strokeDashoffset: 0 }}
            animate={{ strokeDashoffset: -115 }}
            transition={{ duration: 7, repeat: Infinity, ease: "linear", delay: 3 }}
          />
        </svg>
      </div>

      {/* Background ring container that controls geometry */}
      <div
        className="relative mx-auto"
        style={{
          width: "100%",
          // Give it a bit more height to prevent clipping
          height: dimensions.radius * 1.25,
        }}
      >
        {/* Center pivot for transforms - positioned at bottom center */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
          {/* Each image is positioned on the circle and rotated to face outward */}
          {images.map((src, i) => {
            const angle = startAngle + step * i; // degrees
            const angleRad = (angle * Math.PI) / 180;

            // Calculate x and y positions on the arc
            const x = Math.cos(angleRad) * dimensions.radius;
            const y = Math.sin(angleRad) * dimensions.radius;

            return (
              <div
                key={i}
                className="animate-fade-in-up absolute opacity-0"
                style={{
                  width: `${dimensions.cardSize}px`,
                  height: `${dimensions.cardSize}px`,
                  left: `calc(50% + ${x.toFixed(3)}px)`,
                  bottom: `${y.toFixed(3)}px`,
                  transform: `translate(-50%, 50%)`,
                  animationDelay: `${i * 100}ms`,
                  animationFillMode: "forwards",
                  zIndex: count - i,
                }}
              >
                <div
                  className="h-full w-full overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-gray-200 transition-transform hover:scale-105"
                  style={{ transform: `rotate(${angle / 4}deg)` }}
                >
                  <SafeImage
                    src={src}
                    alt={`Memory ${i + 1}`}
                    width={400}
                    height={400}
                    className="block h-full w-full object-cover"
                    draggable={false}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Content positioned below the arc */}
      <div className="relative z-10 -mt-16 flex flex-1 items-center justify-center px-6 sm:-mt-28 md:-mt-52 lg:-mt-64">
        {children ? (
          children
        ) : (
          <div
            className="animate-fade-in max-w-2xl px-6 text-center opacity-0"
            style={{ animationDelay: "800ms", animationFillMode: "forwards" }}
          >
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            <p className="mt-4 text-lg text-gray-600">{description}</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button className="w-full transform rounded-full bg-indigo-600 px-6 py-3 text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-xl sm:w-auto">
                {primaryButtonText}
              </button>
              <button className="w-full rounded-full border border-gray-300 px-6 py-3 transition-all duration-200 hover:bg-gray-100 sm:w-auto">
                {secondaryButtonText}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translate(-50%, 60%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 50%);
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation-name: fade-in-up;
          animation-duration: 0.8s;
          animation-timing-function: ease-out;
        }
        .animate-fade-in {
          animation-name: fade-in;
          animation-duration: 0.8s;
          animation-timing-function: ease-out;
        }
      `}</style>
    </section>
  );
};
