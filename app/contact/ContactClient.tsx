"use client";

import React, { useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "motion/react";
import SiteHeader from "@/app/components/home/SiteHeader";
import SiteFooter from "@/app/components/home/SiteFooter";
import { Icon } from "@/app/components/icons/Icon";
import BookConsultationModal from "@/app/components/home/BookConsultationModal";
import { ElegantShape } from "@/components/ui/shape-landing-hero";
import { Button } from "@/components/ui/button";
import { trackContactFormSubmit } from "@/lib/analytics";

function subscribeResize(callback: () => void) {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}

function getIsMobileSnapshot() {
  return window.innerWidth < 768;
}

function getServerIsMobileSnapshot() {
  return false;
}

export default function ContactClient() {
  const isMobile = useSyncExternalStore(
    subscribeResize,
    getIsMobileSnapshot,
    getServerIsMobileSnapshot,
  );

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    countryCode: "+91",
    phone: "",
    interest: "Web Development",
    message: "",
    website: "", // Honeypot field to trap spam bots
  });

  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  const [touched, setTouched] = useState<{
    firstName?: boolean;
    lastName?: boolean;
    email?: boolean;
    phone?: boolean;
    message?: boolean;
  }>({});

  const [formStatus, setFormStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
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
      if (!formData.email.trim()) {
        return "Email address is required.";
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        return "Please enter a valid email address (e.g. name@domain.com).";
      }
    }
    if (field === "phone") {
      if (!formData.phone.trim()) {
        return "Phone number is required.";
      }
      const cleanPhone = formData.phone.replace(/\D/g, "");
      if (formData.countryCode === "+91") {
        if (cleanPhone.length !== 10) return "Please enter a valid 10-digit Indian phone number.";
      } else {
        if (cleanPhone.length < 7) return "Please enter a valid phone number (min 7 digits).";
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Something went wrong.");
      }

      trackContactFormSubmit({
        service: formData.interest,
        subject: "Direct Contact Form",
      });

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
      const msg = err instanceof Error ? err.message : "Failed to send message. Please try again.";
      showToast(msg);
    }
  };

  return (
    <>
      <SiteHeader transparent={true} />
      <main className="relative min-h-screen overflow-x-clip bg-[#FAFBFD] font-sans text-slate-900">
        {/* Ambient background decoration */}
        <div className="pointer-events-none absolute top-20 right-0 h-[300px] w-[300px] rounded-full bg-gradient-to-bl from-blue-100/30 to-transparent opacity-60 blur-3xl sm:h-[600px] sm:w-[600px]" />
        <div className="pointer-events-none absolute top-[40%] left-0 h-[250px] w-[250px] rounded-full bg-gradient-to-tr from-blue-100/20 to-transparent opacity-60 blur-3xl sm:h-[500px] sm:w-[500px]" />

        {/* Hero Header Strip (Geometric Shape Landing - Light Theme) */}
        <section className="relative flex min-h-[50vh] flex-col justify-center overflow-hidden border-b border-slate-100 bg-white px-4 pt-36 pb-20 sm:px-6 lg:px-8">
          {/* Subtle Ambient Light Gradient */}
          <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-br from-blue-500/[0.03] via-transparent to-[#22B6F6]/[0.03] blur-3xl" />

          {/* Dot Grid Background */}
          <div
            className="pointer-events-none absolute inset-0 z-0 opacity-[0.22]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, #1155CC 1.5px, transparent 0)`,
              backgroundSize: "28px 28px",
            }}
          />

          {/* Floating Glassmorphic Shapes (Light Theme) */}
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
            {isMobile ? (
              <>
                <ElegantShape
                  delay={0.3}
                  width={240}
                  height={60}
                  rotate={12}
                  gradient="from-blue-500/[0.08]"
                  light={true}
                  className="top-[10%] left-[-15%]"
                />
                <ElegantShape
                  delay={0.5}
                  width={180}
                  height={45}
                  rotate={-15}
                  gradient="from-cyan-500/[0.08]"
                  light={true}
                  className="right-[-10%] bottom-[15%]"
                />
              </>
            ) : (
              <>
                <ElegantShape
                  delay={0.3}
                  width={500}
                  height={120}
                  rotate={12}
                  gradient="from-blue-500/[0.08]"
                  light={true}
                  className="top-[15%] left-[-10%] md:top-[20%] md:left-[-5%]"
                />

                <ElegantShape
                  delay={0.5}
                  width={400}
                  height={100}
                  rotate={-15}
                  gradient="from-cyan-500/[0.08]"
                  light={true}
                  className="top-[60%] right-[-5%] md:top-[65%] md:right-[0%]"
                />

                <ElegantShape
                  delay={0.4}
                  width={280}
                  height={75}
                  rotate={-8}
                  gradient="from-indigo-500/[0.08]"
                  light={true}
                  className="bottom-[5%] left-[5%] md:bottom-[10%] md:left-[10%]"
                />

                <ElegantShape
                  delay={0.6}
                  width={180}
                  height={50}
                  rotate={20}
                  gradient="from-blue-600/[0.08]"
                  light={true}
                  className="top-[10%] right-[15%] md:top-[15%] md:right-[20%]"
                />

                <ElegantShape
                  delay={0.7}
                  width={130}
                  height={35}
                  rotate={-25}
                  gradient="from-cyan-400/[0.08]"
                  light={true}
                  className="top-[5%] left-[20%] md:top-[10%] md:left-[25%]"
                />
              </>
            )}
          </div>

          <div className="relative z-10 mx-auto max-w-7xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#1155CC]/10 bg-[#F1F5F9] px-4.5 py-1.5">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#22B6F6]" />
              <span className="text-[10px] font-black tracking-widest text-[#1155CC] uppercase">
                Get in Touch
              </span>
            </div>

            <h1 className="lg:text-6.5xl mb-4 text-4xl leading-tight font-black tracking-tight text-slate-900 sm:text-5xl">
              Let&apos;s Build <span className="text-[#1155CC]">Something Together</span>
            </h1>

            <p className="text-slate-505 mx-auto max-w-xl text-sm leading-relaxed font-medium sm:text-base">
              Tell us about your project - we&apos;ll get back within 24 hours.
            </p>
          </div>
        </section>

        {/* Two Column Layout (60/40 Split) */}
        <section className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-16">
            {/* Left Column (60%): Contact Form */}
            <div className="rounded-3xl border-2 border-[#22B6F6] bg-white p-6 shadow-[0_15px_35px_rgba(17, 85, 204,0.02)] sm:p-10 lg:col-span-7">
              <h2 className="mb-6 text-xl font-medium text-black sm:text-2xl">Send Us a Message</h2>

              {formStatus === "success" ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex min-h-[350px] flex-col items-center justify-center py-10 text-center"
                >
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-2xl text-emerald-600 shadow-sm">
                    ✓
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-black">Message Sent Successfully</h3>
                  <p className="mb-8 max-w-sm text-sm leading-relaxed text-slate-500">
                    Thank you for reaching out. A senior engineer will review your project details
                    and get back to you within 24 hours.
                  </p>
                  <Button onClick={() => setFormStatus("idle")} variant="secondary" size="sm">
                    Send another message
                  </Button>
                </motion.div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-6">
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

                  {/* First Name & Last Name */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="contact-first-name"
                        className="block text-[11px] font-semibold tracking-wide text-slate-500 uppercase"
                      >
                        First Name <span className="font-bold text-red-500">*</span>
                      </label>
                      <input
                        id="contact-first-name"
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
                        className={`w-full border bg-white px-4 py-3 ${getValidationError("firstName") ? "border-red-500 focus:border-red-500 focus:ring-red-500/10" : "border-slate-200 focus:border-[#1155CC] focus:ring-[#1155CC]/10"} rounded-xl text-sm text-slate-900 transition-all focus:ring-2 focus:outline-none`}
                      />
                      {getValidationError("firstName") && (
                        <p className="mt-1 text-[10px] font-semibold text-red-500">
                          {getValidationError("firstName")}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="contact-last-name"
                        className="block text-[11px] font-semibold tracking-wide text-slate-500 uppercase"
                      >
                        Last Name <span className="font-bold text-red-500">*</span>
                      </label>
                      <input
                        id="contact-last-name"
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
                        className={`w-full border bg-white px-4 py-3 ${getValidationError("lastName") ? "border-red-500 focus:border-red-500 focus:ring-red-500/10" : "border-slate-200 focus:border-[#1155CC] focus:ring-[#1155CC]/10"} rounded-xl text-sm text-slate-900 transition-all focus:ring-2 focus:outline-none`}
                      />
                      {getValidationError("lastName") && (
                        <p className="mt-1 text-[10px] font-semibold text-red-500">
                          {getValidationError("lastName")}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Email Address */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="contact-email"
                      className="block text-[11px] font-semibold tracking-wide text-slate-500 uppercase"
                    >
                      Email Address <span className="font-bold text-red-500">*</span>
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      placeholder="you@company.com"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        setTouched((prev) => ({ ...prev, email: true }));
                      }}
                      onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                      className={`w-full border bg-white px-4 py-3 ${getValidationError("email") ? "border-red-500 focus:border-red-500 focus:ring-red-500/10" : "border-slate-200 focus:border-[#1155CC] focus:ring-[#1155CC]/10"} rounded-xl text-sm text-slate-900 transition-all focus:ring-2 focus:outline-none`}
                    />
                    {getValidationError("email") && (
                      <p className="mt-1 text-[10px] font-semibold text-red-500">
                        {getValidationError("email")}
                      </p>
                    )}
                  </div>

                  {/* Phone Number with Country Selector */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="contact-phone"
                      className="block text-[11px] font-semibold tracking-wide text-slate-500 uppercase"
                    >
                      Phone Number <span className="font-bold text-red-500">*</span>
                    </label>
                    <div className="flex flex-row gap-2">
                      <select
                        aria-label="Country Code"
                        value={formData.countryCode}
                        onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                        className="w-[90px] shrink-0 cursor-pointer rounded-xl border border-slate-200 bg-white px-2 py-3 text-xs font-medium text-slate-900 transition-all focus:border-[#1155CC] focus:ring-2 focus:ring-[#1155CC]/10 focus:outline-none sm:w-[110px] sm:px-3 sm:text-sm"
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
                        id="contact-phone"
                        type="tel"
                        required
                        placeholder={
                          formData.countryCode === "+91" ? "99099 12345" : "Phone number"
                        }
                        value={formData.phone}
                        onChange={(e) => {
                          const val = e.target.value;
                          const cleanVal = val.replace(/[^0-9\s-()]/g, "");
                          setFormData({ ...formData, phone: cleanVal });
                          setTouched((prev) => ({ ...prev, phone: true }));
                        }}
                        onBlur={() => setTouched((prev) => ({ ...prev, phone: true }))}
                        className={`min-w-0 flex-1 border bg-white px-4 py-3 ${getValidationError("phone") ? "border-red-500 focus:border-red-500 focus:ring-red-500/10" : "border-slate-200 focus:border-[#1155CC] focus:ring-[#1155CC]/10"} rounded-xl text-sm text-slate-900 transition-all focus:ring-2 focus:outline-none`}
                      />
                    </div>
                    {getValidationError("phone") && (
                      <p className="mt-1 text-[10px] font-semibold text-red-500">
                        {getValidationError("phone")}
                      </p>
                    )}
                  </div>

                  {/* Interested in Select Dropdown */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="contact-interest"
                      className="block text-[11px] font-semibold tracking-wide text-slate-500 uppercase"
                    >
                      I&apos;m interested in
                    </label>
                    <select
                      id="contact-interest"
                      value={formData.interest}
                      onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                      className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition-all focus:border-[#1155CC] focus:ring-2 focus:ring-[#1155CC]/10 focus:outline-none"
                    >
                      <option value="Web Development">Web Development</option>
                      <option value="Mobile App">Mobile App</option>
                      <option value="SaaS Product">SaaS Product</option>
                      <option value="AI / Automation">AI / Automation</option>
                      <option value="UI/UX Design">UI/UX Design</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Message Textarea */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="contact-message"
                      className="block text-[11px] font-semibold tracking-wide text-slate-500 uppercase"
                    >
                      Message <span className="font-bold text-red-500">*</span>
                    </label>
                    <textarea
                      id="contact-message"
                      required
                      rows={5}
                      placeholder="Tell us about your product roadmap, goals, or requirements..."
                      value={formData.message}
                      onChange={(e) => {
                        setFormData({ ...formData, message: e.target.value });
                        setTouched((prev) => ({ ...prev, message: true }));
                      }}
                      onBlur={() => setTouched((prev) => ({ ...prev, message: true }))}
                      className={`w-full border bg-white px-4 py-3 ${getValidationError("message") ? "border-red-500 focus:border-red-500 focus:ring-red-500/10" : "border-slate-200 focus:border-[#1155CC] focus:ring-[#1155CC]/10"} resize-none rounded-xl text-sm text-slate-900 transition-all focus:ring-2 focus:outline-none`}
                    />
                    {getValidationError("message") && (
                      <p className="mt-1 text-[10px] font-semibold text-red-500">
                        {getValidationError("message")}
                      </p>
                    )}
                  </div>

                  {/* Submit button */}
                  <Button
                    type="submit"
                    disabled={formStatus === "submitting" || !isFormValid}
                    variant="default"
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

            {/* Right Column (40%): Trust/Info Panel */}
            <div className="space-y-8 lg:col-span-5">
              {/* Book Call Card */}
              <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-[#0F172A] to-[#1155CC] p-6 text-white shadow-xl sm:p-8">
                {/* Decorative radial glows */}
                <div className="pointer-events-none absolute -top-1/4 -right-1/4 h-[200px] w-[200px] rounded-full bg-[#22B6F6]/20 blur-[60px]" />
                <div className="pointer-events-none absolute -bottom-1/4 -left-1/4 h-[200px] w-[200px] rounded-full bg-[#EC4899]/10 blur-[60px]" />

                <div className="relative z-10 flex h-full flex-col justify-start">
                  <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
                    <Icon name="bolt" className="h-5 w-5 text-white" />
                  </div>

                  <h3 className="mb-2 text-xl font-medium text-white">Or book a call directly</h3>

                  <p className="mb-8 text-xs leading-relaxed font-medium text-slate-300">
                    Prefer a live conversation? Choose a time slot that works best for you and sync
                    directly with our technical lead.
                  </p>

                  <Button
                    onClick={() => setIsBookModalOpen(true)}
                    variant="secondary"
                    className="w-full border-transparent bg-white text-slate-900 shadow-md hover:border-transparent hover:bg-slate-100 hover:text-slate-900 hover:shadow-lg sm:w-auto"
                  >
                    Book Free 15-min Call ↗
                  </Button>
                </div>
              </div>

              {/* Corporate Address & Contact info card */}
              <div className="space-y-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_15px_35px_rgba(17, 85, 204,0.02)] sm:p-8">
                <h4 className="border-b border-slate-100 pb-3 text-xs font-black tracking-widest text-slate-400 uppercase">
                  Corporate Contact Info
                </h4>

                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1155CC]/5 text-[#1155CC]">
                      <Icon name="schema" className="h-4 w-4" />
                    </div>
                    <div>
                      <h5 className="mb-1 text-xs font-black tracking-wider text-slate-500 uppercase">
                        Our Location
                      </h5>
                      <p className="text-xs leading-relaxed font-semibold text-[#22B6F6]">
                        UG-15, Palladium Plaza, Vip Road,
                        <br />
                        Vesu, Surat, Gujarat - 395007, India
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1155CC]/5 text-[#1155CC]">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.557-5.132-3.865-6.689-6.69l1.293-.97c.362-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h5 className="mb-1 text-xs font-black tracking-wider text-slate-500 uppercase">
                        Phone Number
                      </h5>
                      <div>
                        <span className="block text-[10px] font-bold tracking-wide text-slate-400 uppercase">
                          Business Call:
                        </span>
                        <a
                          href="tel:+919173101711"
                          className="text-xs font-semibold text-[#22B6F6] hover:underline"
                        >
                          +91 9173101711
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1155CC]/5 text-[#1155CC]">
                      <span className="font-mono text-xs font-bold">@</span>
                    </div>
                    <div>
                      <h5 className="mb-1 text-xs font-black tracking-wider text-slate-500 uppercase">
                        Email Addresses
                      </h5>
                      <div className="flex flex-col gap-2">
                        <div>
                          <span className="block text-[10px] font-bold tracking-wide text-slate-400 uppercase">
                            General Inquiry:
                          </span>
                          <a
                            href="mailto:info@techsonance.co.in"
                            className="text-xs font-semibold text-[#22B6F6] hover:underline"
                          >
                            info@techsonance.co.in
                          </a>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold tracking-wide text-slate-400 uppercase">
                            Careers & HR:
                          </span>
                          <a
                            href="mailto:hr@techsonance.co.in"
                            className="text-xs font-semibold text-[#22B6F6] hover:underline"
                          >
                            hr@techsonance.co.in
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1155CC]/5 text-[#1155CC]">
                      <Icon name="check" className="h-4 w-4" />
                    </div>
                    <div>
                      <h5 className="mb-1 text-xs font-black tracking-wider text-slate-500 uppercase">
                        Standard Response
                      </h5>
                      <p className="text-xs font-semibold text-[#22B6F6]">Within 24 Hours</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Custom Floating Toast Notification */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed right-6 bottom-6 z-50 flex items-center gap-3 rounded-xl border border-white/10 bg-[#0F172A] px-5 py-3 text-xs font-bold text-white shadow-2xl"
            >
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#22B6F6]" />
              {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>

        <SiteFooter />
      </main>
      <BookConsultationModal isOpen={isBookModalOpen} onClose={() => setIsBookModalOpen(false)} />
    </>
  );
}
