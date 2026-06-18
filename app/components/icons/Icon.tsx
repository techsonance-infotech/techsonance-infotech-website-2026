"use client";
import React from "react";

export type IconName =
  | "arrow"
  | "auto"
  | "beaker"
  | "bolt"
  | "box"
  | "brain"
  | "cart"
  | "check"
  | "chevron"
  | "cloud"
  | "code"
  | "cpu"
  | "database"
  | "dns"
  | "cog"
  | "handshake"
  | "image"
  | "lightbulb"
  | "monitor"
  | "schema"
  | "shield"
  | "speed"
  | "trend"
  | "users";

export const iconPaths: Record<IconName, React.ReactNode> = {
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  auto: (
    <>
      <path d="m12 3 1.8 4.4L18 9.2l-4.2 1.8L12 15.4 10.2 11 6 9.2l4.2-1.8L12 3Z" />
      <path d="m5 14 .9 2.1L8 17l-2.1.9L5 20l-.9-2.1L2 17l2.1-.9L5 14Z" />
      <path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z" />
    </>
  ),
  beaker: (
    <>
      <path d="M9 3h6" />
      <path d="M10 3v5l-5.6 9.7A2.2 2.2 0 0 0 6.3 21h11.4a2.2 2.2 0 0 0 1.9-3.3L14 8V3" />
      <path d="M7 15h10" />
    </>
  ),
  bolt: <path d="M13 2 4 14h7l-1 8 10-13h-7l1-7Z" />,
  box: (
    <>
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
      <path d="M12 12 4 7.5" />
      <path d="m12 12 8-4.5" />
      <path d="M12 12v9" />
    </>
  ),
  brain: (
    <>
      <path d="M9 3a3 3 0 0 0-3 3v1a4 4 0 0 0-2 7.5V16a3 3 0 0 0 4.8 2.4" />
      <path d="M15 3a3 3 0 0 1 3 3v1a4 4 0 0 1 2 7.5V16a3 3 0 0 1-4.8 2.4" />
      <path d="M9 3v16" />
      <path d="M15 3v16" />
      <path d="M9 8H7" />
      <path d="M15 8h2" />
      <path d="M9 13H6" />
      <path d="M15 13h3" />
    </>
  ),
  cart: (
    <>
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  chevron: <path d="m6 9 6 6 6-6" />,
  cloud: <path d="M17.5 19H7a4 4 0 1 1 .8-7.9 5.5 5.5 0 0 1 10.5 1.9 3 3 0 0 1-.8 6Z" />,
  code: (
    <>
      <path d="m8 9-4 3 4 3" />
      <path d="m16 9 4 3-4 3" />
      <path d="m14 4-4 16" />
    </>
  ),
  cpu: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
      <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="5" rx="7" ry="3" />
      <path d="M5 5v6c0 1.7 3.1 3 7 3s7-1.3 7-3V5" />
      <path d="M5 11v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
    </>
  ),
  dns: (
    <>
      <rect x="4" y="4" width="16" height="6" rx="1.5" />
      <rect x="4" y="14" width="16" height="6" rx="1.5" />
      <path d="M8 7h.01" />
      <path d="M8 17h.01" />
    </>
  ),
  cog: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </>
  ),
  handshake: (
    <>
      <path d="m7 11 3-3 4 4 3-3 4 4-5 5a3 3 0 0 1-4.2 0L7 13" />
      <path d="m2 12 4-4 3 3" />
      <path d="m22 12-4-4-3 3" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m8 13 3-3 4 4 2-2 3 3" />
    </>
  ),
  lightbulb: (
    <>
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M8.5 14.5A6 6 0 1 1 15.5 14c-.9.7-1.5 1.8-1.5 3h-4c0-1-.5-1.9-1.5-2.5Z" />
    </>
  ),
  monitor: (
    <>
      <path d="M3 17V7" />
      <path d="M7 17v-5" />
      <path d="M11 17v-7" />
      <path d="M15 17V9" />
      <path d="M19 17V5" />
      <path d="m3 13 4-4 4 3 8-8" />
    </>
  ),
  schema: (
    <>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="9" y="14" width="6" height="6" rx="1" />
      <path d="M10 7h4" />
      <path d="M12 10v4" />
    </>
  ),
  shield: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-5" />
    </>
  ),
  speed: (
    <>
      <path d="M21 12a9 9 0 1 1-18 0" />
      <path d="m12 12 5-5" />
      <path d="M8 12h.01" />
      <path d="M16 12h.01" />
    </>
  ),
  trend: (
    <>
      <path d="M3 17 9 11l4 4 8-8" />
      <path d="M15 7h6v6" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
};

export function Icon({ name, className = "", style }: { name: IconName; className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      style={style}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
      viewBox="0 0 24 24"
    >
      {iconPaths[name]}
    </svg>
  );
}
