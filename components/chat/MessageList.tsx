"use client";

import React, { useRef, useEffect } from "react";
import { Bot, User } from "lucide-react";
import type { Msg } from "@/lib/chat/storage";
import { TypingDots } from "./TypingDots";
import { BookingCard } from "./BookingCard";
import { QuickReplies } from "./QuickReplies";

interface MessageListProps {
  messages: Msg[];
  isStreaming?: boolean;
  streamingText?: string;
  streamingShowBooking?: boolean;
  onChipSelect: (chip: string) => void;
  recentMessagesForBooking?: { role: "user" | "assistant"; content: string }[];
}

function formatTime(timestamp: number): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(timestamp));
  } catch {
    return "";
  }
}

export function MessageList({
  messages,
  isStreaming = false,
  streamingText = "",
  streamingShowBooking = false,
  onChipSelect,
  recentMessagesForBooking,
}: MessageListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollEndRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(messages.length);

  useEffect(() => {
    // Scroll down when new messages are added or during active stream
    if (messages.length !== prevCountRef.current || isStreaming) {
      scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
      prevCountRef.current = messages.length;
    }
  }, [messages.length, isStreaming, streamingText]);

  return (
    <div
      ref={scrollContainerRef}
      role="log"
      aria-live="polite"
      data-lenis-prevent
      data-lenis-prevent-wheel
      data-lenis-prevent-touch
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      className="min-h-0 flex-1 space-y-3.5 overflow-y-auto overscroll-contain p-3.5 text-xs sm:p-4"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      {messages.map((msg, index) => {
        const isUser = msg.role === "user";
        const isLastAssistant = !isUser && index === messages.length - 1;

        return (
          <div
            key={msg.id || `${msg.ts}-${index}`}
            className={`flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
          >
            {/* Avatar */}
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-medium text-white shadow-2xs ${
                isUser ? "bg-slate-700" : "bg-gradient-to-tr from-[#0F52BA] to-[#008BD9]"
              }`}
            >
              {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
            </div>

            {/* Bubble Container */}
            <div
              className={`space-y-1.5 ${msg.showBooking ? "w-full max-w-full" : "max-w-[85%]"} ${isUser ? "items-end text-right" : "items-start text-left"}`}
            >
              <div
                className={`rounded-2xl p-3.5 leading-relaxed whitespace-pre-wrap ${
                  isUser
                    ? "bg-[#1155CC] text-white rounded-tr-xs shadow-xs ml-auto"
                    : "bg-white text-slate-800 border border-slate-100 rounded-tl-xs shadow-2xs"
                }`}
              >
                {msg.text}
              </div>

              {/* Timestamp */}
              <div className="px-1 text-[10px] text-slate-400">{formatTime(msg.ts)}</div>

              {/* Render BookingCard if flagged */}
              {msg.showBooking && (
                <div className="w-full pt-1">
                  <BookingCard recentMessages={recentMessagesForBooking} />
                </div>
              )}

              {/* Show chips if last assistant message and not streaming */}
              {isLastAssistant && !isStreaming && msg.chips && msg.chips.length > 0 && (
                <div className="pt-1">
                  <QuickReplies chips={msg.chips} onSelect={onChipSelect} />
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Streaming message indicator */}
      {isStreaming && (
        <div className="flex items-start gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#0F52BA] to-[#008BD9] text-white shadow-2xs">
            <Bot className="h-3.5 w-3.5" />
          </div>

          <div
            className={`space-y-1.5 ${streamingShowBooking ? "w-full max-w-full" : "max-w-[85%]"}`}
          >
            {streamingText ? (
              <div className="rounded-2xl rounded-tl-xs border border-slate-100 bg-white p-3.5 leading-relaxed whitespace-pre-wrap text-slate-800 shadow-2xs">
                {streamingText}
              </div>
            ) : (
              <TypingDots />
            )}

            {streamingShowBooking && (
              <div className="w-full pt-1">
                <BookingCard recentMessages={recentMessagesForBooking} />
              </div>
            )}
          </div>
        </div>
      )}

      <div ref={scrollEndRef} />
    </div>
  );
}
