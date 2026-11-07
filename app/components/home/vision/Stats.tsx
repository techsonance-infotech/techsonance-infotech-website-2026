import React from "react";
import type { StatItem } from "./types";

interface StatsProps {
  items: StatItem[];
}

export default function Stats({ items }: StatsProps) {
  if (!items || items.length < 2) return null;

  return (
    <div className="mt-10 grid w-full grid-cols-[1fr_auto_1fr] items-center gap-6 sm:gap-[60px] lg:gap-[80px]">
      {/* First Stat Block */}
      <div className="w-full text-left">
        <div className="text-[54px] leading-none font-bold tracking-tight text-[#2563EB]">
          {items[0].value}
        </div>
        <div className="mt-3 text-[14px] leading-tight font-medium text-[#6B7280]">
          {items[0].label}
        </div>
      </div>

      {/* Thin Vertical Divider */}
      <div className="h-[64px] w-[1px] shrink-0 self-center bg-gray-200" />

      {/* Second Stat Block */}
      <div className="w-full text-left">
        <div className="text-[54px] leading-none font-bold tracking-tight text-[#2563EB]">
          {items[1].value}
        </div>
        <div className="mt-3 text-[14px] leading-tight font-medium text-[#6B7280]">
          {items[1].label}
        </div>
      </div>
    </div>
  );
}
