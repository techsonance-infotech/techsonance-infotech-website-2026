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
      <div className="animate-fade-in my-2 rounded-2xl border border-emerald-200 bg-white p-5 text-slate-800 shadow-xs">
        <div className="mb-3 flex items-center gap-3 text-emerald-600">
          <CheckCircle2 className="h-6 w-6 shrink-0" />
          <h4 className="text-base font-semibold text-slate-900">Consultation Confirmed!</h4>
        </div>
        <p className="mb-3 text-xs leading-relaxed text-slate-600">
          We have sent your confirmation email and calendar invite (.ics) to{" "}
          <strong>{userEmail}</strong>.
        </p>
        <div className="mb-3 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
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
      className="animate-fade-in my-2 rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-md sm:p-5"
    >
      <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1155CC]/10 text-xs font-semibold text-[#1155CC]">
            TS
          </div>
          <div>
            <h4 className="text-sm leading-tight font-semibold text-slate-900">
              Book Free 30-Min Consultation
            </h4>
            <p className="text-[11px] text-slate-500">
              Zero obligation • Architecture &amp; scope estimate
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Globe className="h-3 w-3" />
          <span className="max-w-[90px] truncate">
            {visitorTimezone.split("/")[1] || visitorTimezone}
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {slotsError && (
        <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{slotsError}</span>
          </div>
          <button
            type="button"
            onClick={() => void refetchSlots()}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 hover:underline"
          >
            <RefreshCw className="h-3 w-3" /> Retry
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
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <label
              htmlFor="booking-name"
              className="mb-1 block text-[11px] font-medium text-slate-600"
            >
              Your Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                id="booking-name"
                type="text"
                {...register("name", { required: "Name is required" })}
                placeholder="Alex Morgan"
                className="w-full rounded-lg border border-slate-200 py-2 pr-2.5 pl-8 text-xs focus:border-[#1155CC] focus:ring-1 focus:ring-[#1155CC] focus:outline-hidden"
              />
            </div>
            {errors.name && (
              <p className="mt-0.5 text-[10px] text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="booking-email"
              className="mb-1 block text-[11px] font-medium text-slate-600"
            >
              Work Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
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
                className="w-full rounded-lg border border-slate-200 py-2 pr-2.5 pl-8 text-xs focus:border-[#1155CC] focus:ring-1 focus:ring-[#1155CC] focus:outline-hidden"
              />
            </div>
            {errors.email && (
              <p className="mt-0.5 text-[10px] text-red-500">{errors.email.message}</p>
            )}
          </div>
        </div>

        {/* Phone & Company */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <label
              htmlFor="booking-phone"
              className="mb-1 block text-[11px] font-medium text-slate-600"
            >
              Phone / WhatsApp (Optional)
            </label>
            <div className="relative">
              <Phone className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                id="booking-phone"
                type="tel"
                {...register("phone")}
                placeholder="+1 (555) 000-0000"
                className="w-full rounded-lg border border-slate-200 py-2 pr-2.5 pl-8 text-xs focus:border-[#1155CC] focus:ring-1 focus:ring-[#1155CC] focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="booking-company"
              className="mb-1 block text-[11px] font-medium text-slate-600"
            >
              Company (Optional)
            </label>
            <div className="relative">
              <Building className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                id="booking-company"
                type="text"
                {...register("company")}
                placeholder="Acme Inc."
                className="w-full rounded-lg border border-slate-200 py-2 pr-2.5 pl-8 text-xs focus:border-[#1155CC] focus:ring-1 focus:ring-[#1155CC] focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Project Type & Budget */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <label
              htmlFor="booking-project-type"
              className="mb-1 block text-[11px] font-medium text-slate-600"
            >
              Project Type
            </label>
            <div className="relative">
              <Briefcase className="pointer-events-none absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
              <select
                id="booking-project-type"
                {...register("projectType")}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-2 pl-8 text-xs focus:border-[#1155CC] focus:outline-hidden"
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
              className="mb-1 block text-[11px] font-medium text-slate-600"
            >
              Target Budget
            </label>
            <div className="relative">
              <DollarSign className="pointer-events-none absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
              <select
                id="booking-budget"
                {...register("budgetRange")}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-2 pl-8 text-xs focus:border-[#1155CC] focus:outline-hidden"
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
            className="mb-1 block text-[11px] font-medium text-slate-600"
          >
            Select Preferred Time Slot ({visitorTimezone}) <span className="text-red-500">*</span>
          </label>
          {loadingSlots ? (
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#1155CC]" />
              <span>Fetching live engineering availability...</span>
            </div>
          ) : noSlotsAvailable || Object.keys(slotsByDate).length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center text-xs text-slate-600">
              No slots available in the next 14 days. Please contact{" "}
              <a href="mailto:info@techsonance.co.in" className="text-[#1155CC] underline">
                info@techsonance.co.in
              </a>
              .
            </div>
          ) : (
            <div className="relative">
              <Clock className="pointer-events-none absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
              <select
                id="booking-slot"
                {...register("slotIso", { required: "Please select an available slot" })}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-2 pl-8 text-xs focus:border-[#1155CC] focus:outline-hidden"
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
            <p className="mt-0.5 text-[10px] text-red-500">{errors.slotIso.message}</p>
          )}
        </div>

        {/* Short Message / Idea */}
        <div>
          <label
            htmlFor="booking-overview"
            className="mb-1 block text-[11px] font-medium text-slate-600"
          >
            Brief Project Overview (Optional)
          </label>
          <textarea
            id="booking-overview"
            rows={2}
            {...register("message")}
            placeholder="Tell us what you're building, key features, or any questions..."
            className="w-full resize-none rounded-lg border border-slate-200 p-2.5 text-xs focus:border-[#1155CC] focus:ring-1 focus:ring-[#1155CC] focus:outline-hidden"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting || loadingSlots}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#1155CC] to-[#008BD9] px-4 py-2.5 text-xs font-medium text-white shadow-xs transition-all hover:from-[#0D47A1] hover:to-[#0070BA] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Confirming Reservation...</span>
            </>
          ) : (
            <>
              <Calendar className="h-3.5 w-3.5" />
              <span>Confirm Free Consultation</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
