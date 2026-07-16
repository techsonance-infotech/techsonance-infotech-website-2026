import React, { useEffect, useRef, useState } from "react";
import { AvatarGroup } from "./types";
import Arc from "./Arc";

interface SemiCircleDashboardProps {
  groups: AvatarGroup[];
}

// ---------------------------------------------------------------------------
// Fixed "design space" coordinates for perfect alignment
// ---------------------------------------------------------------------------
const DESIGN_W = 1125;
const DESIGN_H = 562.5;
const CX = 562.5;
const CY = 540;
const R_OUTER = 520;
const R_MIDDLE = 465;
const R_INNER = 410;
const COLOR_PRIMARY = "#2563EB";

// Clockwise active order mapping: Talent (idx 1) -> Experts (idx 2) -> Our Core Team (idx 0)
const ACTIVE_ORDER = [1, 2, 0];

export default function SemiCircleDashboard({ groups }: SemiCircleDashboardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [step, setStep] = useState(0);

  // Store previous angles to detect snap wrap-around (60 -> -60)
  const prevAnglesRef = useRef<Record<string, number>>({});

  // Measure container width and scale design space proportionally
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setScale(width / DESIGN_W);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Clockwise auto-rotating timer (every 4 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setStep((s) => s + 1);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  if (!groups || groups.length < 3) return null;
  const visibleGroups = groups.slice(0, 3);

  // Determine active group index based on step
  const activeIdx = ACTIVE_ORDER[step % 3];

  // Radial ticks along the outer arc
  const ticks: { x1: string; y1: string; x2: string; y2: string }[] = [];
  for (let angle = 0; angle <= 180; angle += 8) {
    const rad = (angle * Math.PI) / 180;
    ticks.push({
      x1: (CX + R_OUTER * Math.cos(rad)).toFixed(3),
      y1: (CY - R_OUTER * Math.sin(rad)).toFixed(3),
      x2: (CX + (R_OUTER + 6) * Math.cos(rad)).toFixed(3),
      y2: (CY - (R_OUTER + 6) * Math.sin(rad)).toFixed(3),
    });
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full select-none mx-auto max-w-[1000px] overflow-hidden"
      style={{ aspectRatio: `${DESIGN_W} / ${DESIGN_H}` }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: DESIGN_W,
          height: DESIGN_H,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {/* Background SVG Dashboard */}
        <svg
          width={DESIGN_W}
          height={DESIGN_H}
          viewBox={`0 0 ${DESIGN_W} ${DESIGN_H}`}
          className="absolute inset-0 pointer-events-none"
        >
          <defs>
            <filter id="hub-shadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.08" />
            </filter>
            <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <mask id="bottom-fade-mask">
              <rect x="0" y="0" width={DESIGN_W} height={DESIGN_H} fill="url(#mask-grad)" />
            </mask>
            <linearGradient id="mask-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="60%" stopColor="white" />
              <stop offset="85%" stopColor="white" stopOpacity="0.3" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="top-glow" cx="50%" cy="30%" r="35%">
              <stop offset="0%" stopColor={COLOR_PRIMARY} stopOpacity="0.08" />
              <stop offset="100%" stopColor={COLOR_PRIMARY} stopOpacity="0" />
            </radialGradient>
            <linearGradient id="bottom-overlay-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F8FAFC" stopOpacity="0" />
              <stop offset="40%" stopColor="#F8FAFC" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#F8FAFC" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="active-segment-grad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.0" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.14" />
            </linearGradient>
          </defs>

          <g mask="url(#bottom-fade-mask)">
            {/* Semicircle Glows */}
            <circle cx={CX} cy={CY - R_INNER} r={220} fill="url(#top-glow)" />
            <circle cx={CX} cy={CY} r={180} fill={COLOR_PRIMARY} fillOpacity="0.02" />
            <circle cx={CX} cy={CY} r={100} fill={COLOR_PRIMARY} fillOpacity="0.04" />

            {/* Semicircle Wedges (Background Sectors) */}
            {/* Left Segment (180 to 120 deg) */}
            <path d="M 42.5 540 A 520 520 0 0 1 302.5 89.7 L 562.5 540 Z" fill="#FFFFFF" />
            
            {/* Right Segment (60 to 0 deg) */}
            <path d="M 822.5 89.7 A 520 520 0 0 1 1082.5 540 L 562.5 540 Z" fill="#FFFFFF" />

            {/* Active Center Segment (120 to 60 deg) */}
            <path d="M 302.5 89.7 A 520 520 0 0 1 822.5 89.7 L 562.5 540 Z" fill="url(#active-segment-grad)" />

            {/* Inner Mask (R_INNER = 410) to create Annular Sectors */}
            <circle cx={CX} cy={CY} r={R_INNER} fill="#F8FAFC" />

            {/* Divider lines between wedges */}
            <line x1={302.5} y1={89.7} x2={CX} y2={CY} stroke="#FFFFFF" strokeWidth={4} />
            <line x1={822.5} y1={89.7} x2={CX} y2={CY} stroke="#FFFFFF" strokeWidth={4} />

            {/* Concentric Arcs */}
            <Arc cx={CX} cy={CY} r={R_OUTER} startAngle={180} endAngle={0} stroke="#E2E8F0" strokeWidth={2} />
            <Arc cx={CX} cy={CY} r={R_OUTER} startAngle={120} endAngle={60} stroke={COLOR_PRIMARY} strokeWidth={4} filter="url(#neon-glow)" />
            <Arc cx={CX} cy={CY} r={R_MIDDLE} startAngle={180} endAngle={0} stroke="#E2E8F0" strokeWidth={2} />
            <Arc cx={CX} cy={CY} r={R_INNER} startAngle={180} endAngle={0} stroke="#E2E8F0" strokeWidth={1.5} strokeDasharray="5 7" />

            {/* Ticks */}
            {ticks.map((tick, idx) => (
              <line key={idx} x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2} stroke="#E2E8F0" strokeWidth={1.5} />
            ))}

            {/* Static Needle Pointer */}
            <line x1={CX} y1={230} x2={CX} y2={520} stroke={COLOR_PRIMARY} strokeWidth={8} strokeLinecap="round" />
            <circle cx={CX} cy={CY} r={25} fill="white" stroke="#F1F5F9" strokeWidth={1} filter="url(#hub-shadow)" />
            <circle cx={CX} cy={CY} r={10} fill={COLOR_PRIMARY} />
          </g>

          {/* Lower Bottom Fade Masking Overlay */}
          <rect x="0" y="475" width={DESIGN_W} height="87.5" fill="url(#bottom-overlay-grad)" className="pointer-events-none" />
        </svg>

        {/* HTML Rotating Group Cards */}
        {visibleGroups.map((group, idx) => {
          // Compute correct angle offset based on activeIdx for Clockwise rotation
          let angle = 0;
          if (idx === activeIdx) {
            angle = 0;
          } else if (
            (activeIdx === 1 && idx === 0) ||
            (activeIdx === 2 && idx === 1) ||
            (activeIdx === 0 && idx === 2)
          ) {
            angle = 60; // Right side preview position
          } else {
            angle = -60; // Left side preview position
          }

          const isActive = idx === activeIdx;

          // Detect wrap-around snaps to prevent backslide animations
          const prevAngle = prevAnglesRef.current[group.id];
          prevAnglesRef.current[group.id] = angle;
          const isWrapping = prevAngle === 60 && angle === -60;

          // For preview groups, only show the first 3 avatars
          const visibleMembers = isActive ? group.members : group.members.slice(0, 3);

          // Spacing offsets for the curved avatar layout
          const angleOffsets = isActive
            ? [-24, -12, 0, 12, 24]
            : [-13, 0, 13];

          return (
            <div
              key={group.id}
              style={{
                position: "absolute",
                left: "50%",
                top: 0,
                transform: `translateX(-50%) rotate(${angle}deg) scale(${isActive ? 1.0 : 0.82})`,
                transformOrigin: `50% ${CY}px`,
                width: 480,
                height: CY,
                transition: isWrapping ? "none" : "transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)",
              }}
              className="z-10"
            >
              {/* Active Group Backlight Glow */}
              {isActive && (
                <div className="absolute top-[50px] left-1/2 -translate-x-1/2 w-56 h-56 bg-blue-500/10 blur-3xl rounded-full pointer-events-none -z-10" />
              )}

              {/* Render avatars along the curve */}
              {visibleMembers.map((member, mIdx) => {
                const angleOffset = angleOffsets[mIdx] || 0;
                const rad = (angleOffset * Math.PI) / 180;

                // Position relative to group card container (width: 480, center: 240, pivot: 540)
                const avatarRadius = R_MIDDLE;
                const leftPos = 240 + avatarRadius * Math.sin(rad) - 50; // 50 is half of 100px avatar
                const topPos = 540 - avatarRadius * Math.cos(rad) - 50;  // 50 is half of 100px avatar

                // Only middle avatar in the active row gets the blue border/glow
                const isCenterAvatar = isActive && mIdx === 2;
                const zIndex = isActive ? (10 - Math.abs(mIdx - 2)) : (10 - Math.abs(mIdx - 1));

                return (
                  <div
                    key={member.id}
                    style={{
                      position: "absolute",
                      left: leftPos,
                      top: topPos,
                      width: 100,
                      height: 100,
                      zIndex: zIndex,
                      transform: `rotate(${-angle - angleOffset}deg)`,
                      opacity: isActive ? 1.0 : 0.6,
                      transition: isWrapping ? "none" : "transform 0.8s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.8s ease",
                    }}
                    className={`rounded-full border-2 bg-white overflow-hidden flex-shrink-0 transition-all ${
                      isCenterAvatar
                        ? "border-white ring-2 ring-[#2563EB] shadow-lg scale-105"
                        : "border-white shadow-sm"
                    }`}
                  >
                    {member.avatarUrl ? (
                      <img src={member.avatarUrl} alt="Team" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center text-[10px] text-gray-400 font-semibold select-none">
                        TS
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Title / Pill (Only displayed on the active group, now 22px and highly readable) */}
              {isActive && (
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: 210,
                    transform: "translateX(-50%)",
                  }}
                  className="px-8 py-2.5 text-[22px] font-bold tracking-wide whitespace-nowrap z-10 bg-white border border-blue-200 rounded-full text-blue-600 shadow-[0_8px_20px_rgba(37,99,235,0.18)] opacity-100"
                >
                  {group.title}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
