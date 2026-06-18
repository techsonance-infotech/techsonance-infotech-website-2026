"use client";

import React, { useState } from "react";
import { services } from "@/data/services";
import { Icon } from "@/app/components/icons/Icon";

export default function ScopingContactForm({
  defaultService,
  embedded = false,
}: {
  defaultService?: string;
  embedded?: boolean;
}) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    service: defaultService || "AI Automation Solutions",
    message: "",
    website: "", // Honeypot field
  });
  const [touched, setTouched] = useState<{
    name?: boolean;
    email?: boolean;
    message?: boolean;
  }>({});
  const [formStatus, setFormStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getValidationError = (field: string) => {
    if (!touched[field as keyof typeof touched]) return undefined;

    if (field === "name") {
      if (!formData.name.trim()) return "Name is required.";
    }
    if (field === "email") {
      if (!formData.email.trim()) {
        return "Email is required.";
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        return "Please enter a valid email address (e.g. name@domain.com).";
      }
    }
    if (field === "message") {
      if (!formData.message.trim()) {
        return "Message is required.";
      }
      const wordsCount = formData.message.trim().split(/\s+/).filter(Boolean).length;
      if (wordsCount > 1000) {
        return `Message cannot exceed 1000 words (Current: ${wordsCount}/1000).`;
      }
    }
    return undefined;
  };

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim());
  const messageWordsCount = formData.message.trim().split(/\s+/).filter(Boolean).length;
  const isMessageValid = messageWordsCount > 0 && messageWordsCount <= 1000;

  const isFormValid =
    !!formData.name.trim() &&
    !!formData.email.trim() &&
    !!formData.message.trim() &&
    isEmailValid &&
    isMessageValid;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      setErrorMessage("Please correct the errors in the form.");
      return;
    }

    setFormStatus("submitting");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to submit form.");
      }

      setFormStatus("success");
      setFormData({
        name: "",
        email: "",
        company: "",
        service: defaultService || "AI Automation Solutions",
        message: "",
        website: "",
      });
      setTouched({});
    } catch (err: unknown) {
      setFormStatus("idle");
      const msg = err instanceof Error ? err.message : "Failed to submit request. Please try again.";
      setErrorMessage(msg);
    }
  };

  const inputBaseClass = (field: string) =>
    `w-full px-4 py-3 bg-white border ${
      getValidationError(field)
        ? "border-red-500 focus:border-red-500 focus:ring-red-500/10"
        : "border-[#1155CC]/15 focus:border-[#1155CC] focus:ring-[#1155CC]/10"
    } rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 transition-all`;

  const formContent = (
    <div
      id={embedded ? undefined : "contact"}
      className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center"
    >
      {/* Left: copy + bullets */}
      <div className="flex flex-col justify-center">
        <div className="inline-flex items-center gap-2 bg-[#F1F5F9] border border-[#1155CC]/10 rounded-full px-4 py-1.5 mb-6 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22B6F6] animate-pulse" />
          <span className="text-[10px] font-black text-[#1155CC] tracking-widest uppercase">Contact Us</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] mb-6 leading-tight">
          Have an idea in mind? <br />
          <span className="text-[#1155CC]">Let&apos;s build it.</span>
        </h2>
        
        <p className="text-[15px] text-slate-500 font-medium leading-relaxed mb-8 max-w-md">
          Share your requirements and our engineers will follow up within 24 hours to schedule a free scoping call.
        </p>
        
        <ul className="space-y-4 text-[14px] text-slate-650 font-medium">
          <li className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-[#F1F5F9] text-[#1155CC] flex items-center justify-center shrink-0 font-bold text-xs border border-[#1155CC]/10">
              ✓
            </span>
            Response within 24 hours
          </li>
          <li className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-[#F1F5F9] text-[#1155CC] flex items-center justify-center shrink-0 font-bold text-xs border border-[#1155CC]/10">
              ✓
            </span>
            Free scoping call with a senior engineer
          </li>
          <li className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-[#F1F5F9] text-[#1155CC] flex items-center justify-center shrink-0 font-bold text-xs border border-[#1155CC]/10">
              ✓
            </span>
            NDA available on request
          </li>
        </ul>
      </div>

      {/* Right: form */}
      <div className="relative">
        {/* Decorative background glow behind form */}
        <div className="absolute -inset-1 bg-gradient-to-r from-[#1155CC]/10 to-[#22B6F6]/10 rounded-2xl blur-xl opacity-30 pointer-events-none" />

        <div className="relative rounded-2xl p-6 sm:p-8 shadow-[0_8px_32px_rgba(17,85,204,0.08)]">
          {formStatus === "success" ? (
            <div className="bg-[#F8FAFE] rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[360px]">
              <div className="w-12 h-12 rounded-full bg-[#F1F5F9] text-[#1155CC] flex items-center justify-center text-lg mb-4 font-bold border border-[#1155CC]/10">
                ✓
              </div>
              <h3 className="text-lg font-extrabold text-[#0F172A] mb-2">Request Submitted</h3>
              <p className="text-sm text-slate-500 max-w-xs leading-relaxed mb-6">
                A tech lead will review your submission and connect with you shortly.
              </p>
              <button
                onClick={() => setFormStatus("idle")}
                className="text-sm font-bold text-[#1155CC] hover:underline underline-offset-4 cursor-pointer"
              >
                Submit another request
              </button>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Honeypot field to trap spam bots */}
              <div style={{ display: "none" }} aria-hidden="true">
                <input
                  type="text"
                  name="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    Name <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Your name"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value.replace(/[^a-zA-Z\s-]/g, "") });
                      setTouched(prev => ({ ...prev, name: true }));
                    }}
                    onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
                    className={inputBaseClass("name")}
                  />
                  {getValidationError("name") && (
                    <p className="text-[10px] font-semibold text-red-500 mt-1">{getValidationError("name")}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    Email <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="you@company.com"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      setTouched(prev => ({ ...prev, email: true }));
                    }}
                    onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                    className={inputBaseClass("email")}
                  />
                  {getValidationError("email") && (
                    <p className="text-[10px] font-semibold text-red-500 mt-1">{getValidationError("email")}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                  Company
                </label>
                <input
                  type="text"
                  placeholder="Company name"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-[#1155CC]/15 focus:border-[#1155CC] focus:ring-[#1155CC]/10 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                  Service
                </label>
                <select
                  value={formData.service}
                  onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-[#1155CC]/15 focus:border-[#1155CC] focus:ring-[#1155CC]/10 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 transition-all cursor-pointer font-medium"
                >
                  {services.map((s) => (
                    <option key={s.slug} value={s.title} className="bg-white">
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                  Message <span className="text-red-500 font-bold">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Tell us about your project..."
                  value={formData.message}
                  onChange={(e) => {
                    setFormData({ ...formData, message: e.target.value });
                    setTouched(prev => ({ ...prev, message: true }));
                  }}
                  onBlur={() => setTouched(prev => ({ ...prev, message: true }))}
                  className={`${inputBaseClass("message")} resize-none`}
                />
                {getValidationError("message") && (
                  <p className="text-[10px] font-semibold text-red-500 mt-1">{getValidationError("message")}</p>
                )}
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs font-semibold text-red-500 text-center">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={formStatus === "submitting" || !isFormValid}
                className="btn-primary w-full px-6 py-3 rounded-xl font-semibold flex justify-center items-center gap-2 text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
              >
                {formStatus === "submitting" ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Scoping Request
                    <Icon name="arrow" className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );

  if (embedded) return formContent;

  return (
    <section className="bg-white border-2 border-[#22B6F6] shadow-[0_20px_50px_rgba(17,85,204,0.12)] rounded-3xl p-6 sm:p-10 lg:p-12">
      {formContent}
    </section>
  );
}
