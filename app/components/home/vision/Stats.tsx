import React from "react";
import { StatItem } from "./types";

interface StatsProps {
  items: StatItem[];
}

export default function Stats({ items }: StatsProps) {
  if (!items || items.length < 2) return null;

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] gap-6 sm:gap-[60px] lg:gap-[80px] mt-10 items-center w-full">
      {/* First Stat Block */}
      <div className="text-left w-full">
        <div className="text-[54px] font-bold text-[#2563EB] tracking-tight leading-none">
          {items[0].value}
        </div>
        <div className="mt-3 text-[14px] text-[#6B7280] font-medium leading-tight">
          {items[0].label}
        </div>
      </div>

      {/* Thin Vertical Divider */}
      <div className="w-[1px] h-[64px] bg-gray-200 self-center shrink-0" />

      {/* Second Stat Block */}
      <div className="text-left w-full">
        <div className="text-[54px] font-bold text-[#2563EB] tracking-tight leading-none">
          {items[1].value}
        </div>
        <div className="mt-3 text-[14px] text-[#6B7280] font-medium leading-tight">
          {items[1].label}
        </div>
      </div>
    </div>
  );
}
