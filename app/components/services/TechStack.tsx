"use client";

import { useRef, useEffect } from "react";
import type { Service } from "@/lib/services-data";

interface TechStackProps {
  service: Service;
}

/* ── Map tech names → icon paths & brand colors ──────────────────────────── */
const TECH_ICON_MAP: Record<string, { src: string; color: string }> = {
  "React": { src: "/tech-icons/react.svg", color: "#61DAFB" },
  "Next.js": { src: "/tech-icons/nextjs.svg", color: "#000000" },
  "TypeScript": { src: "/tech-icons/typescript.svg", color: "#3178C6" },
  "Node.js": { src: "/tech-icons/nodejs.svg", color: "#339933" },
  "NestJS": { src: "/tech-icons/nestjs.svg", color: "#E0234E" },
  "Express": { src: "/tech-icons/express.svg", color: "#353535" },
  "PostgreSQL": { src: "/tech-icons/postgresql.svg", color: "#4169E1" },
  "MongoDB": { src: "/tech-icons/mongodb.svg", color: "#47A248" },
  "Redis": { src: "/tech-icons/redis.svg", color: "#DC382D" },
  "Tailwind CSS": { src: "/tech-icons/tailwind.svg", color: "#38BDF8" },
  "Python": { src: "/tech-icons/python.svg", color: "#3776AB" },
  "Docker": { src: "/tech-icons/docker.svg", color: "#2496ED" },
  "AWS": { src: "/tech-icons/aws.svg", color: "#FF9900" },
  "Vercel": { src: "/tech-icons/vercel.svg", color: "#000000" },
  "Firebase": { src: "/tech-icons/firebase.svg", color: "#FFCA28" },
  "Supabase": { src: "/tech-icons/supabase.svg", color: "#3ECF8E" },
  "GraphQL": { src: "/tech-icons/graphql.svg", color: "#E10098" },
  "Prisma": { src: "/tech-icons/prisma.svg", color: "#1B223C" },
  "Redux Toolkit": { src: "/tech-icons/redux.svg", color: "#764ABC" },
  "Nginx": { src: "/tech-icons/nginx.svg", color: "#009639" },
  "GitHub Actions": { src: "/tech-icons/githubactions.svg", color: "#2088FF" },
  "Kubernetes": { src: "/tech-icons/kubernetes.svg", color: "#326CE5" },
  "Cloudflare": { src: "/tech-icons/cloudflare.svg", color: "#F38020" },
  "OpenAI GPT-4": { src: "/tech-icons/openai.svg", color: "#412991" },
  "Claude 3": { src: "/tech-icons/claude.svg", color: "#D97757" },
  "LangChain": { src: "/tech-icons/langchain.svg", color: "#000000" },
  "Sentry": { src: "/tech-icons/sentry.svg", color: "#362D59" },
  "Grafana": { src: "/tech-icons/grafana.svg", color: "#F46800" },
  "Prometheus": { src: "/tech-icons/prometheus.svg", color: "#E6522C" },
  ".NET": { src: "/tech-icons/dotnet.svg", color: "#512BD4" },
  "MySQL": { src: "/tech-icons/mysql.svg", color: "#4479A1" },
  "Google Cloud": { src: "/tech-icons/googlecloud.svg", color: "#4285F4" },
  "Azure": { src: "/tech-icons/azure.svg", color: "#0078D4" },
  "React Native": { src: "/tech-icons/react.svg", color: "#61DAFB" },
  "Flutter": { src: "/tech-icons/flutter.svg", color: "#02569B" },
  "iOS Native (Swift)": { src: "/tech-icons/swift.svg", color: "#F05138" },
  "Android Native (Kotlin)": { src: "/tech-icons/kotlin.svg", color: "#7F52FF" },
  "Expo Updates": { src: "/tech-icons/expo.svg", color: "#000020" },
  "CodePush": { src: "/tech-icons/appcenter.svg", color: "#CB2E6D" },
  "EAS / Fastlane": { src: "/tech-icons/expo.svg", color: "#000020" },
  "Expo": { src: "/tech-icons/expo.svg", color: "#000020" },
  "Node.js (NestJS)": { src: "/tech-icons/nestjs.svg", color: "#E0234E" },
  "Supabase / Firebase": { src: "/tech-icons/supabase.svg", color: "#3ECF8E" },
  "GraphQL (Apollo)": { src: "/tech-icons/graphql.svg", color: "#E10098" },
  "SQLite": { src: "/tech-icons/sqlite.svg", color: "#003B57" },
  "Realm": { src: "/tech-icons/realm.svg", color: "#39477F" },
  "Framer Motion": { src: "/tech-icons/react.svg", color: "#0055FF" },
  "Zustand": { src: "/tech-icons/react.svg", color: "#764ABC" },
  "React Query": { src: "/tech-icons/react.svg", color: "#FF4154" },
  "Razorpay": { src: "/tech-icons/react.svg", color: "#0C68FF" },
  "Turborepo": { src: "/tech-icons/vercel.svg", color: "#EF4444" },
  "Tesseract OCR": { src: "/tech-icons/python.svg", color: "#3776AB" },
  "PostgreSQL pgvector": { src: "/tech-icons/postgresql.svg", color: "#4169E1" },
  "AWS Lambda": { src: "/tech-icons/aws.svg", color: "#FF9900" },
  "Terraform": { src: "/tech-icons/docker.svg", color: "#7B42BC" },
  "React Native Camera": { src: "/tech-icons/react.svg", color: "#61DAFB" },
  "React Native Maps": { src: "/tech-icons/react.svg", color: "#61DAFB" },
  "Push Notifications": { src: "/tech-icons/firebase.svg", color: "#FFCA28" },
};

/* ── Category icon SVG paths ─────────────────────────────────────────────── */
const CATEGORY_ICONS: Record<string, { svg: string; color: string }> = {
  "Frontend": { svg: `<path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H4v-4h11v4zm0-5H4V9h11v4zm5 5h-4V9h4v9z"/>`, color: "#61DAFB" },
  "Backend": { svg: `<rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>`, color: "#339933" },
  "Database": { svg: `<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>`, color: "#4169E1" },
  "Frameworks": { svg: `<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>`, color: "#3178C6" },
  "Styling": { svg: `<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>`, color: "#38BDF8" },
  "State & Data": { svg: `<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>`, color: "#764ABC" },
  "Infrastructure": { svg: `<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>`, color: "#FF9900" },
  "AI Models": { svg: `<circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>`, color: "#412991" },
  "Cloud Providers": { svg: `<path d="M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z"/>`, color: "#FF9900" },
  "Containers": { svg: `<rect x="2" y="2" width="9" height="9" rx="1"/><rect x="13" y="2" width="9" height="9" rx="1"/><rect x="2" y="13" width="9" height="9" rx="1"/><rect x="13" y="13" width="9" height="9" rx="1"/>`, color: "#2496ED" },
  "Monitoring": { svg: `<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>`, color: "#F46800" },
  "Protocols": { svg: `<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>`, color: "#3178C6" },
  "Messaging": { svg: `<path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>`, color: "#DC382D" },
  "Gateways": { svg: `<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>`, color: "#009639" },
  "Native Features": { svg: `<rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>`, color: "#61DAFB" },
  "Mobile Frameworks": { svg: `<rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>`, color: "#61DAFB" },
  "OTA & Distribution": { svg: `<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>`, color: "#02569B" },
  "Backend & Services": { svg: `<rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>`, color: "#339933" },
  "Databases & Sync": { svg: `<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>`, color: "#4169E1" },
};

function getCategoryIcon(category: string) {
  return CATEGORY_ICONS[category] || { svg: `<circle cx="12" cy="12" r="10"/>`, color: "#1155CC" };
}

/* ── Marquee: infinite horizontal scroll ─────────────────────────────────── */
function MarqueeTrack({
  items,
  speed = 28,
  reverse = false,
}: {
  items: { name: string; color: string }[];
  speed?: number;
  reverse?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const totalWidth = track.scrollWidth / 2;
    let pos = reverse ? -totalWidth : 0;
    let rafId: number;

    const step = () => {
      if (reverse) {
        pos += speed / 60;
        if (pos >= 0) pos = -totalWidth;
      } else {
        pos -= speed / 60;
        if (pos <= -totalWidth) pos = 0;
      }
      track.style.transform = `translate3d(${pos}px, 0, 0)`;
      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [speed, reverse]);

  const renderChip = (item: { name: string; color: string }, i: number) => {
    const iconInfo = TECH_ICON_MAP[item.name];
    return (
      <div
        key={i}
        className="flex items-center gap-2.5 px-4 py-2.5 bg-white border border-gray-100 rounded-full shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(17,85,204,0.10)] hover:border-blue-200/60 transition-all duration-300 cursor-default shrink-0 group"
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
          style={{ backgroundColor: (iconInfo?.color || item.color) + "14" }}
        >
          {iconInfo ? (
            <img
              src={iconInfo.src}
              alt={item.name}
              width={16}
              height={16}
              className="w-4 h-4 object-contain"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          ) : (
            <span className="text-[9px] font-bold" style={{ color: item.color }}>
              {item.name.charAt(0)}
            </span>
          )}
        </div>
        <span className="text-[12px] font-semibold text-gray-600 group-hover:text-[#1155CC] transition-colors whitespace-nowrap">
          {item.name}
        </span>
      </div>
    );
  };

  return (
    <div className="overflow-hidden flex-1 min-w-0 [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]">
      <div ref={trackRef} className="flex gap-3 will-change-transform" style={{ width: "max-content" }}>
        {items.map((item, i) => renderChip(item, i))}
        {items.map((item, i) => renderChip(item, i + items.length))}
      </div>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────────────────── */
export default function TechStack({ service }: TechStackProps) {
  return (
    <section className="service-section bg-white py-20 md:py-24 overflow-hidden">
      <div className="service-container">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 mb-5">
            <div className="h-px w-8 bg-[#1155CC]/40" />
            <span className="text-xs font-medium text-[#1155CC] tracking-[0.15em] uppercase">
              Infrastructure &amp; Technologies
            </span>
            <div className="h-px w-8 bg-[#1155CC]/40" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-medium text-gray-900 leading-tight mb-4 tracking-tight">
            Technology Stack
          </h2>
          <p className="text-[15px] text-gray-500 leading-relaxed max-w-xl mx-auto">
            Enterprise-grade tools and frameworks we use to build, deploy, and scale your {service.name.toLowerCase()} solutions.
          </p>
        </div>

        {/* Compact rows: label left | marquee right */}
        <div className="rounded-2xl border border-gray-100 bg-[#FAFBFD] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
          {service.techStack.map((group, gi) => {
            const catIcon = getCategoryIcon(group.category);
            const marqueeItems = group.items.map((item) => ({
              name: item.name,
              color: TECH_ICON_MAP[item.name]?.color || catIcon.color,
            }));

            return (
              <div
                key={gi}
                className={`flex flex-col md:flex-row md:items-center gap-0 ${gi !== service.techStack.length - 1 ? "border-b border-gray-100" : ""}`}
              >
                {/* Left: Category label */}
                <div className="md:w-[200px] lg:w-[240px] shrink-0 flex items-center gap-3 px-4 md:px-5 py-3 md:py-6 md:border-r border-b md:border-b-0 border-gray-100 bg-white">
                  <div
                    className="w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: catIcon.color + "14" }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={catIcon.color}
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3.5 w-3.5 md:h-4 md:w-4"
                      dangerouslySetInnerHTML={{ __html: catIcon.svg }}
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[10px] md:text-[11px] font-medium text-gray-800 uppercase tracking-[0.08em] leading-tight truncate">
                      {group.category}
                    </h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {group.items.length} {group.items.length === 1 ? "tech" : "technologies"}
                    </p>
                  </div>
                </div>

                {/* Right: Marquee */}
                <div className="flex-1 min-w-0 py-3 md:py-4 px-2">
                  <MarqueeTrack
                    items={marqueeItems}
                    speed={gi % 2 === 0 ? 22 : 18}
                    reverse={gi % 2 !== 0}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
