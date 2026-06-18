"use client";
import { useEffect, useRef, useState } from "react";

interface MetricCardProps {
  value: string;
  label: string;
  suffix?: string;
  prefix?: string;
  accentColor?: string;
  delay?: number;
}

export function MetricCard({
  value,
  label,
  suffix = "",
  prefix = "",
  accentColor = "#1155CC",
  delay = 0,
}: MetricCardProps) {
  const [displayValue, setDisplayValue] = useState("0");
  const [triggered, setTriggered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Check if value is numeric for animation
  const numericValue = parseFloat(value.replace(/[^0-9.]/g, ""));
  const isNumeric = !isNaN(numericValue) && value.replace(/[^0-9.]/g, "") === value.replace(/[^0-9.]/g, "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered) {
          setTriggered(true);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [triggered]);

  useEffect(() => {
    if (!triggered) return;
    if (!isNumeric) {
      setTimeout(() => setDisplayValue(value), delay * 1000);
      return;
    }

    const duration = 1800;
    const steps = 60;
    const increment = numericValue / steps;
    let current = 0;
    let step = 0;

    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        step++;
        current = Math.min(increment * step, numericValue);
        const hasDecimal = value.includes(".");
        setDisplayValue(hasDecimal ? current.toFixed(1) : Math.round(current).toString());
        if (current >= numericValue) clearInterval(interval);
      }, duration / steps);
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [triggered, numericValue, isNumeric, value, delay]);

  return (
    <div
      ref={ref}
      className="flex flex-col items-center p-6 rounded-2xl bg-white border border-gray-100 shadow-[0_2px_16px_rgba(0,0,0,0.06)] text-center"
    >
      <div
        className="text-3xl sm:text-4xl font-black leading-none mb-2"
        style={{ color: accentColor }}
      >
        {prefix}
        {displayValue}
        {suffix}
      </div>
      <div className="text-sm text-gray-500 font-medium leading-tight">{label}</div>
    </div>
  );
}
