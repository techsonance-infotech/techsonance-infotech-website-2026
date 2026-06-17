"use client";

import { useState } from "react";

export default function Component() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen w-full bg-white relative">
      {/* Dual Gradient Overlay (Bottom) Background (Removed purple/pink, using theme blue and cyan) */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(229,231,235,0.8) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(229,231,235,0.8) 1px, transparent 1px),
            radial-gradient(circle 500px at 20% 100%, rgba(13, 71, 161, 0.15), transparent),
            radial-gradient(circle 500px at 100% 80%, rgba(0, 139, 217, 0.15), transparent)
          `,
          backgroundSize: "48px 48px, 48px 48px, 100% 100%, 100% 100%",
        }}
      />
      {/* Your Content/Components */}
    </div>
  );
}
