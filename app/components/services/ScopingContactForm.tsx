"use client";

import React, { useState } from "react";
import { services } from "@/data/services";
import { Button } from "@/components/ui/button";
import { trackScopingFormSubmit } from "@/lib/analytics";

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

      trackScopingFormSubmit({
        service: formData.service,
        hasCompany: Boolean(formData.company.trim()),
      });

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
      const msg =
        err instanceof Error ? err.message : "Failed to submit request. Please try again.";
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
      className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16"
    >
      {/* Left: copy + bullets */}
      <div className="flex flex-col justify-center">
        <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-[#1155CC]/10 bg-[#F1F5F9] px-4 py-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#22B6F6]" />
          <span className="text-[10px] font-black tracking-widest text-[#1155CC] uppercase">
            Contact Us
          </span>
        </div>

        <h2 className="mb-6 text-3xl leading-tight font-medium text-[#0F172A] sm:text-4xl">
          Have an idea in mind? <br />
          <span className="text-[#1155CC]">Let&apos;s build it.</span>
        </h2>

        <p className="mb-8 max-w-md text-[15px] leading-relaxed font-medium text-slate-500">
          Share your requirements and our engineers will follow up within 24 hours to schedule a
          free scoping call.
        </p>

        <ul className="space-y-4 text-[14px] font-medium text-slate-600">
          <li className="flex items-center gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#1155CC]/10 bg-[#F1F5F9] text-xs font-bold text-[#1155CC]">
              ✓
            </span>
            Response within 24 hours
          </li>
          <li className="flex items-center gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#1155CC]/10 bg-[#F1F5F9] text-xs font-bold text-[#1155CC]">
              ✓
            </span>
            Free scoping call with a senior engineer
          </li>
          <li className="flex items-center gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#1155CC]/10 bg-[#F1F5F9] text-xs font-bold text-[#1155CC]">
              ✓
            </span>
            NDA available on request
          </li>
        </ul>
      </div>

      {/* Right: form */}
      <div className="relative">
        {/* Decorative background glow behind form */}
        <div className="pointer-events-none absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#1155CC]/10 to-[#22B6F6]/10 opacity-30 blur-xl" />

        <div className="relative rounded-2xl p-6 shadow-[0_8px_32px_rgba(17,85,204,0.08)] sm:p-8">
          {formStatus === "success" ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl bg-[#F8FAFE] p-8 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#1155CC]/10 bg-[#F1F5F9] text-lg font-bold text-[#1155CC]">
                ✓
              </div>
              <h3 className="mb-2 text-lg font-medium text-[#0F172A]">Request Submitted</h3>
              <p className="mb-6 max-w-xs text-sm leading-relaxed text-slate-500">
                A tech lead will review your submission and connect with you shortly.
              </p>
              <button
                onClick={() => setFormStatus("idle")}
                className="cursor-pointer text-sm font-bold text-[#1155CC] underline-offset-4 hover:underline"
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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label
                    htmlFor="scoping-name"
                    className="block text-[11px] font-bold tracking-wide text-slate-500 uppercase"
                  >
                    Name <span className="font-bold text-red-500">*</span>
                  </label>
                  <input
                    id="scoping-name"
                    type="text"
                    required
                    placeholder="Your name"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        name: e.target.value.replace(/[^a-zA-Z\s-]/g, ""),
                      });
                      setTouched((prev) => ({ ...prev, name: true }));
                    }}
                    onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
                    className={inputBaseClass("name")}
                  />
                  {getValidationError("name") && (
                    <p className="mt-1 text-[10px] font-semibold text-red-500">
                      {getValidationError("name")}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="scoping-email"
                    className="block text-[11px] font-bold tracking-wide text-slate-500 uppercase"
                  >
                    Email <span className="font-bold text-red-500">*</span>
                  </label>
                  <input
                    id="scoping-email"
                    type="email"
                    required
                    placeholder="you@company.com"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      setTouched((prev) => ({ ...prev, email: true }));
                    }}
                    onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                    className={inputBaseClass("email")}
                  />
                  {getValidationError("email") && (
                    <p className="mt-1 text-[10px] font-semibold text-red-500">
                      {getValidationError("email")}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="scoping-company"
                  className="block text-[11px] font-bold tracking-wide text-slate-500 uppercase"
                >
                  Company
                </label>
                <input
                  id="scoping-company"
                  type="text"
                  placeholder="Company name"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full rounded-xl border border-[#1155CC]/15 bg-white px-4 py-3 text-sm text-slate-900 transition-all focus:border-[#1155CC] focus:ring-2 focus:ring-[#1155CC]/10 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="scoping-service"
                  className="block text-[11px] font-bold tracking-wide text-slate-500 uppercase"
                >
                  Service
                </label>
                <select
                  id="scoping-service"
                  value={formData.service}
                  onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                  className="w-full cursor-pointer rounded-xl border border-[#1155CC]/15 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition-all focus:border-[#1155CC] focus:ring-2 focus:ring-[#1155CC]/10 focus:outline-none"
                >
                  {services.map((s) => (
                    <option key={s.slug} value={s.title} className="bg-white">
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="scoping-message"
                  className="block text-[11px] font-bold tracking-wide text-slate-500 uppercase"
                >
                  Message <span className="font-bold text-red-500">*</span>
                </label>
                <textarea
                  id="scoping-message"
                  required
                  rows={4}
                  placeholder="Tell us about your project..."
                  value={formData.message}
                  onChange={(e) => {
                    setFormData({ ...formData, message: e.target.value });
                    setTouched((prev) => ({ ...prev, message: true }));
                  }}
                  onBlur={() => setTouched((prev) => ({ ...prev, message: true }))}
                  className={`${inputBaseClass("message")} resize-none`}
                />
                {getValidationError("message") && (
                  <p className="mt-1 text-[10px] font-semibold text-red-500">
                    {getValidationError("message")}
                  </p>
                )}
              </div>

              {errorMessage && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-center text-xs font-semibold text-red-500">
                  {errorMessage}
                </div>
              )}

              <Button
                type="submit"
                disabled={formStatus === "submitting" || !isFormValid}
                variant="primary"
                showArrow={formStatus !== "submitting"}
                className="w-full"
              >
                {formStatus === "submitting" ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Submitting...
                  </>
                ) : (
                  "Submit Scoping Request"
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );

  if (embedded) return formContent;

  return (
    <section className="rounded-3xl border-2 border-[#22B6F6] bg-white p-6 shadow-[0_20px_50px_rgba(17,85,204,0.12)] sm:p-10 lg:p-12">
      {formContent}
    </section>
  );
}
