"use client";
import { motion } from "framer-motion";
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
}

export function ProjectMockup({
  gradient,
  title,
  category,
  accentColor,
  screenshotPath,
  priority = false,
  liveUrl,
}: ProjectMockupProps) {
  return (
    <div className="relative w-full select-none">
      {/* Browser chrome frame */}
      <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-2xl bg-white">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
          <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
          <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
          <span className="w-3 h-3 rounded-full bg-[#28C840]" />
          <div className="flex-1 mx-3 bg-white rounded-md px-3 py-1 text-[10px] text-gray-400 font-mono border border-gray-200 truncate">
            {liveUrl ? new URL(liveUrl).hostname : `${title.toLowerCase().replace(/\s+/g, "-")}.techsonance.co.in`}
          </div>
        </div>

        {/* Screenshot or gradient placeholder */}
        {screenshotPath ? (
          /* Real screenshot - contain so the full image is always visible */
          <div
            className="relative w-full aspect-[16/10] overflow-hidden"
            style={{
              background: gradient,
            }}
          >
            <SafeImage
              src={screenshotPath}
              alt={`${title} - ${category} screenshot`}
              fill
              className="object-cover object-top"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority={priority}
            />
          </div>
        ) : (
          /* Gradient placeholder when no screenshot */
          <div
            className="w-full aspect-[16/10] relative overflow-hidden flex items-center justify-center"
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
            <div className="absolute left-4 top-4 bottom-4 w-14 rounded-xl bg-black/20 backdrop-blur-md flex flex-col items-center py-4 gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-6 h-1.5 bg-white/50 rounded-full" />
              ))}
            </div>
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-lg"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  backdropFilter: "blur(12px)",
                }}
              >
                {title.charAt(0)}
              </div>
              <div className="text-center">
                <div className="text-white font-bold text-lg leading-tight drop-shadow">
                  {title}
                </div>
                <div className="text-white/70 text-xs mt-1">{category}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Glow behind */}
      <div
        className="absolute -inset-6 -z-10 rounded-3xl blur-3xl opacity-15"
        style={{ background: gradient }}
      />

      {/* Category pill floating */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="absolute -top-3 -right-3 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-lg"
        style={{ background: accentColor }}
      >
        {category}
      </motion.div>
    </div>
  );
}
