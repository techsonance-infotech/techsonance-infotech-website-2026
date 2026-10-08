import React from "react";
import { Calendar, Sparkles } from "lucide-react";

interface QuickRepliesProps {
  chips?: readonly string[] | string[];
  onSelect: (chip: string) => void;
  disabled?: boolean;
}

export function QuickReplies({
  chips = ["Services", "Pricing & Budget", "Our Team", "Book Free Consultation"],
  onSelect,
  disabled = false,
}: QuickRepliesProps) {
  if (!chips || chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 py-1.5 px-1 animate-fade-in">
      {chips.map((chip) => {
        const isBooking = chip.toLowerCase().includes("book") || chip.toLowerCase().includes("consultation");
        return (
          <button
            key={chip}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(chip)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-200 cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
              isBooking
                ? "bg-[#1155CC] text-white hover:bg-[#0D47A1] shadow-xs hover:shadow-md"
                : "bg-white text-slate-700 border border-slate-200 hover:border-[#1155CC]/40 hover:text-[#1155CC] hover:bg-slate-50 shadow-2xs"
            }`}
          >
            {isBooking ? (
              <Calendar className="w-3 h-3" />
            ) : (
              <Sparkles className="w-3 h-3 text-[#1155CC]/70" />
            )}
            {chip}
          </button>
        );
      })}
    </div>
  );
}
