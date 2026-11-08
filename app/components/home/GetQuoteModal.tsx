"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";

interface GetQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GetQuoteModal({ isOpen, onClose }: GetQuoteModalProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    countryCode: "+91",
    phone: "",
    interest: "Web Development",
    message: "",
    website: "", // Honeypot
  });

  const [touched, setTouched] = useState<{
    firstName?: boolean;
    lastName?: boolean;
    email?: boolean;
    phone?: boolean;
    message?: boolean;
  }>({});

  const [formStatus, setFormStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const bodyRef = React.useRef<HTMLDivElement>(null);

  // Lock body scroll and pause Lenis when modal is open
  useEffect(() => {
    const lenis = (window as unknown as { __lenis?: { start: () => void; stop: () => void } })
      .__lenis;
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      lenis?.stop();
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      lenis?.start();
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      lenis?.start();
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const getValidationError = (field: string) => {
    if (!touched[field as keyof typeof touched]) return undefined;

    if (field === "firstName") {
      if (!formData.firstName.trim()) return "First name is required.";
    }
    if (field === "lastName") {
      if (!formData.lastName.trim()) return "Last name is required.";
    }
    if (field === "email") {
      if (!formData.email.trim()) return "Email address is required.";
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) return "Please enter a valid email address.";
    }
    if (field === "phone") {
      if (!formData.phone.trim()) return "Phone number is required.";
      const cleanPhone = formData.phone.replace(/\D/g, "");
      if (formData.countryCode === "+91") {
        if (cleanPhone.length !== 10) return "Please enter a valid 10-digit Indian phone number.";
      } else {
        if (cleanPhone.length < 7) return "Please enter a valid phone number (min 7 digits).";
      }
    }
    if (field === "message") {
      if (!formData.message.trim()) return "Message is required.";
      const wordsCount = formData.message.trim().split(/\s+/).filter(Boolean).length;
      if (wordsCount > 1000)
        return `Message cannot exceed 1000 words (Current: ${wordsCount}/1000).`;
    }
    return undefined;
  };

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim());
  const cleanPhoneLength = formData.phone.replace(/\D/g, "").length;
  const isPhoneValid =
    formData.countryCode === "+91" ? cleanPhoneLength === 10 : cleanPhoneLength >= 7;
  const messageWordsCount = formData.message.trim().split(/\s+/).filter(Boolean).length;
  const isMessageValid = messageWordsCount > 0 && messageWordsCount <= 1000;

  const isFormValid =
    !!formData.firstName.trim() &&
    !!formData.lastName.trim() &&
    !!formData.email.trim() &&
    !!formData.phone.trim() &&
    !!formData.message.trim() &&
    isEmailValid &&
    isPhoneValid &&
    isMessageValid;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      showToast("Please correct the errors in the form.");
      return;
    }

    setFormStatus("submitting");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Something went wrong.");
      }

      setFormStatus("success");
      showToast("Message sent! We'll be in touch within 24 hours.");
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        countryCode: "+91",
        phone: "",
        interest: "Web Development",
        message: "",
        website: "",
      });
      setTouched({});
    } catch (err: unknown) {
      setFormStatus("idle");
      const errorMessage =
        err instanceof Error ? err.message : "Failed to send message. Please try again.";
      showToast(errorMessage);
    }
  };

  const resetAndClose = () => {
    setFormStatus("idle");
    setTouched({});
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      countryCode: "+91",
      phone: "",
      interest: "Web Development",
      message: "",
      website: "",
    });
    onClose();
  };

  const inputBaseClass = (field: string) =>
    `w-full px-4 py-3 bg-white border ${
      getValidationError(field)
        ? "border-red-500 focus:border-red-500 focus:ring-red-500/10"
        : "border-[#1155CC]/15 focus:border-[#1155CC] focus:ring-[#1155CC]/10"
    } rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 transition-all`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          data-lenis-prevent
          data-lenis-prevent-wheel
          data-lenis-prevent-touch
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-3 sm:p-6"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={resetAndClose}
          />

          {/* Modal panel */}
          <motion.div
            initial={{ opacity: 0, y: 25, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            data-lenis-prevent
            data-lenis-prevent-wheel
            data-lenis-prevent-touch
            className="relative z-10 my-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-[#1155CC]/10 bg-white shadow-[0_25px_60px_rgba(17,85,204,0.18)] sm:max-h-[calc(100dvh-3.5rem)]"
          >
            {/* Modal Header */}
            <div
              onWheel={(e) => {
                if (bodyRef.current) {
                  bodyRef.current.scrollTop += e.deltaY;
                }
              }}
              className="relative shrink-0 border-b border-[#1155CC]/10 bg-gradient-to-br from-white to-slate-50/80 px-6 pt-7 pb-5 sm:px-10 sm:pt-8 sm:pb-6"
            >
              <button
                onClick={resetAndClose}
                className="absolute top-4 right-4 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all hover:bg-slate-200 hover:text-slate-800 sm:top-5 sm:right-5"
                aria-label="Close modal"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#1155CC]/10 bg-[#F1F5F9] px-4 py-1.5 sm:mb-4">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#22B6F6]" />
                <span className="text-[10px] font-black tracking-widest text-[#1155CC] uppercase">
                  Get a Quote
                </span>
              </div>

              <h2 className="mb-1.5 text-2xl leading-tight font-medium text-[#0F172A] sm:text-3xl">
                Let&apos;s Build <span className="text-[#1155CC]">Something Together</span>
              </h2>
              <p className="text-xs font-medium text-slate-500 sm:text-sm">
                Tell us about your project - we&apos;ll respond within 24 hours.
              </p>
            </div>

            {/* Modal Body */}
            <div
              ref={bodyRef}
              data-lenis-prevent
              data-lenis-prevent-wheel
              data-lenis-prevent-touch
              className="modal-scrollbar flex-1 overflow-y-auto overscroll-contain px-6 py-6 sm:px-10 sm:py-8"
            >
              {formStatus === "success" ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex min-h-[300px] flex-col items-center justify-center py-10 text-center"
                >
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-2xl text-emerald-600 shadow-sm">
                    ✓
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-black">Message Sent Successfully</h3>
                  <p className="mb-8 max-w-sm text-sm leading-relaxed text-slate-500">
                    Thank you for reaching out. A senior engineer will review your project details
                    and get back to you within 24 hours.
                  </p>
                  <div className="flex gap-3">
                    <Button onClick={() => setFormStatus("idle")} variant="secondary" size="sm">
                      Send another
                    </Button>
                    <Button onClick={resetAndClose} variant="primary" size="sm">
                      Close
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-5">
                  {/* Honeypot */}
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

                  {/* First Name & Last Name */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="quote-firstName"
                        className="block text-[11px] font-semibold tracking-wide text-slate-500 uppercase"
                      >
                        First Name <span className="font-bold text-red-500">*</span>
                      </label>
                      <input
                        id="quote-firstName"
                        type="text"
                        required
                        placeholder="John"
                        value={formData.firstName}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            firstName: e.target.value.replace(/[^a-zA-Z\s-]/g, ""),
                          });
                          setTouched((prev) => ({ ...prev, firstName: true }));
                        }}
                        onBlur={() => setTouched((prev) => ({ ...prev, firstName: true }))}
                        className={inputBaseClass("firstName")}
                      />
                      {getValidationError("firstName") && (
                        <p className="mt-1 text-[10px] font-semibold text-red-500">
                          {getValidationError("firstName")}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="quote-lastName"
                        className="block text-[11px] font-semibold tracking-wide text-slate-500 uppercase"
                      >
                        Last Name <span className="font-bold text-red-500">*</span>
                      </label>
                      <input
                        id="quote-lastName"
                        type="text"
                        required
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            lastName: e.target.value.replace(/[^a-zA-Z\s-]/g, ""),
                          });
                          setTouched((prev) => ({ ...prev, lastName: true }));
                        }}
                        onBlur={() => setTouched((prev) => ({ ...prev, lastName: true }))}
                        className={inputBaseClass("lastName")}
                      />
                      {getValidationError("lastName") && (
                        <p className="mt-1 text-[10px] font-semibold text-red-500">
                          {getValidationError("lastName")}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="quote-email"
                      className="block text-[11px] font-semibold tracking-wide text-slate-500 uppercase"
                    >
                      Email Address <span className="font-bold text-red-500">*</span>
                    </label>
                    <input
                      id="quote-email"
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

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="quote-phone"
                      className="block text-[11px] font-semibold tracking-wide text-slate-500 uppercase"
                    >
                      Phone Number <span className="font-bold text-red-500">*</span>
                    </label>
                    <div className="flex flex-row gap-2">
                      <select
                        aria-label="Country Code"
                        value={formData.countryCode}
                        onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                        className="w-[90px] shrink-0 cursor-pointer rounded-xl border border-[#1155CC]/15 bg-white px-2 py-3 text-xs font-medium text-slate-900 transition-all focus:border-[#1155CC] focus:ring-2 focus:ring-[#1155CC]/10 focus:outline-none sm:w-[110px] sm:px-3 sm:text-sm"
                      >
                        <option value="+91">🇮🇳 +91</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+971">🇦🇪 +971</option>
                        <option value="+61">🇦🇺 +61</option>
                        <option value="+65">🇸🇬 +65</option>
                        <option value="+49">🇩🇪 +49</option>
                      </select>
                      <input
                        id="quote-phone"
                        type="tel"
                        required
                        placeholder={
                          formData.countryCode === "+91" ? "99099 12345" : "Phone number"
                        }
                        value={formData.phone}
                        onChange={(e) => {
                          const cleanVal = e.target.value.replace(/[^0-9\s\-()]/g, "");
                          setFormData({ ...formData, phone: cleanVal });
                          setTouched((prev) => ({ ...prev, phone: true }));
                        }}
                        onBlur={() => setTouched((prev) => ({ ...prev, phone: true }))}
                        className={`min-w-0 flex-1 ${inputBaseClass("phone")}`}
                      />
                    </div>
                    {getValidationError("phone") && (
                      <p className="mt-1 text-[10px] font-semibold text-red-500">
                        {getValidationError("phone")}
                      </p>
                    )}
                  </div>

                  {/* Interest */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="quote-interest"
                      className="block text-[11px] font-semibold tracking-wide text-slate-500 uppercase"
                    >
                      I&apos;m interested in
                    </label>
                    <select
                      id="quote-interest"
                      value={formData.interest}
                      onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                      className="w-full cursor-pointer rounded-xl border border-[#1155CC]/15 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition-all focus:border-[#1155CC] focus:ring-2 focus:ring-[#1155CC]/10 focus:outline-none"
                    >
                      <option value="Web Development">Web Development</option>
                      <option value="Mobile App">Mobile App</option>
                      <option value="SaaS Product">SaaS Product</option>
                      <option value="AI / Automation">AI / Automation</option>
                      <option value="UI/UX Design">UI/UX Design</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Message */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="quote-message"
                      className="block text-[11px] font-semibold tracking-wide text-slate-500 uppercase"
                    >
                      Message <span className="font-bold text-red-500">*</span>
                    </label>
                    <textarea
                      id="quote-message"
                      required
                      rows={4}
                      placeholder="Tell us about your project goals, requirements, or timeline..."
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

                  {/* Submit */}
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
                        Sending Message...
                      </>
                    ) : (
                      "Send Message"
                    )}
                  </Button>
                </form>
              )}
            </div>
          </motion.div>

          {/* Toast notification inside modal */}
          <AnimatePresence>
            {toastMessage && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed right-6 bottom-6 z-[110] flex items-center gap-3 rounded-xl border border-white/10 bg-[#0F172A] px-5 py-3 text-xs font-bold text-white shadow-2xl"
              >
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#22B6F6]" />
                {toastMessage}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
}
