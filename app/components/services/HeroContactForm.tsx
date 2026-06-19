"use client";

import React, { useState } from "react";
import { Icon } from "@/app/components/icons/Icon";

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
      const msg = err instanceof Error ? err.message : "An unexpected error occurred. Please try again.";
      setErrorMessage(msg);
    }
  };

  if (formStatus === "success") {
    return (
      <div className="bg-white/80 backdrop-blur-md border border-neutral-200/80 rounded-2xl p-8 shadow-xl flex flex-col items-center justify-center text-center min-h-[450px]">
        <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center text-2xl mb-6 shadow-sm">
          ✓
        </div>
        <h3 className="text-xl font-bold text-neutral-900 mb-3">Scoping Request Sent</h3>
        <p className="text-sm text-neutral-600 max-w-sm leading-relaxed mb-8">
          Thank you! An engineering lead has received your project details and will reach out within 24 hours to schedule a free scoping call.
        </p>
        <button
          onClick={() => setFormStatus("idle")}
          className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors underline underline-offset-4"
        >
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white/95 backdrop-blur-md border-2 border-[#22B6F6] rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
      {/* Dynamic Background Accents */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="mb-6">
        <h3 className="text-lg font-bold text-neutral-900 leading-tight">Get Expert Help for Your Project</h3>
        <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
          Provide the details of your project, and our engineers will guide you from architecture to launch.
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-neutral-600 uppercase tracking-wider">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="First name"
              value={formData.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              onBlur={() => handleBlur("firstName")}
              className={`w-full px-3 py-2 bg-neutral-50/50 border ${
                validateField("firstName", formData.firstName) ? "border-red-500 focus:ring-red-100" : "border-neutral-200 focus:border-blue-500 focus:ring-blue-100"
              } rounded-lg text-sm text-neutral-900 focus:outline-none focus:ring-2 transition-all`}
            />
            {validateField("firstName", formData.firstName) && (
              <p className="text-[10px] font-medium text-red-500">{validateField("firstName", formData.firstName)}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-neutral-600 uppercase tracking-wider">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Last name"
              value={formData.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
              onBlur={() => handleBlur("lastName")}
              className={`w-full px-3 py-2 bg-neutral-50/50 border ${
                validateField("lastName", formData.lastName) ? "border-red-500 focus:ring-red-100" : "border-neutral-200 focus:border-blue-500 focus:ring-blue-100"
              } rounded-lg text-sm text-neutral-900 focus:outline-none focus:ring-2 transition-all`}
            />
            {validateField("lastName", formData.lastName) && (
              <p className="text-[10px] font-medium text-red-500">{validateField("lastName", formData.lastName)}</p>
            )}
          </div>
        </div>

        {/* Email Address */}
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-neutral-600 uppercase tracking-wider">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            placeholder="you@company.com"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            onBlur={() => handleBlur("email")}
            className={`w-full px-3 py-2 bg-neutral-50/50 border ${
              validateField("email", formData.email) ? "border-red-500 focus:ring-red-100" : "border-neutral-200 focus:border-blue-500 focus:ring-blue-100"
            } rounded-lg text-sm text-neutral-900 focus:outline-none focus:ring-2 transition-all`}
          />
          {validateField("email", formData.email) && (
            <p className="text-[10px] font-medium text-red-500">{validateField("email", formData.email)}</p>
          )}
        </div>

        {/* Phone Number */}
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-neutral-600 uppercase tracking-wider">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-row gap-2">
            <select
              value={formData.countryCode}
              onChange={(e) => handleChange("countryCode", e.target.value)}
              className="w-[90px] sm:w-[110px] px-1 sm:px-2 py-2 bg-neutral-50/50 border border-neutral-200 rounded-lg text-xs sm:text-sm text-neutral-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer shrink-0"
            >
              {COUNTRY_CODES.map((cc) => (
                <option key={cc.code} value={cc.code}>
                  {cc.flag} {cc.code}
                </option>
              ))}
            </select>
            <input
              type="tel"
              placeholder="Phone number"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value.replace(/[^\d]/g, ""))}
              onBlur={() => handleBlur("phone")}
              className={`flex-1 min-w-0 px-3 py-2 bg-neutral-50/50 border ${
                validateField("phone", formData.phone) ? "border-red-500 focus:ring-red-100" : "border-neutral-200 focus:border-blue-500 focus:ring-blue-100"
              } rounded-lg text-sm text-neutral-900 focus:outline-none focus:ring-2 transition-all`}
            />
          </div>
          {validateField("phone", formData.phone) && (
            <p className="text-[10px] font-medium text-red-500">{validateField("phone", formData.phone)}</p>
          )}
        </div>

        {/* Message */}
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-neutral-600 uppercase tracking-wider">
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            placeholder="Describe your requirements or what expert help you need..."
            value={formData.message}
            onChange={(e) => handleChange("message", e.target.value)}
            onBlur={() => handleBlur("message")}
            className={`w-full px-3 py-2 bg-neutral-50/50 border ${
              validateField("message", formData.message) ? "border-red-500 focus:ring-red-100" : "border-neutral-200 focus:border-blue-500 focus:ring-blue-100"
            } rounded-lg text-sm text-neutral-900 focus:outline-none focus:ring-2 transition-all resize-none`}
          />
          {validateField("message", formData.message) && (
            <p className="text-[10px] font-medium text-red-500">{validateField("message", formData.message)}</p>
          )}
        </div>

        {/* reCAPTCHA style custom widget */}
        <div className="flex items-center justify-between p-3.5 bg-neutral-50 border border-neutral-200/80 rounded-lg select-none">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRecaptchaClick}
              disabled={recaptchaChecked || recaptchaLoading}
              className={`w-6 h-6 border-2 rounded transition-all flex items-center justify-center cursor-pointer ${
                recaptchaChecked
                  ? "bg-green-500 border-green-600 text-white"
                  : recaptchaLoading
                  ? "border-blue-500"
                  : "border-neutral-300 hover:border-neutral-400 bg-white"
              }`}
            >
              {recaptchaChecked && "✓"}
              {recaptchaLoading && (
                <span className="w-3.5 h-3.5 rounded-full border border-blue-500 border-t-transparent animate-spin" />
              )}
            </button>
            <span className="text-xs font-medium text-neutral-700">I&apos;m not a robot</span>
          </div>
          <div className="flex flex-col items-center">
            {/* Simple reCAPTCHA Mock Icon */}
            <svg
              className="w-6 h-6 text-blue-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            <span className="text-[7px] text-neutral-400 font-bold tracking-wider mt-0.5">reCAPTCHA</span>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-600 text-center">
            {errorMessage}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={formStatus === "submitting" || !isFormValid()}
          className="btn-primary w-full px-6 py-3 rounded-xl font-semibold flex justify-center items-center gap-2 text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
        >
          {formStatus === "submitting" ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Sending...
            </>
          ) : (
            <>
              Send Message
              <Icon name="arrow" className="h-5 w-5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
