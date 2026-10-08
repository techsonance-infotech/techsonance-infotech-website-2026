import React from "react";

export function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3 bg-white border border-slate-100 rounded-2xl rounded-tl-sm shadow-sm w-fit">
      <span className="w-2 h-2 rounded-full bg-[#1155CC]/60 animate-bounce [animation-delay:-0.3s]" />
      <span className="w-2 h-2 rounded-full bg-[#1155CC]/60 animate-bounce [animation-delay:-0.15s]" />
      <span className="w-2 h-2 rounded-full bg-[#1155CC]/60 animate-bounce" />
    </div>
  );
}
