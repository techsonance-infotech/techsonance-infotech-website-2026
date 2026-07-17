"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SiteHeader from "@/app/components/home/SiteHeader";
import SiteFooter from "@/app/components/home/SiteFooter";
import { Icon } from "@/app/components/icons/Icon";
import BookConsultationModal from "@/app/components/home/BookConsultationModal";
import { ElegantShape } from "@/components/ui/shape-landing-hero";
import { Button } from "@/components/ui/button";

export default function ContactClient() {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
        headers: {
          "Content-Type": "application/json",
        },
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

  return (
    <>
      <SiteHeader transparent={true} />
      <main className="bg-[#FAFBFD] min-h-screen relative overflow-x-clip font-sans text-slate-900">

        {/* Ambient background decoration */}
        <div className="absolute top-20 right-0 w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] bg-gradient-to-bl from-blue-100/30 to-transparent rounded-full blur-3xl opacity-60 pointer-events-none" />
        <div className="absolute top-[40%] left-0 w-[250px] h-[250px] sm:w-[500px] sm:h-[500px] bg-gradient-to-tr from-blue-100/20 to-transparent rounded-full blur-3xl opacity-60 pointer-events-none" />

        {/* Hero Header Strip (Geometric Shape Landing - Light Theme) */}
        <section className="relative pt-36 pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-100 bg-white overflow-hidden min-h-[50vh] flex flex-col justify-center">
          {/* Subtle Ambient Light Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.03] via-transparent to-[#22B6F6]/[0.03] blur-3xl pointer-events-none z-0" />

          {/* Dot Grid Background */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.22] z-0"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, #1155CC 1.5px, transparent 0)`,
              backgroundSize: "28px 28px"
            }}
          />

          {/* Floating Glassmorphic Shapes (Light Theme) */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {mounted && isMobile ? (
              <>
                <ElegantShape
                  delay={0.3}
                  width={240}
                  height={60}
                  rotate={12}
                  gradient="from-blue-500/[0.08]"
                  light={true}
                  className="left-[-15%] top-[10%]"
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
                  className="left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]"
                />

                <ElegantShape
                  delay={0.5}
                  width={400}
                  height={100}
                  rotate={-15}
                  gradient="from-cyan-500/[0.08]"
                  light={true}
                  className="right-[-5%] md:right-[0%] top-[60%] md:top-[65%]"
                />

                <ElegantShape
                  delay={0.4}
                  width={280}
                  height={75}
                  rotate={-8}
                  gradient="from-indigo-500/[0.08]"
                  light={true}
                  className="left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%]"
                />

                <ElegantShape
                  delay={0.6}
                  width={180}
                  height={50}
                  rotate={20}
                  gradient="from-blue-600/[0.08]"
                  light={true}
                  className="right-[15%] md:right-[20%] top-[10%] md:top-[15%]"
                />

                <ElegantShape
                  delay={0.7}
                  width={130}
                  height={35}
                  rotate={-25}
                  gradient="from-cyan-400/[0.08]"
                  light={true}
                  className="left-[20%] md:left-[25%] top-[5%] md:top-[10%]"
                />
              </>
            )}
          </div>

          <div className="max-w-7xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 bg-[#F1F5F9] border border-[#1155CC]/10 rounded-full px-4.5 py-1.5 mb-6">
              <span className="w-2.5 h-2.5 rounded-full bg-[#22B6F6] animate-pulse" />
              <span className="text-[10px] font-black text-[#1155CC] tracking-widest uppercase">
                Get in Touch
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6.5xl font-black text-slate-900 leading-tight mb-4 tracking-tight">
              Let's Build <span className="text-[#1155CC]">Something Together</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-505 font-medium max-w-xl mx-auto leading-relaxed">
              Tell us about your project - we'll get back within 24 hours.
            </p>
          </div>
        </section>

        {/* Two Column Layout (60/40 Split) */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 relative z-10 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">

            {/* Left Column (60%): Contact Form */}
            <div className="lg:col-span-7 bg-white border-2 border-[#22B6F6] rounded-3xl p-6 sm:p-10 shadow-[0_15px_35px_rgba(17, 85, 204,0.02)]">
              <h2 className="text-xl sm:text-2xl font-medium text-black mb-6">
                Send Us a Message
              </h2>

              {formStatus === "success" ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-10 flex flex-col items-center justify-center min-h-[350px]"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl mb-6 shadow-sm border border-emerald-100">
                    ✓
                  </div>
                  <h3 className="text-xl font-bold text-black mb-3">Message Sent Successfully</h3>
                  <p className="text-sm text-slate-500 max-w-sm leading-relaxed mb-8">
                    Thank you for reaching out. A senior engineer will review your project details and get back to you within 24 hours.
                  </p>
                  <Button
                    onClick={() => setFormStatus("idle")}
                    variant="secondary"
                    size="sm"
                  >
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
                          setTouched(prev => ({ ...prev, firstName: true }));
                        }}
                        onBlur={() => setTouched(prev => ({ ...prev, firstName: true }))}
                        className={`w-full px-4 py-3 bg-white border ${getValidationError("firstName") ? "border-red-500 focus:border-red-500 focus:ring-red-500/10" : "border-slate-200 focus:border-[#1155CC] focus:ring-[#1155CC]/10"} rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 transition-all`}
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
                          setTouched(prev => ({ ...prev, lastName: true }));
                        }}
                        onBlur={() => setTouched(prev => ({ ...prev, lastName: true }))}
                        className={`w-full px-4 py-3 bg-white border ${getValidationError("lastName") ? "border-red-500 focus:border-red-500 focus:ring-red-500/10" : "border-slate-200 focus:border-[#1155CC] focus:ring-[#1155CC]/10"} rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 transition-all`}
                      />
                      {getValidationError("lastName") && (
                        <p className="text-[10px] font-semibold text-red-500 mt-1">{getValidationError("lastName")}</p>
                      )}
                    </div>
                  </div>

                  {/* Email Address */}
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
                        setTouched(prev => ({ ...prev, email: true }));
                      }}
                      onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                      className={`w-full px-4 py-3 bg-white border ${getValidationError("email") ? "border-red-500 focus:border-red-500 focus:ring-red-500/10" : "border-slate-200 focus:border-[#1155CC] focus:ring-[#1155CC]/10"} rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 transition-all`}
                    />
                    {getValidationError("email") && (
                      <p className="text-[10px] font-semibold text-red-500 mt-1">{getValidationError("email")}</p>
                    )}
                  </div>

                  {/* Phone Number with Country Selector */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                      Phone Number <span className="text-red-500 font-bold">*</span>
                    </label>
                    <div className="flex flex-row gap-2">
                      <select
                        value={formData.countryCode}
                        onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                        className="w-[90px] sm:w-[110px] px-2 sm:px-3 py-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#1155CC] focus:ring-2 focus:ring-[#1155CC]/10 transition-all cursor-pointer font-medium shrink-0"
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
                          const val = e.target.value;
                          const cleanVal = val.replace(/[^0-9\s-()]/g, "");
                          setFormData({ ...formData, phone: cleanVal });
                          setTouched(prev => ({ ...prev, phone: true }));
                        }}
                        onBlur={() => setTouched(prev => ({ ...prev, phone: true }))}
                        className={`flex-1 min-w-0 px-4 py-3 bg-white border ${getValidationError("phone") ? "border-red-500 focus:border-red-500 focus:ring-red-500/10" : "border-slate-200 focus:border-[#1155CC] focus:ring-[#1155CC]/10"} rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 transition-all`}
                      />
                    </div>
                    {getValidationError("phone") && (
                      <p className="text-[10px] font-semibold text-red-500 mt-1">{getValidationError("phone")}</p>
                    )}
                  </div>

                  {/* Interested in Select Dropdown */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                      I'm interested in
                    </label>
                    <select
                      value={formData.interest}
                      onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#1155CC] focus:ring-2 focus:ring-[#1155CC]/10 transition-all cursor-pointer font-medium"
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
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                      Message <span className="text-red-500 font-bold">*</span>
                    </label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Tell us about your product roadmap, goals, or requirements..."
                      value={formData.message}
                      onChange={(e) => {
                        setFormData({ ...formData, message: e.target.value });
                        setTouched(prev => ({ ...prev, message: true }));
                      }}
                      onBlur={() => setTouched(prev => ({ ...prev, message: true }))}
                      className={`w-full px-4 py-3 bg-white border ${getValidationError("message") ? "border-red-500 focus:border-red-500 focus:ring-red-500/10" : "border-slate-200 focus:border-[#1155CC] focus:ring-[#1155CC]/10"} rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 transition-all resize-none`}
                    />
                    {getValidationError("message") && (
                      <p className="text-[10px] font-semibold text-red-500 mt-1">{getValidationError("message")}</p>
                    )}
                  </div>

                  {/* Submit button */}
                  <Button
                    type="submit"
                    disabled={formStatus === "submitting" || !isFormValid}
                    variant="primary"
                    showArrow={formStatus !== "submitting"}
                    className="w-full"
                  >
                    {formStatus === "submitting" ? (
                      <>
                        <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" />
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
            <div className="lg:col-span-5 space-y-8">

              {/* Book Call Card */}
              <div className="bg-gradient-to-br from-[#0F172A] to-[#1155CC] border border-white/5 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                {/* Decorative radial glows */}
                <div className="absolute -top-1/4 -right-1/4 w-[200px] h-[200px] bg-[#22B6F6]/20 rounded-full blur-[60px] pointer-events-none" />
                <div className="absolute -bottom-1/4 -left-1/4 w-[200px] h-[200px] bg-[#EC4899]/10 rounded-full blur-[60px] pointer-events-none" />

                <div className="relative z-10 flex flex-col justify-start h-full">
                  <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center mb-6">
                    <Icon name="bolt" className="w-5 h-5 text-white" />
                  </div>

                  <h3 className="text-xl font-medium mb-2 text-white">
                    Or book a call directly
                  </h3>

                  <p className="text-slate-300 text-xs font-medium leading-relaxed mb-8">
                    Prefer a live conversation? Choose a time slot that works best for you and sync directly with our technical lead.
                  </p>

                  <Button
                    onClick={() => setIsBookModalOpen(true)}
                    variant="secondary"
                    className="w-full sm:w-auto bg-white text-slate-900 border-transparent hover:bg-slate-100 hover:text-slate-900 hover:border-transparent shadow-md hover:shadow-lg"
                  >
                    Book Free 15-min Call ↗
                  </Button>
                </div>
              </div>



              {/* Corporate Address & Contact info card */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-[0_15px_35px_rgba(17, 85, 204,0.02)] space-y-6">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest pb-3 border-b border-slate-100">
                  Corporate Contact Info
                </h4>

                <div className="space-y-4">
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-lg bg-[#1155CC]/5 text-[#1155CC] flex items-center justify-center shrink-0">
                      <Icon name="schema" className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1">
                        Our Location
                      </h5>
                      <p className="text-xs font-semibold text-[#22B6F6] leading-relaxed">
                        UG-15, Palladium Plaza, Vip Road,<br />
                        Vesu, Surat, Gujarat - 395007, India
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-lg bg-[#1155CC]/5 text-[#1155CC] flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.557-5.132-3.865-6.689-6.69l1.293-.97c.362-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25z" />
                      </svg>
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1">
                        Phone Number
                      </h5>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Business Call:</span>
                        <a
                          href="tel:+919173101711"
                          className="text-xs font-semibold text-[#22B6F6] hover:underline"
                        >
                          +91 9173101711
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-lg bg-[#1155CC]/5 text-[#1155CC] flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold font-mono">@</span>
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1">
                        Email Addresses
                      </h5>
                      <div className="flex flex-col gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">General Inquiry:</span>
                          <a
                            href="mailto:info@techsonance.co.in"
                            className="text-xs font-semibold text-[#22B6F6] hover:underline"
                          >
                            info@techsonance.co.in
                          </a>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Careers & HR:</span>
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

                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-lg bg-[#1155CC]/5 text-[#1155CC] flex items-center justify-center shrink-0">
                      <Icon name="check" className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1">
                        Standard Response
                      </h5>
                      <p className="text-xs font-semibold text-[#22B6F6]">
                        Within 24 Hours
                      </p>
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
              className="fixed bottom-6 right-6 z-50 bg-[#0F172A] text-white px-5 py-3 rounded-xl shadow-2xl border border-white/10 flex items-center gap-3 text-xs font-bold"
            >
              <span className="w-2 h-2 rounded-full bg-[#22B6F6] animate-pulse" />
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
