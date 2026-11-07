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
    <div className="relative border-t border-slate-100 bg-white p-3">
      <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 transition-all focus-within:border-[#1155CC] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#1155CC]">
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className="max-h-[120px] w-full resize-none bg-transparent px-2.5 py-1.5 text-xs leading-relaxed text-slate-800 placeholder:text-slate-400 focus:outline-none"
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={!input.trim() || disabled}
          aria-label="Send message"
          className="shrink-0 cursor-pointer rounded-xl bg-[#1155CC] p-2 text-white transition-all hover:bg-[#0D47A1] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#1155CC]"
        >
          {disabled ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <SendHorizontal className="h-4 w-4" />
          )}
        </button>
      </div>

      {input.length > 350 && (
        <div className="mt-1 px-1 text-right text-[10px] text-slate-400">
          {input.length}/{maxChars}
        </div>
      )}
    </div>
  );
}
