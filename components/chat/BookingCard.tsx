"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
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
  RefreshCw,
} from "lucide-react";
import { getVisitorProfile, saveVisitorProfile, saveBookingCopy } from "@/lib/chat/storage";
import { trackBookingFormSubmit } from "@/lib/analytics";
import { callApi } from "@/lib/api/callApi";
import { createBookingContract } from "@/lib/contracts/booking.contract";
import { useBookingSlots } from "@/features/booking/hooks/useBookingSlots";

interface BookingCardProps {
  onSuccess?: (ref: string) => void;
  recentMessages?: { role: "user" | "assistant"; content: string }[];
}

export interface BookingFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  projectType: string;
  budgetRange: string;
  timeline: string;
  slotIso: string;
  message: string;
  website: string; // Honeypot
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
  const [visitorTimezone] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
    } catch {
      return "Asia/Kolkata";
    }
  });

  // Dedicated slots query via useBookingSlots (GET /api/slots)
  const {
    slots,
    slotsByDate,
    isLoading: loadingSlots,
    errorMessage: slotsError,
    isEmpty: noSlotsAvailable,
    refetch: refetchSlots,
  } = useBookingSlots();

  // Status State
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [bookedRef, setBookedRef] = useState<string | null>(null);

  // React Hook Form for state & validation management
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<BookingFormData>({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      projectType: PROJECT_TYPES[0],
      budgetRange: BUDGET_RANGES[0],
      timeline: TIMELINES[0],
      slotIso: "",
      message: "",
      website: "",
    },
  });

  // 1. Prefill profile from Dexie DB
  useEffect(() => {
    getVisitorProfile().then((profile) => {
      if (profile) {
        if (profile.name) setValue("name", profile.name, { shouldValidate: true });
        if (profile.email) setValue("email", profile.email, { shouldValidate: true });
        if (profile.phone) setValue("phone", profile.phone);
        if (profile.company) setValue("company", profile.company);
      }
    });
  }, [setValue]);

  // 2. Select default slot once slots load
  useEffect(() => {
    if (slots.length > 0 && !getValues("slotIso")) {
      setValue("slotIso", slots[0].iso, { shouldValidate: true });
    }
  }, [slots, getValues, setValue]);

  const onSubmit = async (formData: BookingFormData) => {
    setErrorMsg(null);
    setSubmitting(true);

    try {
      // Save profile locally in IndexedDB
      await saveVisitorProfile({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        consent: true,
      });

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        company: formData.company.trim() || undefined,
        projectType: formData.projectType,
        budgetRange: formData.budgetRange,
        timeline: formData.timeline || TIMELINES[0],
        slotIso: formData.slotIso,
        visitorTimezone,
        message: formData.message.trim() || undefined,
        website: formData.website || undefined,
        recentMessages: recentMessages?.slice(-5),
      };

      // Call typed booking endpoint: POST /api/book
      const res = await callApi(createBookingContract, { body: payload });

      if (!res.ok) {
        throw new Error(res.error.message || "Failed to schedule consultation.");
      }

      const ref = res.data.ref || "TS-CONFIRMED";
      setBookedRef(ref);

      trackBookingFormSubmit({
        projectType: formData.projectType,
        budgetRange: formData.budgetRange,
        timeline: formData.timeline,
        referenceId: ref,
      });

      // Save booking copy locally in IndexedDB
      await saveBookingCopy({
        ref,
        slot: formData.slotIso,
        project: formData.projectType,
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

  if (bookedRef) {
    const userEmail = getValues("email");
    return (
      <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-xs text-slate-800 animate-fade-in my-2">
        <div className="flex items-center gap-3 text-emerald-600 mb-3">
          <CheckCircle2 className="w-6 h-6 shrink-0" />
          <h4 className="font-semibold text-base text-slate-900">Consultation Confirmed!</h4>
        </div>
        <p className="text-xs text-slate-600 mb-3 leading-relaxed">
          We have sent your confirmation email and calendar invite (.ics) to{" "}
          <strong>{userEmail}</strong>.
        </p>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs flex justify-between items-center mb-3">
          <span className="text-slate-500">Booking Reference:</span>
          <span className="font-mono font-bold text-[#1155CC]">{bookedRef}</span>
        </div>
        <p className="text-[11px] text-slate-500">
          Our technical team will review your project requirements and join the call. Have
          questions? WhatsApp us at <strong className="text-slate-700">+91 9173101711</strong>.
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
            <h4 className="font-semibold text-sm text-slate-900 leading-tight">
              Book Free 30-Min Consultation
            </h4>
            <p className="text-[11px] text-slate-500">
              Zero obligation • Architecture &amp; scope estimate
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Globe className="w-3 h-3" />
          <span className="truncate max-w-[90px]">
            {visitorTimezone.split("/")[1] || visitorTimezone}
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {slotsError && (
        <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{slotsError}</span>
          </div>
          <button
            type="button"
            onClick={() => void refetchSlots()}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 hover:underline"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        {/* Honeypot hidden input */}
        <input
          type="text"
          {...register("website")}
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
        />

        {/* Name & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label
              htmlFor="booking-name"
              className="block text-[11px] font-medium text-slate-600 mb-1"
            >
              Your Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                id="booking-name"
                type="text"
                {...register("name", { required: "Name is required" })}
                placeholder="Alex Morgan"
                className="w-full text-xs pl-8 pr-2.5 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#1155CC] focus:ring-1 focus:ring-[#1155CC]"
              />
            </div>
            {errors.name && (
              <p className="text-[10px] text-red-500 mt-0.5">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="booking-email"
              className="block text-[11px] font-medium text-slate-600 mb-1"
            >
              Work Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                id="booking-email"
                type="email"
                {...register("email", {
                  required: "Work email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Valid email is required",
                  },
                })}
                placeholder="alex@company.com"
                className="w-full text-xs pl-8 pr-2.5 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#1155CC] focus:ring-1 focus:ring-[#1155CC]"
              />
            </div>
            {errors.email && (
              <p className="text-[10px] text-red-500 mt-0.5">{errors.email.message}</p>
            )}
          </div>
        </div>

        {/* Phone & Company */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label
              htmlFor="booking-phone"
              className="block text-[11px] font-medium text-slate-600 mb-1"
            >
              Phone / WhatsApp (Optional)
            </label>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                id="booking-phone"
                type="tel"
                {...register("phone")}
                placeholder="+1 (555) 000-0000"
                className="w-full text-xs pl-8 pr-2.5 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#1155CC] focus:ring-1 focus:ring-[#1155CC]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="booking-company"
              className="block text-[11px] font-medium text-slate-600 mb-1"
            >
              Company (Optional)
            </label>
            <div className="relative">
              <Building className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                id="booking-company"
                type="text"
                {...register("company")}
                placeholder="Acme Inc."
                className="w-full text-xs pl-8 pr-2.5 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#1155CC] focus:ring-1 focus:ring-[#1155CC]"
              />
            </div>
          </div>
        </div>

        {/* Project Type & Budget */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label
              htmlFor="booking-project-type"
              className="block text-[11px] font-medium text-slate-600 mb-1"
            >
              Project Type
            </label>
            <div className="relative">
              <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              <select
                id="booking-project-type"
                {...register("projectType")}
                className="w-full text-xs pl-8 pr-2 py-2 border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:border-[#1155CC]"
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
            <label
              htmlFor="booking-budget"
              className="block text-[11px] font-medium text-slate-600 mb-1"
            >
              Target Budget
            </label>
            <div className="relative">
              <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              <select
                id="booking-budget"
                {...register("budgetRange")}
                className="w-full text-xs pl-8 pr-2 py-2 border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:border-[#1155CC]"
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
          <label
            htmlFor="booking-slot"
            className="block text-[11px] font-medium text-slate-600 mb-1"
          >
            Select Preferred Time Slot ({visitorTimezone}) <span className="text-red-500">*</span>
          </label>
          {loadingSlots ? (
            <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1155CC]" />
              <span>Fetching live engineering availability...</span>
            </div>
          ) : noSlotsAvailable || Object.keys(slotsByDate).length === 0 ? (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 text-center">
              No slots available in the next 14 days. Please contact{" "}
              <a href="mailto:info@techsonance.co.in" className="text-[#1155CC] underline">
                info@techsonance.co.in
              </a>
              .
            </div>
          ) : (
            <div className="relative">
              <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              <select
                id="booking-slot"
                {...register("slotIso", { required: "Please select an available slot" })}
                className="w-full text-xs pl-8 pr-2 py-2 border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:border-[#1155CC]"
              >
                {Object.entries(slotsByDate).map(([dateStr, dateSlots]) => (
                  <optgroup key={dateStr} label={`${dateSlots[0]?.dayOfWeek ?? ""}, ${dateStr}`}>
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
          {errors.slotIso && (
            <p className="text-[10px] text-red-500 mt-0.5">{errors.slotIso.message}</p>
          )}
        </div>

        {/* Short Message / Idea */}
        <div>
          <label
            htmlFor="booking-overview"
            className="block text-[11px] font-medium text-slate-600 mb-1"
          >
            Brief Project Overview (Optional)
          </label>
          <textarea
            id="booking-overview"
            rows={2}
            {...register("message")}
            placeholder="Tell us what you're building, key features, or any questions..."
            className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#1155CC] focus:ring-1 focus:ring-[#1155CC] resize-none"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting || loadingSlots}
          className="w-full py-2.5 px-4 bg-linear-to-r from-[#1155CC] to-[#008BD9] hover:from-[#0D47A1] hover:to-[#0070BA] text-white rounded-xl font-medium text-xs shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
