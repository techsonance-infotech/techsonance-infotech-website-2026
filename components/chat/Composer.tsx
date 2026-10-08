"use client";

import React, { useState, useRef, useEffect } from "react";
import { SendHorizontal, Loader2 } from "lucide-react";
import { BOT_CONFIG } from "@/lib/config";

interface ComposerProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function Composer({
  onSend,
  disabled = false,
  placeholder = "Ask about our services, pricing, or ideas...",
}: ComposerProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const maxChars = BOT_CONFIG.thresholds.maxInputChars;

  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length <= maxChars) {
      setInput(val);
      // Auto resize height
      e.target.style.height = "auto";
      e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
    }
  };

  return (
    <div className="p-3 bg-white border-t border-slate-100 relative">
      <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-1.5 focus-within:border-[#1155CC] focus-within:ring-1 focus-within:ring-[#1155CC] focus-within:bg-white transition-all">
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full text-xs text-slate-800 bg-transparent px-2.5 py-1.5 focus:outline-none resize-none max-h-[120px] leading-relaxed placeholder:text-slate-400"
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={!input.trim() || disabled}
          aria-label="Send message"
          className="p-2 rounded-xl bg-[#1155CC] text-white hover:bg-[#0D47A1] disabled:opacity-40 disabled:hover:bg-[#1155CC] transition-all cursor-pointer disabled:cursor-not-allowed shrink-0"
        >
          {disabled ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <SendHorizontal className="w-4 h-4" />
          )}
        </button>
      </div>

      {input.length > 350 && (
        <div className="text-[10px] text-slate-400 text-right px-1 mt-1">
          {input.length}/{maxChars}
        </div>
      )}
    </div>
  );
}
