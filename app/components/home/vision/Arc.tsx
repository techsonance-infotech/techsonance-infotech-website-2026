import React from "react";

interface ArcProps {
  cx: number;
  cy: number;
  r: number;
  startAngle: number;
  endAngle: number;
  stroke: string;
  strokeWidth: number;
  className?: string;
  strokeDasharray?: string;
  strokeLinecap?: "butt" | "round" | "square";
  filter?: string;
}

export default function Arc({
  cx,
  cy,
  r,
  startAngle,
  endAngle,
  stroke,
  strokeWidth,
  className = "",
  strokeDasharray,
  strokeLinecap = "round",
  filter,
}: ArcProps) {
  // Convert angles to radians (SVG y axis goes down, so we subtract angle from cy)
  const rad1 = (startAngle * Math.PI) / 180;
  const rad2 = (endAngle * Math.PI) / 180;

  const x1 = (cx + r * Math.cos(rad1)).toFixed(3);
  const y1 = (cy - r * Math.sin(rad1)).toFixed(3);
  const x2 = (cx + r * Math.cos(rad2)).toFixed(3);
  const y2 = (cy - r * Math.sin(rad2)).toFixed(3);

  const angleDiff = Math.abs(endAngle - startAngle);
  const largeArcFlag = angleDiff <= 180 ? 0 : 1;
  const sweepFlag = startAngle > endAngle ? 1 : 0;

  const pathData = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} ${sweepFlag} ${x2} ${y2}`;

  return (
    <path
      d={pathData}
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeDasharray={strokeDasharray}
      strokeLinecap={strokeLinecap}
      className={className}
      filter={filter}
    />
  );
}
