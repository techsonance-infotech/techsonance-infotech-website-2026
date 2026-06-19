'use client';

import React, { useEffect, useState } from 'react';
import SafeImage from '@/app/components/SafeImage';
import { motion } from 'framer-motion';

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
  className = '',
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
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [radiusLg, radiusMd, radiusSm, cardSizeLg, cardSizeMd, cardSizeSm]);

  // Ensure at least 2 points to distribute angles for the arc calculation
  const count = Math.max(images.length, 2);
  const step = (endAngle - startAngle) / (count - 1);

  return (
    <section className={`relative overflow-hidden min-h-screen flex flex-col ${className}`}>
      {/* Unique Background Animated Light Trails & Ambient Morphs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Ambient morphs */}
        <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] bg-gradient-to-tr from-[#1155CC]/5 to-[#22B6F6]/5 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDuration: "8s" }} />
        <div className="absolute bottom-[10%] right-[-10%] w-[250px] h-[250px] sm:w-[600px] sm:h-[600px] bg-gradient-to-br from-[#22B6F6]/5 to-[#1155CC]/5 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: "12s", animationDelay: "3s" }} />

        {/* Intersecting sleek curves & moving light trails */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.06] text-[#1155CC] pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="hero-trail-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1155CC" stopOpacity="0" />
              <stop offset="50%" stopColor="#22B6F6" stopOpacity="1" />
              <stop offset="100%" stopColor="#1155CC" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Structural wire-mesh lines */}
          <path d="M-10 20 L110 60" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" fill="none" />
          <path d="M-10 50 C 30 30, 70 70, 110 40" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" fill="none" />
          <path d="M20 -10 L80 110" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" fill="none" />
          
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
          width: '100%',
          // Give it a bit more height to prevent clipping
          height: dimensions.radius * 1.25,
        }}
      >
        {/* Center pivot for transforms - positioned at bottom center */}
        <div className="absolute left-1/2 bottom-0 -translate-x-1/2">
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
                className="absolute opacity-0 animate-fade-in-up"
                style={{
                  width: `${dimensions.cardSize}px`,
                  height: `${dimensions.cardSize}px`,
                  left: `calc(50% + ${x.toFixed(3)}px)`,
                  bottom: `${y.toFixed(3)}px`,
                  transform: `translate(-50%, 50%)`,
                  animationDelay: `${i * 100}ms`,
                  animationFillMode: 'forwards',
                  zIndex: count - i,
                }}
              >
                <div 
                   className="rounded-2xl shadow-xl overflow-hidden ring-1 ring-gray-200 bg-white transition-transform hover:scale-105 w-full h-full"
                  style={{ transform: `rotate(${angle / 4}deg)` }}
                >
                   <SafeImage
                    src={src}
                    alt={`Memory ${i + 1}`}
                    width={400}
                    height={400}
                    className="block w-full h-full object-cover"
                    draggable={false}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Content positioned below the arc */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 -mt-16 sm:-mt-28 md:-mt-52 lg:-mt-64">
        {children ? children : (
          <div className="text-center max-w-2xl px-6 opacity-0 animate-fade-in" style={{ animationDelay: '800ms', animationFillMode: 'forwards' }}>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900">
              {title}
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              {description}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="w-full sm:w-auto px-6 py-3 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                {primaryButtonText}
              </button>
              <button className="w-full sm:w-auto px-6 py-3 rounded-full border border-gray-300 hover:bg-gray-100 transition-all duration-200">
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
