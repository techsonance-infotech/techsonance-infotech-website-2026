"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@/app/components/icons/Icon";

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

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
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
      if (wordsCount > 1000) return `Message cannot exceed 1000 words (Current: ${wordsCount}/1000).`;
    }
    return undefined;
  };

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim());
  const cleanPhoneLength = formData.phone.replace(/\D/g, "").length;
  const isPhoneValid = formData.countryCode === "+91" ? cleanPhoneLength === 10 : cleanPhoneLength >= 7;
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
    } catch (err: any) {
      setFormStatus("idle");
      showToast(err.message || "Failed to send message. Please try again.");
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
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto">
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
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-2xl mx-4 my-12 sm:my-16 bg-white rounded-3xl shadow-[0_20px_50px_rgba(17,85,204,0.18)] border border-[#1155CC]/10 overflow-hidden"
          >
            {/* Modal Header */}
            <div className="relative px-6 sm:px-10 pt-8 pb-6 border-b border-[#1155CC]/10 bg-gradient-to-br from-white to-slate-50/80">
              <button
                onClick={resetAndClose}
                className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-all"
                aria-label="Close modal"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="inline-flex items-center gap-2 bg-[#F1F5F9] border border-[#1155CC]/10 rounded-full px-4 py-1.5 mb-4">
                <span className="w-2 h-2 rounded-full bg-[#22B6F6] animate-pulse" />
                <span className="text-[10px] font-black text-[#1155CC] tracking-widest uppercase">
                  Get a Quote
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] leading-tight mb-1.5">
                Let&apos;s Build{" "}
                <span className="text-[#1155CC]">
                  Something Together
                </span>
              </h2>
              <p className="text-sm text-slate-500 font-medium">
                Tell us about your project — we&apos;ll respond within 24 hours.
              </p>
            </div>

            {/* Modal Body */}
            <div className="px-6 sm:px-10 py-8 max-h-[calc(100vh-260px)] overflow-y-auto">
              {formStatus === "success" ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-10 flex flex-col items-center justify-center min-h-[300px]"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl mb-6 shadow-sm border border-emerald-100">
                    ✓
                  </div>
                  <h3 className="text-xl font-bold text-black mb-3">Message Sent Successfully</h3>
                  <p className="text-sm text-slate-500 max-w-sm leading-relaxed mb-8">
                    Thank you for reaching out. A senior engineer will review your project details and get back to you within 24 hours.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setFormStatus("idle")}
                      className="btn-outline px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      Send another
                    </button>
                    <button
                      onClick={resetAndClose}
                      className="btn-primary px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                    >
                      Close
                    </button>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                        First Name <span className="text-red-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="John"
                        value={formData.firstName}
                        onChange={(e) => {
                          setFormData({ ...formData, firstName: e.target.value.replace(/[^a-zA-Z\s-]/g, "") });
                          setTouched((prev) => ({ ...prev, firstName: true }));
                        }}
                        onBlur={() => setTouched((prev) => ({ ...prev, firstName: true }))}
                        className={inputBaseClass("firstName")}
                      />
                      {getValidationError("firstName") && (
                        <p className="text-[10px] font-semibold text-red-500 mt-1">{getValidationError("firstName")}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                        Last Name <span className="text-red-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={(e) => {
                          setFormData({ ...formData, lastName: e.target.value.replace(/[^a-zA-Z\s-]/g, "") });
                          setTouched((prev) => ({ ...prev, lastName: true }));
                        }}
                        onBlur={() => setTouched((prev) => ({ ...prev, lastName: true }))}
                        className={inputBaseClass("lastName")}
                      />
                      {getValidationError("lastName") && (
                        <p className="text-[10px] font-semibold text-red-500 mt-1">{getValidationError("lastName")}</p>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                      Email Address <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
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
                      <p className="text-[10px] font-semibold text-red-500 mt-1">{getValidationError("email")}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                      Phone Number <span className="text-red-500 font-bold">*</span>
                    </label>
                    <div className="flex flex-row gap-2">
                      <select
                        value={formData.countryCode}
                        onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                        className="w-[90px] sm:w-[110px] px-2 sm:px-3 py-3 bg-white border border-[#1155CC]/15 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#1155CC] focus:ring-2 focus:ring-[#1155CC]/10 transition-all cursor-pointer font-medium shrink-0"
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
                        type="tel"
                        required
                        placeholder={formData.countryCode === "+91" ? "99099 12345" : "Phone number"}
                        value={formData.phone}
                        onChange={(e) => {
                          const cleanVal = e.target.value.replace(/[^0-9\s\-()]/g, "");
                          setFormData({ ...formData, phone: cleanVal });
                          setTouched((prev) => ({ ...prev, phone: true }));
                        }}
                        onBlur={() => setTouched((prev) => ({ ...prev, phone: true }))}
                        className={`flex-1 min-w-0 ${inputBaseClass("phone")}`}
                      />
                    </div>
                    {getValidationError("phone") && (
                      <p className="text-[10px] font-semibold text-red-500 mt-1">{getValidationError("phone")}</p>
                    )}
                  </div>

                  {/* Interest */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                      I&apos;m interested in
                    </label>
                    <select
                      value={formData.interest}
                      onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-[#1155CC]/15 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#1155CC] focus:ring-2 focus:ring-[#1155CC]/10 transition-all cursor-pointer font-medium"
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
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                      Message <span className="text-red-500 font-bold">*</span>
                    </label>
                    <textarea
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
                      <p className="text-[10px] font-semibold text-red-500 mt-1">{getValidationError("message")}</p>
                    )}
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={formStatus === "submitting" || !isFormValid}
                    className="btn-primary w-full px-6 py-3 rounded-xl font-semibold flex justify-center items-center gap-2 text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
                  >
                    {formStatus === "submitting" ? (
                      <>
                        <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Sending Message...
                      </>
                    ) : (
                      <>
                        Send Message
                        <Icon name="arrow" className="h-5 w-5" />
                      </>
                    )}
                  </button>
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
                className="fixed bottom-6 right-6 z-[110] bg-[#0F172A] text-white px-5 py-3 rounded-xl shadow-2xl border border-white/10 flex items-center gap-3 text-xs font-bold"
              >
                <span className="w-2 h-2 rounded-full bg-[#22B6F6] animate-pulse" />
                {toastMessage}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
}
