"use client";
import { motion } from "motion/react";
import SafeImage from "@/app/components/SafeImage";

interface ProjectMockupProps {
  gradient: string;
  title: string;
  category: string;
  accentColor: string;
  /** Optional: path to real screenshot served from /public */
  screenshotPath?: string;
  priority?: boolean;
  liveUrl?: string;
  hideChrome?: boolean;
}

export function ProjectMockup({
  gradient,
  title,
  category,
  accentColor,
  screenshotPath,
  priority = false,
  liveUrl,
  hideChrome,
}: ProjectMockupProps) {
  const isMobile = hideChrome || category.toLowerCase().includes("mobile");

  return (
    <div className="relative w-full select-none">
      {/* Frame */}
      <div className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-2xl sm:rounded-3xl">
        {/* Title bar - only for web/desktop apps */}
        {!isMobile && (
          <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2.5">
            <span className="h-3 w-3 rounded-full bg-[#FF5F57]" />
            <span className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
            <span className="h-3 w-3 rounded-full bg-[#28C840]" />
            <div className="mx-3 flex-1 truncate rounded-md border border-gray-200 bg-white px-3 py-1 font-mono text-[10px] text-gray-400">
              {liveUrl
                ? new URL(liveUrl).hostname
                : `${title.toLowerCase().replace(/\s+/g, "-")}.techsonance.co.in`}
            </div>
          </div>
        )}

        {/* Screenshot or gradient placeholder */}
        {screenshotPath ? (
          /* Real screenshot */
          <div
            className={`relative w-full overflow-hidden ${
              isMobile ? "aspect-[16/11.5]" : "aspect-[16/10]"
            }`}
            style={{
              background: gradient,
            }}
          >
            <SafeImage
              src={screenshotPath}
              alt={`${title} - ${category} screenshot`}
              fill
              className={
                isMobile
                  ? "scale-[1.04] object-cover object-center transition-transform duration-500 hover:scale-[1.08]"
                  : "object-cover object-top"
              }
              sizes="(max-width: 768px) 100vw, 50vw"
              priority={priority}
            />
          </div>
        ) : (
          /* Gradient placeholder when no screenshot */
          <div
            className="relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden"
            style={{ background: gradient }}
          >
            {/* Glassmorphic UI preview rows */}
            <div className="absolute inset-4 grid grid-cols-3 gap-3 opacity-25">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl bg-white/20 backdrop-blur-sm"
                  style={{
                    height: i === 0 || i === 3 ? "100%" : "60%",
                    alignSelf: i % 2 ? "end" : "start",
                  }}
                />
              ))}
            </div>
            <div className="absolute top-4 bottom-4 left-4 flex w-14 flex-col items-center gap-3 rounded-xl bg-black/20 py-4 backdrop-blur-md">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-1.5 w-6 rounded-full bg-white/50" />
              ))}
            </div>
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-black text-white shadow-lg"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  backdropFilter: "blur(12px)",
                }}
              >
                {title.charAt(0)}
              </div>
              <div className="text-center">
                <div className="text-lg leading-tight font-bold text-white drop-shadow">
                  {title}
                </div>
                <div className="mt-1 text-xs text-white/70">{category}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Glow behind */}
      <div
        className="absolute -inset-6 -z-10 rounded-3xl opacity-15 blur-3xl"
        style={{ background: gradient }}
      />

      {/* Category pill floating */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="absolute -top-3 -right-3 rounded-full px-3 py-1.5 text-[10px] font-bold tracking-wider text-white uppercase shadow-lg"
        style={{ background: accentColor }}
      >
        {category}
      </motion.div>
    </div>
  );
}
