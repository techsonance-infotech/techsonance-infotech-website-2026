"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Globe,
  User,
  Mail,
  Phone,
  Building,
  Briefcase,
  DollarSign,
} from "lucide-react";
import { getVisitorProfile, saveVisitorProfile, saveBookingCopy } from "@/lib/db";
import type { Slot } from "@/lib/slots";

interface BookingCardProps {
  onSuccess?: (ref: string) => void;
  recentMessages?: { role: "user" | "assistant"; content: string }[];
}

const PROJECT_TYPES = [
  "Web Application (Next.js / React)",
  "Mobile App (Flutter iOS & Android)",
  "SaaS Platform Development",
  "AI Chatbot & Workflow Automation",
  "Custom ERP / CRM / POS System",
  "E-Commerce / Marketplace",
  "Codebase Takeover / Refactoring",
  "Other / Consulting",
];

const BUDGET_RANGES = [
  "₹1.5L - ₹3L ($2k - $4k)",
  "₹3L - ₹6L ($4k - $8k)",
  "₹6L - ₹15L ($8k - $20k)",
  "₹15L+ ($20k+)",
  "Not sure / Need consultation",
];

const TIMELINES = [
  "Immediate (1 - 2 weeks)",
  "Within 1 Month",
  "2 - 3 Months",
  "Flexible / Exploratory",
];

export function BookingCard({ onSuccess, recentMessages }: BookingCardProps) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [visitorTimezone] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
    } catch {
      return "Asia/Kolkata";
    }
  });

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [projectType, setProjectType] = useState(PROJECT_TYPES[0]);
  const [budgetRange, setBudgetRange] = useState(BUDGET_RANGES[0]);
  const [timeline, setTimeline] = useState(TIMELINES[0]);
  const [selectedSlotIso, setSelectedSlotIso] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [consent, setConsent] = useState(true);

  // Status State
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [bookedRef, setBookedRef] = useState<string | null>(null);

  useEffect(() => {
    // 1. Prefill profile from Dexie DB
    getVisitorProfile().then((profile) => {
      if (profile) {
        if (profile.name) setName(profile.name);
        if (profile.email) setEmail(profile.email);
        if (profile.phone) setPhone(profile.phone);
        if (profile.company) setCompany(profile.company);
      }
    });

    // 2. Fetch available consultation slots
    fetch("/api/slots")
      .then((res) => res.json())
      .then((data) => {
        if (data.slots && Array.isArray(data.slots)) {
          setSlots(data.slots);
          if (data.slots.length > 0) {
            setSelectedSlotIso(data.slots[0].iso);
          }
        }
      })
      .catch(() => {
        setErrorMsg("Failed to load time slots. You can still reach us directly at info@techsonance.co.in.");
      })
      .finally(() => setLoadingSlots(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim() || !email.trim() || !selectedSlotIso) {
      setErrorMsg("Please provide your name, email, and select an available time slot.");
      return;
    }

    setSubmitting(true);

    try {
      // Save profile locally in IndexedDB
      await saveVisitorProfile({ name, email, phone, company, consent });

      const payload = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        company: company.trim() || undefined,
        projectType,
        budgetRange,
        timeline,
        slotIso: selectedSlotIso,
        visitorTimezone,
        message: message.trim() || undefined,
        website: honeypot, // Honeypot
        recentMessages: recentMessages?.slice(-5),
      };

      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to schedule consultation.");
      }

      const ref = data.ref || "TS-CONFIRMED";
      setBookedRef(ref);

      // Save booking copy locally in IndexedDB
      await saveBookingCopy({
        ref,
        slot: selectedSlotIso,
        project: projectType,
        ts: Date.now(),
      });

      if (onSuccess) {
        onSuccess(ref);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Group slots by Date for cleaner dropdown / selection
  const slotsByDate: Record<string, Slot[]> = {};
  for (const s of slots.slice(0, 30)) {
    if (!slotsByDate[s.dateIST]) {
      slotsByDate[s.dateIST] = [];
    }
    slotsByDate[s.dateIST].push(s);
  }

  if (bookedRef) {
    return (
      <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-sm text-slate-800 animate-fade-in my-2">
        <div className="flex items-center gap-3 text-emerald-600 mb-3">
          <CheckCircle2 className="w-6 h-6 shrink-0" />
          <h4 className="font-semibold text-base text-slate-900">Consultation Confirmed!</h4>
        </div>
        <p className="text-xs text-slate-600 mb-3 leading-relaxed">
          We have sent your confirmation email and calendar invite (.ics) to <strong>{email}</strong>.
        </p>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs flex justify-between items-center mb-3">
          <span className="text-slate-500">Booking Reference:</span>
          <span className="font-mono font-bold text-[#1155CC]">{bookedRef}</span>
        </div>
        <p className="text-[11px] text-slate-500">
          Our technical team will review your project requirements and join the call. Have questions? WhatsApp us at{" "}
          <strong className="text-slate-700">+91 9173101711</strong>.
        </p>
      </div>
    );
  }

  return (
    <div
      data-lenis-prevent
      data-lenis-prevent-wheel
      data-lenis-prevent-touch
      className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-md my-2 text-slate-900 animate-fade-in"
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#1155CC]/10 text-[#1155CC] flex items-center justify-center font-semibold text-xs">
            TS
          </div>
          <div>
            <h4 className="font-semibold text-sm text-slate-900 leading-tight">Book Free 30-Min Consultation</h4>
            <p className="text-[11px] text-slate-500">Zero obligation • Architecture &amp; scope estimate</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Globe className="w-3 h-3" />
          <span className="truncate max-w-[90px]">{visitorTimezone.split("/")[1] || visitorTimezone}</span>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Honeypot hidden input */}
        <input
          type="text"
          name="website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
        />

        {/* Name & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Your Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Morgan"
                className="w-full text-xs pl-8 pr-2.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#1155CC] focus:ring-1 focus:ring-[#1155CC]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Work Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@company.com"
                className="w-full text-xs pl-8 pr-2.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#1155CC] focus:ring-1 focus:ring-[#1155CC]"
              />
            </div>
          </div>
        </div>

        {/* Phone & Company */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Phone / WhatsApp (Optional)</label>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full text-xs pl-8 pr-2.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#1155CC] focus:ring-1 focus:ring-[#1155CC]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Company (Optional)</label>
            <div className="relative">
              <Building className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Inc."
                className="w-full text-xs pl-8 pr-2.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#1155CC] focus:ring-1 focus:ring-[#1155CC]"
              />
            </div>
          </div>
        </div>

        {/* Project Type & Budget */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Project Type</label>
            <div className="relative">
              <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className="w-full text-xs pl-8 pr-2 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#1155CC]"
              >
                {PROJECT_TYPES.map((pt) => (
                  <option key={pt} value={pt}>
                    {pt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Target Budget</label>
            <div className="relative">
              <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              <select
                value={budgetRange}
                onChange={(e) => setBudgetRange(e.target.value)}
                className="w-full text-xs pl-8 pr-2 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#1155CC]"
              >
                {BUDGET_RANGES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Time Slot Selection */}
        <div>
          <label className="block text-[11px] font-medium text-slate-600 mb-1">
            Select Preferred Time Slot ({visitorTimezone}) <span className="text-red-500">*</span>
          </label>
          {loadingSlots ? (
            <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1155CC]" />
              <span>Fetching live engineering availability...</span>
            </div>
          ) : (
            <div className="relative">
              <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              <select
                required
                value={selectedSlotIso}
                onChange={(e) => setSelectedSlotIso(e.target.value)}
                className="w-full text-xs pl-8 pr-2 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#1155CC]"
              >
                {Object.entries(slotsByDate).map(([dateStr, dateSlots]) => (
                  <optgroup key={dateStr} label={`${dateSlots[0].dayOfWeek}, ${dateStr}`}>
                    {dateSlots.map((s) => (
                      <option key={s.iso} value={s.iso}>
                        {s.dayOfWeek}, {s.dateIST} • {s.startIST} IST
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Short Message / Idea */}
        <div>
          <label className="block text-[11px] font-medium text-slate-600 mb-1">Brief Project Overview (Optional)</label>
          <textarea
            rows={2}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us what you're building, key features, or any questions..."
            className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-[#1155CC] focus:ring-1 focus:ring-[#1155CC] resize-none"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting || loadingSlots}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-[#1155CC] to-[#008BD9] hover:from-[#0D47A1] hover:to-[#0070BA] text-white rounded-xl font-medium text-xs shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Confirming Reservation...</span>
            </>
          ) : (
            <>
              <Calendar className="w-3.5 h-3.5" />
              <span>Confirm Free Consultation</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
