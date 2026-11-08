"use client";

import React, { useState } from "react";
import { Icon } from "@/app/components/icons/Icon";
import { Button } from "@/components/ui/button";

interface HeroContactFormProps {
  serviceName: string;
}

const COUNTRY_CODES = [
  { code: "+91", name: "India", flag: "🇮🇳" },
  { code: "+1", name: "United States", flag: "🇺🇸" },
  { code: "+44", name: "United Kingdom", flag: "🇬🇧" },
  { code: "+61", name: "Australia", flag: "🇦🇺" },
  { code: "+65", name: "Singapore", flag: "🇸🇬" },
  { code: "+971", name: "UAE", flag: "🇦🇪" },
];

export default function HeroContactForm({ serviceName }: HeroContactFormProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    countryCode: "+91",
    phone: "",
    message: "",
    interest: serviceName,
    website: "", // Honeypot field
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [recaptchaChecked, setRecaptchaChecked] = useState(false);
  const [recaptchaLoading, setRecaptchaLoading] = useState(false);
  const [formStatus, setFormStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validateField = (name: string, value: string) => {
    if (!touched[name]) return "";

    switch (name) {
      case "firstName":
        if (!value.trim()) return "First name is required.";
        if (/[^a-zA-Z\s-]/.test(value)) return "Only letters are allowed.";
        break;
      case "lastName":
        if (!value.trim()) return "Last name is required.";
        if (/[^a-zA-Z\s-]/.test(value)) return "Only letters are allowed.";
        break;
      case "email":
        if (!value.trim()) return "Email address is required.";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return "Enter a valid email address.";
        break;
      case "phone":
        if (!value.trim()) return "Phone number is required.";
        const cleanPhone = value.replace(/\D/g, "");
        if (formData.countryCode === "+91") {
          if (cleanPhone.length !== 10) return "Must be exactly 10 digits.";
        } else {
          if (cleanPhone.length < 7) return "Must be a valid phone number.";
        }
        break;
      case "message":
        if (!value.trim()) return "Message is required.";
        const words = value.trim().split(/\s+/).filter(Boolean).length;
        if (words > 1000) return `Cannot exceed 1000 words (${words}/1000).`;
        break;
    }
    return "";
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.email.trim() ||
      !formData.phone.trim() ||
      !formData.message.trim() ||
      !recaptchaChecked
    ) {
      return false;
    }

    const fields = ["firstName", "lastName", "email", "phone", "message"];
    for (const f of fields) {
      if (validateField(f, formData[f as keyof typeof formData])) {
        return false;
      }
    }
    return true;
  };

  const handleRecaptchaClick = () => {
    if (recaptchaChecked || recaptchaLoading) return;
    setRecaptchaLoading(true);
    setTimeout(() => {
      setRecaptchaLoading(false);
      setRecaptchaChecked(true);
    }, 1200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all as touched
    const allTouched: Record<string, boolean> = {};
    Object.keys(formData).forEach((k) => {
      allTouched[k] = true;
    });
    setTouched(allTouched);

    if (!isFormValid()) {
      setErrorMessage("Please fill out all required fields correctly and pass the reCAPTCHA.");
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
        const data = await res.json();
        throw new Error(data.error || "Failed to submit request.");
      }

      setFormStatus("success");
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        countryCode: "+91",
        phone: "",
        message: "",
        interest: serviceName,
        website: "",
      });
      setTouched({});
      setRecaptchaChecked(false);
    } catch (err: unknown) {
      setFormStatus("idle");
      const msg =
        err instanceof Error ? err.message : "An unexpected error occurred. Please try again.";
      setErrorMessage(msg);
    }
  };

  if (formStatus === "success") {
    return (
      <div className="flex min-h-[450px] flex-col items-center justify-center rounded-2xl border border-neutral-200/80 bg-white/80 p-8 text-center shadow-xl backdrop-blur-md">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-2xl text-blue-600 shadow-sm">
          ✓
        </div>
        <h3 className="mb-3 text-xl font-bold text-neutral-900">Scoping Request Sent</h3>
        <p className="mb-8 max-w-sm text-sm leading-relaxed text-neutral-600">
          Thank you! An engineering lead has received your project details and will reach out within
          24 hours to schedule a free scoping call.
        </p>
        <button
          onClick={() => setFormStatus("idle")}
          className="text-sm font-semibold text-blue-600 underline underline-offset-4 transition-colors hover:text-blue-700"
        >
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-[#22B6F6] bg-white/95 p-6 shadow-xl backdrop-blur-md sm:p-8">
      {/* Dynamic Background Accents */}
      <div className="pointer-events-none absolute top-0 right-0 h-32 w-32 rounded-full bg-blue-500/5 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-32 w-32 rounded-full bg-cyan-500/5 blur-3xl" />

      <div className="mb-6">
        <h3 className="text-lg leading-tight font-bold text-neutral-900">
          Get Expert Help for Your Project
        </h3>
        <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">
          Provide the details of your project, and our engineers will guide you from architecture to
          launch.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Honeypot */}
        <div style={{ display: "none" }} aria-hidden="true">
          <input
            type="text"
            name="website"
            value={formData.website}
            onChange={(e) => handleChange("website", e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        {/* First & Last Name */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="hero-firstName" className="block text-[11px] font-semibold tracking-wider text-neutral-600 uppercase">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              id="hero-firstName"
              type="text"
              placeholder="First name"
              value={formData.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              onBlur={() => handleBlur("firstName")}
              className={`w-full border bg-neutral-50/50 px-3 py-2 ${
                validateField("firstName", formData.firstName)
                  ? "border-red-500 focus:ring-red-100"
                  : "border-neutral-200 focus:border-blue-500 focus:ring-blue-100"
              } rounded-lg text-sm text-neutral-900 transition-all focus:ring-2 focus:outline-none`}
            />
            {validateField("firstName", formData.firstName) && (
              <p className="text-[10px] font-medium text-red-500">
                {validateField("firstName", formData.firstName)}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="hero-lastName" className="block text-[11px] font-semibold tracking-wider text-neutral-600 uppercase">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              id="hero-lastName"
              type="text"
              placeholder="Last name"
              value={formData.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
              onBlur={() => handleBlur("lastName")}
              className={`w-full border bg-neutral-50/50 px-3 py-2 ${
                validateField("lastName", formData.lastName)
                  ? "border-red-500 focus:ring-red-100"
                  : "border-neutral-200 focus:border-blue-500 focus:ring-blue-100"
              } rounded-lg text-sm text-neutral-900 transition-all focus:ring-2 focus:outline-none`}
            />
            {validateField("lastName", formData.lastName) && (
              <p className="text-[10px] font-medium text-red-500">
                {validateField("lastName", formData.lastName)}
              </p>
            )}
          </div>
        </div>

        {/* Email Address */}
        <div className="space-y-1">
          <label htmlFor="hero-email" className="block text-[11px] font-semibold tracking-wider text-neutral-600 uppercase">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            id="hero-email"
            type="email"
            placeholder="you@company.com"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            onBlur={() => handleBlur("email")}
            className={`w-full border bg-neutral-50/50 px-3 py-2 ${
              validateField("email", formData.email)
                ? "border-red-500 focus:ring-red-100"
                : "border-neutral-200 focus:border-blue-500 focus:ring-blue-100"
            } rounded-lg text-sm text-neutral-900 transition-all focus:ring-2 focus:outline-none`}
          />
          {validateField("email", formData.email) && (
            <p className="text-[10px] font-medium text-red-500">
              {validateField("email", formData.email)}
            </p>
          )}
        </div>

        {/* Phone Number */}
        <div className="space-y-1">
          <label htmlFor="hero-phone" className="block text-[11px] font-semibold tracking-wider text-neutral-600 uppercase">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-row gap-2">
            <select
              aria-label="Country code"
              value={formData.countryCode}
              onChange={(e) => handleChange("countryCode", e.target.value)}
              className="w-[90px] shrink-0 cursor-pointer rounded-lg border border-neutral-200 bg-neutral-50/50 px-1 py-2 text-xs text-neutral-900 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none sm:w-[110px] sm:px-2 sm:text-sm"
            >
              {COUNTRY_CODES.map((cc) => (
                <option key={cc.code} value={cc.code}>
                  {cc.flag} {cc.code}
                </option>
              ))}
            </select>
            <input
              id="hero-phone"
              type="tel"
              placeholder="Phone number"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value.replace(/[^\d]/g, ""))}
              onBlur={() => handleBlur("phone")}
              className={`min-w-0 flex-1 border bg-neutral-50/50 px-3 py-2 ${
                validateField("phone", formData.phone)
                  ? "border-red-500 focus:ring-red-100"
                  : "border-neutral-200 focus:border-blue-500 focus:ring-blue-100"
              } rounded-lg text-sm text-neutral-900 transition-all focus:ring-2 focus:outline-none`}
            />
          </div>
          {validateField("phone", formData.phone) && (
            <p className="text-[10px] font-medium text-red-500">
              {validateField("phone", formData.phone)}
            </p>
          )}
        </div>

        {/* Message */}
        <div className="space-y-1">
          <label htmlFor="hero-message" className="block text-[11px] font-semibold tracking-wider text-neutral-600 uppercase">
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            id="hero-message"
            rows={3}
            placeholder="Describe your requirements or what expert help you need..."
            value={formData.message}
            onChange={(e) => handleChange("message", e.target.value)}
            onBlur={() => handleBlur("message")}
            className={`w-full border bg-neutral-50/50 px-3 py-2 ${
              validateField("message", formData.message)
                ? "border-red-500 focus:ring-red-100"
                : "border-neutral-200 focus:border-blue-500 focus:ring-blue-100"
            } resize-none rounded-lg text-sm text-neutral-900 transition-all focus:ring-2 focus:outline-none`}
          />
          {validateField("message", formData.message) && (
            <p className="text-[10px] font-medium text-red-500">
              {validateField("message", formData.message)}
            </p>
          )}
        </div>

        {/* reCAPTCHA style custom widget */}
        <div className="flex items-center justify-between rounded-lg border border-neutral-200/80 bg-neutral-50 p-3.5 select-none">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRecaptchaClick}
              disabled={recaptchaChecked || recaptchaLoading}
              className={`flex h-6 w-6 cursor-pointer items-center justify-center rounded border-2 transition-all ${
                recaptchaChecked
                  ? "bg-green-500 border-green-600 text-white"
                  : recaptchaLoading
                    ? "border-blue-500"
                    : "border-neutral-300 hover:border-neutral-400 bg-white"
              }`}
            >
              {recaptchaChecked && "✓"}
              {recaptchaLoading && (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border border-blue-500 border-t-transparent" />
              )}
            </button>
            <span className="text-xs font-medium text-neutral-700">I&apos;m not a robot</span>
          </div>
          <div className="flex flex-col items-center">
            {/* Simple reCAPTCHA Mock Icon */}
            <svg
              className="h-6 w-6 text-blue-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            <span className="mt-0.5 text-[7px] font-bold tracking-wider text-neutral-400">
              reCAPTCHA
            </span>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center text-xs font-semibold text-red-600">
            {errorMessage}
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={formStatus === "submitting" || !isFormValid()}
          variant="primary"
          showArrow={formStatus !== "submitting"}
          className="w-full"
        >
          {formStatus === "submitting" ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Sending...
            </>
          ) : (
            "Send Message"
          )}
        </Button>
      </form>
    </div>
  );
}
