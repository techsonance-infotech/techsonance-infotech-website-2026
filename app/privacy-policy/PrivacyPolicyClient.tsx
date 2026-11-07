"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import SiteHeader from "@/app/components/home/SiteHeader";
import SiteFooter from "@/app/components/home/SiteFooter";
import { Icon } from "@/app/components/icons/Icon";
import { ElegantShape } from "@/components/ui/shape-landing-hero";
import { cn } from "@/lib/utils";

const sections = [
  { id: "introduction", label: "Introduction", icon: "check" },
  { id: "information-collection", label: "1. Information We Collect", icon: "database" },
  { id: "how-we-use", label: "2. How We Use Information", icon: "bolt" },
  { id: "sharing-disclosure", label: "3. Sharing & Disclosure", icon: "schema" },
  { id: "data-security", label: "4. Data Security", icon: "check" },
  { id: "cookies-tracking", label: "5. Cookies & Tracking", icon: "arrow" },
  { id: "your-rights", label: "6. Your Rights & Choices", icon: "check" },
  { id: "client-project-data", label: "7. Client Project Data", icon: "code" },
  { id: "third-party", label: "8. Third-Party Services", icon: "schema" },
  { id: "international-transfers", label: "9. International Transfers", icon: "arrow" },
  { id: "children-privacy", label: "10. Children's Privacy", icon: "check" },
  { id: "policy-changes", label: "11. Changes to Policy", icon: "bolt" },
  { id: "contact-us", label: "12. Contact Us", icon: "arrow" },
];

export default function PrivacyPolicyClient() {
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

  const [activeSection, setActiveSection] = useState("introduction");

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -100; // Offset for fixed header
      const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <>
      <SiteHeader transparent={true} />
      <main className="relative min-h-screen overflow-hidden bg-[#FAFBFD] pt-24 pb-20">
        {/* Ambient background glows */}
        <div
          className={cn(
            "pointer-events-none absolute top-0 right-0 rounded-full bg-[#1155CC]/5 blur-[100px]",
            mounted && isMobile ? "h-[250px] w-[250px]" : "h-[500px] w-[500px]",
          )}
        />
        <div
          className={cn(
            "pointer-events-none absolute top-[30%] left-0 rounded-full bg-[#22B6F6]/5 blur-[120px]",
            mounted && isMobile ? "h-[300px] w-[300px]" : "h-[600px] w-[600px]",
          )}
        />

        {/* Hero Banner Header */}
        <section className="relative overflow-hidden border-b border-[#1E293B] bg-gradient-to-br from-[#071A35] via-[#0F172A] to-[#0b2447] py-16 text-white sm:py-24">
          <div className="pointer-events-none absolute inset-0 opacity-[0.05]">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: "radial-gradient(#22B6F6 1.5px, transparent 1.5px)",
                backgroundSize: "24px 24px",
              }}
            />
          </div>

          {/* Floating Elegant Shapes */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <ElegantShape
              delay={0.3}
              width={mounted && isMobile ? 200 : 400}
              height={mounted && isMobile ? 60 : 120}
              rotate={12}
              gradient="from-[#1155CC]/20 to-transparent"
              className="top-[10%] left-[-10%]"
            />
            <ElegantShape
              delay={0.5}
              width={mounted && isMobile ? 150 : 300}
              height={mounted && isMobile ? 50 : 100}
              rotate={-15}
              gradient="from-[#22B6F6]/25 to-transparent"
              className="right-[-5%] bottom-[10%]"
            />
          </div>

          <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <motion.span
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-4 inline-block rounded-full bg-[#22B6F6]/10 px-3 py-1.5 text-[10px] font-black tracking-[0.25em] text-[#22B6F6] uppercase"
            >
              Legal & Compliance
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-sora text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl"
            >
              Privacy{" "}
              <span className="bg-gradient-to-r from-[#22B6F6] to-[#00E5FF] bg-clip-text text-transparent">
                Policy
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-slate-350 mx-auto mt-4 max-w-xl text-xs font-semibold sm:text-sm"
            >
              Effective Date: January 1, 2026 &bull; Last Updated: June 18, 2026
            </motion.p>
          </div>
        </section>

        {/* Main Content Layout */}
        <section className="mx-auto mt-12 max-w-7xl px-4 sm:mt-16 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
            {/* Sticky Navigation Sidebar (Desktop) */}
            <div className="sticky top-28 hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_15px_30px_rgba(17,85,204,0.02)] lg:col-span-4 lg:block">
              <h3 className="mb-4 border-b border-slate-100 pb-3 text-xs font-black tracking-widest text-slate-400 uppercase">
                Table of Contents
              </h3>
              <nav className="flex flex-col gap-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`group flex items-center gap-3 rounded-xl px-4 py-2.5 text-left text-xs font-bold transition-all ${
                      activeSection === section.id
                        ? "bg-[#1155CC] text-white shadow-md shadow-[#1155CC]/10"
                        : "text-slate-600 hover:text-[#1155CC] hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full transition-all ${
                        activeSection === section.id
                          ? "bg-white scale-125"
                          : "bg-slate-300 group-hover:bg-[#1155CC]"
                      }`}
                    />
                    {section.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Privacy Policy Main Body */}
            <div className="col-span-1 space-y-8 lg:col-span-8">
              {/* Introduction */}
              <div
                id="introduction"
                className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_15px_35px_rgba(17,85,204,0.02)] sm:p-8"
              >
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1155CC]/5 text-[#1155CC]">
                    <Icon name="check" className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="mb-1 font-sora text-lg font-medium text-slate-900">
                      Introduction
                    </h2>
                    <p className="text-xs font-semibold text-slate-400">
                      Commitment to your data privacy
                    </p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed font-medium text-slate-600 sm:text-sm">
                  At TechSonance Infotech LLP, we are committed to protecting your privacy and
                  ensuring the security of your personal information. This Privacy Policy explains
                  how we collect, use, disclose, and safeguard your information when you visit our
                  website (www.techsonance.co.in) or use our services.
                </p>
              </div>

              {/* 1. Information We Collect */}
              <div
                id="information-collection"
                className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_15px_35px_rgba(17,85,204,0.02)] sm:p-8"
              >
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1155CC]/5 text-[#1155CC]">
                    <Icon name="database" className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="mb-1 font-sora text-lg font-medium text-slate-900">
                      1. Information We Collect
                    </h2>
                    <p className="text-xs font-semibold text-slate-400">
                      Data categories we compile
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="mb-3 text-xs font-black tracking-wider text-[#1155CC] uppercase">
                      Personal Information
                    </h4>
                    <p className="mb-3 text-xs leading-relaxed font-medium text-slate-600">
                      We collect personal details that you voluntarily submit to us during project
                      consultations, applications, or contact requests:
                    </p>
                    <ul className="grid grid-cols-1 gap-2 text-xs font-bold font-semibold text-slate-700 sm:grid-cols-2">
                      <li className="flex items-center gap-2.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#22B6F6]" />
                        Full name and job title
                      </li>
                      <li className="flex items-center gap-2.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#22B6F6]" />
                        Email address and phone number
                      </li>
                      <li className="flex items-center gap-2.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#22B6F6]" />
                        Company name and business info
                      </li>
                      <li className="flex items-center gap-2.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#22B6F6]" />
                        Project requirements & stack
                      </li>
                    </ul>
                  </div>

                  <hr className="border-slate-100" />

                  <div>
                    <h4 className="mb-3 text-xs font-black tracking-wider text-[#1155CC] uppercase">
                      Technical & Usage Information
                    </h4>
                    <p className="mb-3 text-xs leading-relaxed font-medium text-slate-600">
                      We automatically collect browser, network, and device logs when you navigate
                      our platform:
                    </p>
                    <ul className="grid grid-cols-1 gap-2 text-xs font-bold font-semibold text-slate-700 sm:grid-cols-2">
                      <li className="flex items-center gap-2.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#1155CC]" />
                        IP address and browser agent
                      </li>
                      <li className="flex items-center gap-2.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#1155CC]" />
                        OS & device model details
                      </li>
                      <li className="flex items-center gap-2.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#1155CC]" />
                        Page views and duration
                      </li>
                      <li className="flex items-center gap-2.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#1155CC]" />
                        Referral URLs and search terms
                      </li>
                    </ul>
                  </div>

                  <hr className="border-slate-100" />

                  <div>
                    <h4 className="mb-3 text-xs font-black tracking-wider text-[#1155CC] uppercase">
                      Project-Related Data
                    </h4>
                    <ul className="grid grid-cols-1 gap-2 text-xs font-bold font-semibold text-slate-700 sm:grid-cols-2">
                      <li className="flex items-center gap-2.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#22B6F6]" />
                        System specifications & flows
                      </li>
                      <li className="flex items-center gap-2.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#22B6F6]" />
                        Timeline & budget parameters
                      </li>
                      <li className="flex items-center gap-2.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#22B6F6]" />
                        Feedback & workshop responses
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 2. How We Use Your Information */}
              <div
                id="how-we-use"
                className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_15px_35px_rgba(17,85,204,0.02)] sm:p-8"
              >
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1155CC]/5 text-[#1155CC]">
                    <Icon name="bolt" className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="mb-1 font-sora text-lg font-medium text-slate-900">
                      2. How We Use Your Information
                    </h2>
                    <p className="text-xs font-semibold text-slate-400">Processing objectives</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 text-xs font-bold font-semibold text-slate-700 sm:grid-cols-2 sm:text-sm">
                  <div className="rounded-2xl border border-slate-100/50 bg-slate-50 p-4">
                    <span className="mb-1 block font-bold text-[#1155CC]">Service Delivery</span>
                    <p className="text-xs font-medium text-slate-500">
                      To construct, test, and host custom web, mobile, and agentic AI platforms.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-100/50 bg-slate-50 p-4">
                    <span className="mb-1 block font-bold text-[#1155CC]">Communication</span>
                    <p className="text-xs font-medium text-slate-500">
                      Providing direct technical updates, proposal drafts, and code review logs.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-100/50 bg-slate-50 p-4">
                    <span className="mb-1 block font-bold text-[#1155CC]">UX Optimization</span>
                    <p className="text-xs font-medium text-slate-500">
                      Analysing metrics and clickmaps to continuously upgrade site rendering speed.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-100/50 bg-slate-50 p-4">
                    <span className="mb-1 block font-bold text-[#1155CC]">Compliance</span>
                    <p className="text-xs font-medium text-slate-500">
                      Enforcing terms of service, security protocols, and Indian legal mandates.
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. Information Sharing and Disclosure */}
              <div
                id="sharing-disclosure"
                className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_15px_35px_rgba(17,85,204,0.02)] sm:p-8"
              >
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1155CC]/5 text-[#1155CC]">
                    <Icon name="schema" className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="mb-1 font-sora text-lg font-medium text-slate-900">
                      3. Information Sharing and Disclosure
                    </h2>
                    <p className="text-xs font-semibold text-slate-400">
                      Disclosing standards & limits
                    </p>
                  </div>
                </div>
                <p className="mb-4 text-xs leading-relaxed font-bold font-medium text-slate-600 sm:text-sm">
                  We value your trust and do not sell, rent, or lease your personal information.
                  Sharing occurs exclusively under the following terms:
                </p>
                <ul className="space-y-3 text-xs font-bold font-semibold text-slate-700 sm:text-sm">
                  <li className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1155CC]" />
                    <span>
                      <strong className="text-slate-800">Consent:</strong> With your explicit
                      approval and permission.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1155CC]" />
                    <span>
                      <strong className="text-slate-800">Trusted Partners:</strong> Providers
                      supporting server infrastructure, transactional mail APIs, or database
                      architecture under strict NDAs.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1155CC]" />
                    <span>
                      <strong className="text-slate-800">Legal Demands:</strong> When required by
                      statutory authorities, court subpoenas, or to prevent fraudulent attacks.
                    </span>
                  </li>
                </ul>
              </div>

              {/* 4. Data Security */}
              <div
                id="data-security"
                className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_15px_35px_rgba(17,85,204,0.02)] sm:p-8"
              >
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1155CC]/5 text-[#1155CC]">
                    <Icon name="check" className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="mb-1 font-sora text-lg font-medium text-slate-900">
                      4. Data Security
                    </h2>
                    <p className="text-xs font-semibold text-slate-400">
                      Safeguards and encryption
                    </p>
                  </div>
                </div>
                <p className="mb-4 text-xs leading-relaxed font-medium text-slate-600 sm:text-sm">
                  TechSonance InfoTech LLP implements advanced protection layers to secure data
                  transit and database nodes:
                </p>
                <div className="grid grid-cols-1 gap-3 text-center text-xs font-bold sm:grid-cols-3">
                  <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                    <span className="mb-1 block text-[#1155CC]">AES-256</span>
                    <span className="font-medium text-slate-500">Encryption at rest & transit</span>
                  </div>
                  <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                    <span className="mb-1 block text-[#1155CC]">Access Limits</span>
                    <span className="font-medium text-slate-500">Role-based project logins</span>
                  </div>
                  <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                    <span className="mb-1 block text-[#1155CC]">Security Audits</span>
                    <span className="font-medium text-slate-500">Routine system assessments</span>
                  </div>
                </div>
              </div>

              {/* 5. Cookies & Tracking */}
              <div
                id="cookies-tracking"
                className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_15px_35px_rgba(17,85,204,0.02)] sm:p-8"
              >
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1155CC]/5 text-[#1155CC]">
                    <Icon name="arrow" className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="mb-1 font-sora text-lg font-medium text-slate-900">
                      5. Cookies & Tracking Technologies
                    </h2>
                    <p className="text-xs font-semibold text-slate-400">
                      Cookie details and user control
                    </p>
                  </div>
                </div>
                <p className="mb-4 text-xs leading-relaxed font-medium text-slate-600 sm:text-sm">
                  We use cookies and Web beacons to identify traffic routing and user preferences:
                </p>
                <ul className="space-y-3 text-xs font-bold font-semibold text-slate-700 sm:text-sm">
                  <li className="flex items-start gap-2.5">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#22B6F6]" />
                    <span>
                      <strong className="text-[#1155CC]">Essential:</strong> Core files required to
                      render forms and dynamic page routes.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#22B6F6]" />
                    <span>
                      <strong className="text-[#1155CC]">Analytics:</strong> Help compile session
                      time metrics (e.g. Google Analytics).
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#22B6F6]" />
                    <span>
                      <strong className="text-[#1155CC]">Management:</strong> Users can disable or
                      reject cookies in browser configurations, though some layout aspects may cease
                      to function correctly.
                    </span>
                  </li>
                </ul>
              </div>

              {/* 6. Your Rights & Choices */}
              <div
                id="your-rights"
                className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_15px_35px_rgba(17,85,204,0.02)] sm:p-8"
              >
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1155CC]/5 text-[#1155CC]">
                    <Icon name="check" className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="mb-1 font-sora text-lg font-medium text-slate-900">
                      6. Your Rights & Choices
                    </h2>
                    <p className="text-xs font-semibold text-slate-400">Data ownership rights</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-3">
                  {[
                    "Access Records",
                    "Correct Inaccuracies",
                    "Delete Info",
                    "Opt Out of Emails",
                    "Request Portability",
                    "Object to Processing",
                  ].map((right, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-xs font-bold text-slate-700"
                    >
                      {right}
                    </div>
                  ))}
                </div>
              </div>

              {/* 7. Client Project Data */}
              <div
                id="client-project-data"
                className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_15px_35px_rgba(17,85,204,0.02)] sm:p-8"
              >
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1155CC]/5 text-[#1155CC]">
                    <Icon name="code" className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="mb-1 font-sora text-lg font-medium text-slate-900">
                      7. Client Project Data
                    </h2>
                    <p className="text-xs font-semibold text-slate-400">
                      Software code & IP protections
                    </p>
                  </div>
                </div>
                <p className="mb-4 text-xs leading-relaxed font-medium text-slate-600 sm:text-sm">
                  For custom product development, we handle project architecture metadata under key
                  confidentiality rules:
                </p>
                <ul className="space-y-2.5 text-xs font-bold font-semibold text-slate-700 sm:text-sm">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#1155CC]" />
                    Mutual Non-Disclosure Agreements (NDAs) signed prior to project kick-offs.
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#1155CC]" />
                    Intellectual Property and source code ownership fully documented in contracts.
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#1155CC]" />
                    Codebase access restricted exclusively to authorized development staff.
                  </li>
                </ul>
              </div>

              {/* 8. Third-Party Services */}
              <div
                id="third-party"
                className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_15px_35px_rgba(17,85,204,0.02)] sm:p-8"
              >
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1155CC]/5 text-[#1155CC]">
                    <Icon name="schema" className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="mb-1 font-sora text-lg font-medium text-slate-900">
                      8. Third-Party Services
                    </h2>
                    <p className="text-xs font-semibold text-slate-400">External dependencies</p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed font-medium text-slate-600 sm:text-sm">
                  We integrate Cloud hostings (AWS, Google Cloud), web analysis tools (Google
                  Analytics), payment gateways, and mailing relays. These entities operate under
                  their respective privacy protocols, which we advise you to review.
                </p>
              </div>

              {/* 9. International Transfers */}
              <div
                id="international-transfers"
                className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_15px_35px_rgba(17,85,204,0.02)] sm:p-8"
              >
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1155CC]/5 text-[#1155CC]">
                    <Icon name="arrow" className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="mb-1 font-sora text-lg font-medium text-slate-900">
                      9. International Data Transfers
                    </h2>
                    <p className="text-xs font-semibold text-slate-400">Global routing protocols</p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed font-medium text-slate-600 sm:text-sm">
                  As an international custom developer team, your client specifications may be
                  routed across regional boundaries. We safeguard these transfers with standard data
                  protection clauses matching jurisdiction codes.
                </p>
              </div>

              {/* 10. Children's Privacy */}
              <div
                id="children-privacy"
                className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_15px_35px_rgba(17,85,204,0.02)] sm:p-8"
              >
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1155CC]/5 text-[#1155CC]">
                    <Icon name="check" className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="mb-1 font-sora text-lg font-medium text-slate-900">
                      10. Children's Privacy
                    </h2>
                    <p className="text-xs font-semibold text-slate-400">Minors security policy</p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed font-medium text-slate-600 sm:text-sm">
                  Our development offerings are targeted strictly at entities and individuals aged
                  18 and older. We do not gather details from minors. If you suspect any child
                  information has been collected, notify us to delete it instantly.
                </p>
              </div>

              {/* 11. Changes to Policy */}
              <div
                id="policy-changes"
                className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_15px_35px_rgba(17,85,204,0.02)] sm:p-8"
              >
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1155CC]/5 text-[#1155CC]">
                    <Icon name="bolt" className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="mb-1 font-sora text-lg font-medium text-slate-900">
                      11. Changes to This Privacy Policy
                    </h2>
                    <p className="text-xs font-semibold text-[#1155CC]">
                      Updates and notifications
                    </p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed font-medium text-slate-600 sm:text-sm">
                  We modify this policy to align with regulatory adjustments. Updates will be
                  visible directly on this URL with an updated "Last Updated" status. Significant
                  revisions will prompt notification alerts on our main domains.
                </p>
              </div>

              {/* 12. Contact Us */}
              <div
                id="contact-us"
                className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_15px_35px_rgba(17,85,204,0.02)] sm:p-8"
              >
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1155CC]/5 text-[#1155CC]">
                    <Icon name="arrow" className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="mb-1 font-sora text-lg font-medium text-slate-900">
                      12. Contact Us
                    </h2>
                    <p className="text-xs font-semibold text-slate-400">
                      Reach our data compliance lead
                    </p>
                  </div>
                </div>
                <p className="mb-4 text-xs leading-relaxed font-medium text-slate-600 sm:text-sm">
                  For policy questions, details request, or correction tickets, contact our legal
                  representative:
                </p>
                <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center">
                  <div>
                    <span className="mb-0.5 block text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      Legal & DPO Email
                    </span>
                    <a
                      href="mailto:info@techsonance.co.in"
                      className="text-xs font-black text-[#1155CC] hover:underline sm:text-sm"
                    >
                      info@techsonance.co.in
                    </a>
                  </div>
                  <div className="text-right sm:text-left">
                    <span className="mb-0.5 block text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      Corporate HQ Address
                    </span>
                    <span className="text-[11px] font-bold text-slate-700">
                      UG-15, Palladium Plaza, Vip Road, Surat, Gujarat - 395007
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
