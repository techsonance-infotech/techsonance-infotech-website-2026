import React from "react";
import { ShieldCheck } from "lucide-react";

export function PrivacyNote({ onClear }: { onClear?: () => void }) {
  return (
    <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-4 py-2 text-[11px] text-slate-500">
      <div className="flex items-center gap-1.5 truncate">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
        <span className="truncate">Your chat stays in your browser.</span>
      </div>
      {onClear && (
        <button
          onClick={onClear}
          type="button"
          className="ml-2 shrink-0 cursor-pointer text-[11px] text-slate-400 underline transition-colors hover:text-slate-700"
        >
          Clear chat
        </button>
      )}
    </div>
  );
}
