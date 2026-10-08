import React from "react";
import { ShieldCheck } from "lucide-react";

export function PrivacyNote({ onClear }: { onClear?: () => void }) {
  return (
    <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-[11px] text-slate-500">
      <div className="flex items-center gap-1.5 truncate">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span className="truncate">Your chat stays in your browser.</span>
      </div>
      {onClear && (
        <button
          onClick={onClear}
          type="button"
          className="text-slate-400 hover:text-slate-700 underline text-[11px] ml-2 shrink-0 transition-colors cursor-pointer"
        >
          Clear chat
        </button>
      )}
    </div>
  );
}
