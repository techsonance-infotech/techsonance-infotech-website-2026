"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { MessageSquare, X, Calendar, Sparkles } from "lucide-react";
import { BOT_CONFIG } from "@/lib/config";
import {
  type Msg,
  saveMessage,
  getSessionMessages,
  clearAllChat,
  cleanupOldMessages,
} from "@/lib/chat/storage";
import { MessageList } from "./MessageList";
import { Composer } from "./Composer";
import { PrivacyNote } from "./PrivacyNote";

export default function ChatWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      let sid = localStorage.getItem("ts_chat_session_id");
      if (!sid) {
        sid = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
        localStorage.setItem("ts_chat_session_id", sid);
      }
      return sid;
    }
    return "";
  });
  const [messages, setMessages] = useState<Msg[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [streamingShowBooking, setStreamingShowBooking] = useState(false);
  const [showProactiveNudge, setShowProactiveNudge] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);

  // Initialize or restore session on mount
  useEffect(() => {
    const sid =
      sessionId ||
      (typeof window !== "undefined"
        ? localStorage.getItem("ts_chat_session_id") ||
          crypto.randomUUID().replace(/-/g, "").slice(0, 16)
        : "");
    if (!sid) return;

    // Clean up messages older than 30 days
    cleanupOldMessages(30);

    // Restore messages from Dexie IndexedDB
    getSessionMessages(sid).then((saved) => {
      if (saved && saved.length > 0) {
        setMessages(saved);
      } else {
        // First-time welcome greeting
        const welcomeMsg: Msg = {
          sessionId: sid,
          role: "assistant",
          text: `Hi there! I'm ${BOT_CONFIG.name}, the AI consultant at TechSonance Infotech LLP.\n\nHow can I assist with your software development project, architecture, or estimates today?`,
          ts: Date.now(),
          chips: BOT_CONFIG.quickReplies,
          showBooking: false,
        };
        saveMessage(welcomeMsg);
        setMessages([welcomeMsg]);
      }
    });

    // Proactive nudge after 45s if user has not interacted
    const nudgeTimer = setTimeout(() => {
      const hasNudged = sessionStorage.getItem("ts_chat_nudged");
      if (!hasNudged) {
        setShowProactiveNudge(true);
        sessionStorage.setItem("ts_chat_nudged", "true");
      }
    }, 45000);

    return () => clearTimeout(nudgeTimer);
  }, [sessionId]);

  // Keyboard accessibility: Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        triggerButtonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Send message handler
  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming || !sessionId) return;

      setShowProactiveNudge(false);

      const userMsg: Msg = {
        sessionId,
        role: "user",
        text: text.trim(),
        ts: Date.now(),
      };

      // 1. Add and save user message
      await saveMessage(userMsg);
      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);

      setIsStreaming(true);
      setStreamingText("");
      setStreamingShowBooking(false);

      let accumulatedText = "";
      let metaChips: readonly string[] | string[] = [...BOT_CONFIG.quickReplies];
      let metaShowBooking = false;

      try {
        const payloadMessages = updatedMessages.slice(-6).map((m) => ({
          role: m.role,
          content: m.text,
        }));

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            messages: payloadMessages,
          }),
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || `Request failed with status ${res.status}`);
        }

        if (!res.body) {
          throw new Error("Empty response stream");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() || "";

          for (const eventStr of events) {
            const lines = eventStr.split("\n");
            let eventType = "";
            let dataStr = "";

            for (const line of lines) {
              if (line.startsWith("event: ")) {
                eventType = line.slice(7).trim();
              } else if (line.startsWith("data: ")) {
                dataStr = line.slice(6).trim();
              }
            }

            if (eventType === "token" && dataStr) {
              try {
                const token = JSON.parse(dataStr);
                accumulatedText += token;
                setStreamingText(accumulatedText);
              } catch {
                // ignore
              }
            } else if (eventType === "meta" && dataStr) {
              try {
                const meta = JSON.parse(dataStr);
                if (meta.chips) metaChips = meta.chips;
                if (meta.showBooking) {
                  metaShowBooking = true;
                  setStreamingShowBooking(true);
                }
              } catch {
                // ignore
              }
            }
          }
        }

        const assistantMsg: Msg = {
          sessionId,
          role: "assistant",
          text: accumulatedText.trim() || BOT_CONFIG.refusalText,
          ts: Date.now(),
          chips: metaChips,
          showBooking: metaShowBooking,
        };

        await saveMessage(assistantMsg);
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (_err: unknown) {
        const errorText =
          "I encountered a temporary connection issue. Feel free to ask again or schedule a free consultation with our team.";
        const assistantMsg: Msg = {
          sessionId,
          role: "assistant",
          text: errorText,
          ts: Date.now(),
          chips: ["Book Free Consultation", "Services", "Pricing & Budget"],
          showBooking: false,
        };
        await saveMessage(assistantMsg);
        setMessages((prev) => [...prev, assistantMsg]);
      } finally {
        setIsStreaming(false);
        setStreamingText("");
        setStreamingShowBooking(false);
      }
    },
    [isStreaming, messages, sessionId],
  );

  const handleClearChat = async () => {
    if (confirm("Are you sure you want to clear your local chat history?")) {
      await clearAllChat();
      const sid = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
      localStorage.setItem("ts_chat_session_id", sid);
      setSessionId(sid);

      const welcomeMsg: Msg = {
        sessionId: sid,
        role: "assistant",
        text: `Hi there! I'm ${BOT_CONFIG.name}, the AI consultant at TechSonance Infotech LLP.\n\nHow can I assist with your software development project, architecture, or estimates today?`,
        ts: Date.now(),
        chips: BOT_CONFIG.quickReplies,
        showBooking: false,
      };
      await saveMessage(welcomeMsg);
      setMessages([welcomeMsg]);
    }
  };

  const handleOpenWidget = () => {
    setIsOpen(true);
    setShowProactiveNudge(false);
  };

  // Do not render sales chatbot inside admin studio to prevent button collisions (Finding 12)
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      {/* ── Floating Launcher Button ────────────────────────────────────────── */}
      <div className="fixed right-5 bottom-5 z-50 flex flex-col items-end gap-2.5">
        {/* Proactive Idle Nudge Bubble */}
        {showProactiveNudge && !isOpen && (
          <div className="animate-fade-in relative max-w-[280px] rounded-2xl border border-slate-200 bg-white p-3.5 text-xs text-slate-800 shadow-xl">
            <button
              onClick={() => setShowProactiveNudge(false)}
              className="absolute top-2 right-2 cursor-pointer p-0.5 text-slate-400 hover:text-slate-600"
              aria-label="Close notification"
            >
              <X className="h-3 w-3" />
            </button>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              <span className="font-semibold text-slate-900">Sonance AI from TechSonance</span>
            </div>
            <p className="mb-2.5 leading-relaxed text-slate-600">
              Have a software project in mind? I can give you a quick estimate or schedule a free
              call with our team!
            </p>
            <button
              onClick={handleOpenWidget}
              className="w-full cursor-pointer rounded-lg bg-[#1155CC] px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-[#0D47A1]"
            >
              Chat with Sonance AI
            </button>
          </div>
        )}

        {!isOpen && (
          <button
            ref={triggerButtonRef}
            onClick={handleOpenWidget}
            aria-label="Open TechSonance Assistant"
            className="group relative flex cursor-pointer items-center gap-2.5 rounded-full bg-gradient-to-r from-[#0F52BA] via-[#1155CC] to-[#008BD9] px-4 py-3.5 text-white shadow-[0_8px_30px_rgba(17,85,204,0.35)] transition-all duration-300 hover:scale-105 hover:shadow-[0_10px_40px_rgba(17,85,204,0.5)] focus:ring-2 focus:ring-[#1155CC] focus:ring-offset-2 focus:outline-none active:scale-95"
          >
            <div className="relative">
              <MessageSquare className="h-5 w-5 transition-transform duration-300 group-hover:rotate-6" />
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 animate-pulse rounded-full border-2 border-[#1155CC] bg-emerald-400" />
            </div>
            <span className="pr-0.5 text-xs font-semibold tracking-wide">Chat with Sonance AI</span>
          </button>
        )}
      </div>

      {/* ── Chat Modal Panel ────────────────────────────────────────────────── */}
      {isOpen && (
        <section
          ref={panelRef}
          aria-label="TechSonance AI Assistant"
          data-lenis-prevent
          data-lenis-prevent-wheel
          data-lenis-prevent-touch
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          className="animate-fade-in fixed right-0 bottom-0 z-50 flex h-[100dvh] w-full flex-col overflow-hidden overscroll-contain border border-slate-200/80 bg-[#FAFBFD] shadow-[0_20px_60px_rgba(0,0,0,0.18)] sm:right-5 sm:bottom-5 sm:h-[620px] sm:w-[390px] sm:max-w-[calc(100vw-32px)] sm:rounded-3xl"
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between bg-linear-to-r from-[#0F52BA] via-[#1155CC] to-[#008BD9] px-4 py-3.5 text-white shadow-xs">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/15 text-sm font-bold backdrop-blur-xs">
                  <Sparkles className="h-4 w-4 text-amber-300" />
                </div>
                <span className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 border-[#1155CC] bg-emerald-400" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm leading-tight font-semibold tracking-tight">Sonance AI</h3>
                  <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-medium">
                    AI Assistant
                  </span>
                </div>
                <p className="text-[11px] leading-tight text-white/80">TechSonance Infotech LLP</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => handleSendMessage("I'd like to book a consultation call")}
                aria-label="Book Consultation"
                className="flex cursor-pointer items-center gap-1 rounded-lg bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white transition-colors hover:bg-white/25"
              >
                <Calendar className="h-3 w-3 text-amber-300" />
                <span>Book Call</span>
              </button>

              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close Chat"
                className="cursor-pointer rounded-full p-1.5 text-white/90 transition-colors hover:bg-white/20 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Conversation Message List */}
          <MessageList
            messages={messages}
            isStreaming={isStreaming}
            streamingText={streamingText}
            streamingShowBooking={streamingShowBooking}
            onChipSelect={(chip) => handleSendMessage(chip)}
            recentMessagesForBooking={messages.slice(-5).map((m) => ({
              role: m.role,
              content: m.text,
            }))}
          />

          {/* Composer Textbox */}
          <Composer
            onSend={handleSendMessage}
            disabled={isStreaming}
            placeholder="Ask a question or request an estimate..."
          />

          {/* Privacy Note & Clear Chat */}
          <PrivacyNote onClear={handleClearChat} />
        </section>
      )}
    </>
  );
}
