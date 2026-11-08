"use client";

import React, { useState, useSyncExternalStore } from "react";
import { motion } from "motion/react";
import SiteHeader from "@/app/components/home/SiteHeader";
import SiteFooter from "@/app/components/home/SiteFooter";
import { Icon } from "@/app/components/icons/Icon";
import { ElegantShape } from "@/components/ui/shape-landing-hero";
import { cn } from "@/lib/utils";

const subscribeResize = (callback: () => void) => {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
};

const termsSections = [
  { id: "domain-ownership", label: "Domain & Ownership", icon: "check" },
  { id: "agreement-terms", label: "Agreement to Terms", icon: "bolt" },
  { id: "use-site", label: "1. Use of the Web Site", icon: "code" },
  { id: "registration", label: "2. Registration", icon: "check" },
  { id: "liability-limit", label: "3. Limitation of Liability", icon: "arrow" },
  { id: "external-links", label: "4. Links to Other Sites", icon: "schema" },
  { id: "user-content", label: "5. The User's Content", icon: "database" },
  { id: "payments-refunds", label: "6. Payments & Refunds", icon: "bolt" },
  { id: "legal-terms", label: "7. Additional Legal Terms", icon: "check" },
  { id: "anti-hacking", label: "8. Anti-Hacking Provisions", icon: "arrow" },
  { id: "questions", label: "Questions & Support", icon: "arrow" },
];

export default function TermsClient() {
  const isMobile = useSyncExternalStore(
    subscribeResize,
    () => window.innerWidth < 768,
    () => false,
  );

  const [activeSection, setActiveSection] = useState("domain-ownership");

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
      <main className="relative min-h-screen overflow-hidden bg-[#FAFBFD] pt-24 pb-20 font-medium">
        {/* Ambient background glows */}
        <div
          className={cn(
            "pointer-events-none absolute top-0 left-0 rounded-full bg-[#1155CC]/5 blur-[100px]",
            isMobile ? "h-[250px] w-[250px]" : "h-[500px] w-[500px]",
          )}
        />
        <div
          className={cn(
            "pointer-events-none absolute top-[40%] right-0 rounded-full bg-[#22B6F6]/5 blur-[120px]",
            isMobile ? "h-[300px] w-[300px]" : "h-[600px] w-[600px]",
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
              delay={0.4}
              width={isMobile ? 180 : 350}
              height={isMobile ? 55 : 110}
              rotate={-12}
              gradient="from-[#22B6F6]/25 to-transparent"
              className="top-[15%] left-[-5%]"
            />
            <ElegantShape
              delay={0.6}
              width={isMobile ? 220 : 420}
              height={isMobile ? 70 : 130}
              rotate={18}
              gradient="from-[#1155CC]/20 to-transparent"
              className="right-[-10%] bottom-[15%]"
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
              Terms &{" "}
              <span className="bg-gradient-to-r from-[#22B6F6] to-[#00E5FF] bg-clip-text text-transparent">
                Conditions
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mx-auto mt-4 max-w-xl text-xs font-semibold text-slate-300 sm:text-sm"
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
                {termsSections.map((section) => (
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

            {/* Terms and Conditions Main Content */}
            <div className="col-span-1 space-y-8 lg:col-span-8">
              {/* Domain & Ownership */}
              <div
                id="domain-ownership"
                className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_15px_35px_rgba(17,85,204,0.02)] sm:p-8"
              >
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1155CC]/5 text-[#1155CC]">
                    <Icon name="check" className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="mb-1 font-sora text-lg font-medium text-slate-900">
                      Domain & Ownership
                    </h2>
                    <p className="text-xs font-semibold text-slate-400">
                      Company identifier and domain authority
                    </p>
                  </div>
                </div>
                <div className="mb-4 space-y-2 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs font-semibold text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Domain Name:</span>
                    <span className="text-[#1155CC]">www.techsonance.co.in</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Registered Entity:</span>
                    <span>TechSonance InfoTech LLP</span>
                  </div>
                </div>
                <p className="text-xs leading-relaxed font-medium text-slate-600 sm:text-sm">
                  This website is owned and managed by TechSonance InfoTech LLP. By accessing and
                  using the www.techsonance.co.in website (the "Web Site"), you are agreeing to be
                  legally bound by these Terms & Conditions. The terms "you" and "User" refer to
                  anyone who accesses the Web Site.
                </p>
              </div>

              {/* Agreement to Terms */}
              <div
                id="agreement-terms"
                className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_15px_35px_rgba(17,85,204,0.02)] sm:p-8"
              >
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1155CC]/5 text-[#1155CC]">
                    <Icon name="bolt" className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="mb-1 font-sora text-lg font-medium text-slate-900">
                      Agreement to Terms
                    </h2>
                    <p className="text-xs font-semibold text-slate-400">
                      Scope of terms & modifications
                    </p>
                  </div>
                </div>
                <p className="space-y-4 text-xs leading-relaxed font-medium text-slate-600 sm:text-sm">
                  As you browse through the website and TechSonance InfoTech LLP sites you may
                  access other websites that are subject to different terms of use. When you use
                  those sites, you will be legally bound by the specific terms of use posted on such
                  sites. If there is a conflict between these Terms & Conditions and the other terms
                  and conditions, the other terms & conditions will govern with respect to use of
                  such pages.
                  <br />
                  <br />
                  TechSonance InfoTech LLP may change these Terms & Conditions at any time without
                  notice. Changes will be posted on the website under "Terms & Conditions". Your use
                  of the Web Site after any changes have been posted will constitute your agreement
                  to the modified Terms & Conditions and all of the changes.
                </p>
              </div>

              {/* 1. Use of the Web Site */}
              <div
                id="use-site"
                className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_15px_35px_rgba(17,85,204,0.02)] sm:p-8"
              >
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1155CC]/5 text-[#1155CC]">
                    <Icon name="code" className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="mb-1 font-sora text-lg font-medium text-slate-900">
                      1. Use of the Web Site
                    </h2>
                    <p className="text-xs font-semibold text-slate-400">
                      License limits and IP ownership
                    </p>
                  </div>
                </div>
                <p className="mb-4 text-xs leading-relaxed font-medium text-slate-600 sm:text-sm">
                  TechSonance InfoTech LLP hereby grants you a non-exclusive, non-transferable,
                  limited license to access and use the Web Site under the terms set forth below.
                </p>
                <ul className="space-y-3 text-xs font-semibold text-slate-700 sm:text-sm">
                  <li className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1155CC]" />
                    <span>
                      <strong className="font-bold text-slate-800">Commercial Limitation:</strong>{" "}
                      The Content displayed on the Web Site may be used only for your personal and
                      non-commercial use. You agree not to copy, reproduce, modify, or store any
                      Content, in whole or in part, without the express prior written consent of
                      TechSonance InfoTech LLP.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1155CC]" />
                    <span>
                      <strong className="font-bold text-slate-800">IP Protections:</strong> All
                      Content displayed on the Web Site is the exclusive property of TechSonance
                      InfoTech LLP or its licensors, and is protected by copyright and trademark
                      laws.
                    </span>
                  </li>
                </ul>
              </div>

              {/* 2. Registration */}
              <div
                id="registration"
                className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_15px_35px_rgba(17,85,204,0.02)] sm:p-8"
              >
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1155CC]/5 text-[#1155CC]">
                    <Icon name="check" className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="mb-1 font-sora text-lg font-medium text-slate-900">
                      2. Registration
                    </h2>
                    <p className="text-xs font-semibold text-slate-400">
                      Account security & integrity
                    </p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed font-medium text-slate-600 sm:text-sm">
                  As part of the registration process, you must select a username and password and
                  provide the website with accurate, complete, and updated information. Failure to
                  do so constitutes a breach of this Agreement, which may result in immediate
                  termination of your access.
                </p>
              </div>

              {/* 3. Limitation of Liability */}
              <div
                id="liability-limit"
                className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_15px_35px_rgba(17,85,204,0.02)] sm:p-8"
              >
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1155CC]/5 text-[#1155CC]">
                    <Icon name="arrow" className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="mb-1 font-sora text-lg font-medium text-slate-900">
                      3. Limitation of Liability
                    </h2>
                    <p className="text-xs font-semibold text-slate-400">
                      Disclaimers and "AS IS" clauses
                    </p>
                  </div>
                </div>
                <p className="mb-4 text-xs leading-relaxed font-medium text-slate-600 sm:text-sm">
                  THE CONTENT AND THE WEB SITE ARE PROVIDED "AS IS", WITHOUT ANY WARRANTIES. NEITHER
                  TECHSONANCE INFOTECH LLP NOR ITS WEB PORTAL MAKES ANY GUARANTEES AS TO THE
                  ACCURACY, COMPLETENESS, TIMELINESS OR RESULTS TO BE OBTAINED FROM ACCESSING AND
                  USING THE WEB SITE.
                </p>
                <div className="rounded-2xl border border-red-100 bg-red-50/50 p-4 text-xs leading-relaxed font-medium text-slate-600">
                  <strong className="text-slate-800">Software Disclosures:</strong> TechSonance
                  InfoTech LLP assumes no responsibility for third party software on the website and
                  shall have no liability to any person or entity for outcomes generated by such
                  code integrations.
                </div>
              </div>

              {/* 4. Links to Other Web Sites */}
              <div
                id="external-links"
                className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_15px_35px_rgba(17,85,204,0.02)] sm:p-8"
              >
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1155CC]/5 text-[#1155CC]">
                    <Icon name="schema" className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="mb-1 font-sora text-lg font-medium text-slate-900">
                      4. Links to Other Web Sites
                    </h2>
                    <p className="text-xs font-semibold text-slate-400">
                      Third-party hyperlink disclaimers
                    </p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed font-medium text-slate-600 sm:text-sm">
                  You may, through hyperlinks, gain access to websites operated by entities other
                  than TechSonance. Such links are provided for reference only, and are the
                  exclusive responsibility of their respective owners. TechSonance assumes no
                  liability for external site content.
                </p>
              </div>

              {/* 5. The User's Content */}
              <div
                id="user-content"
                className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_15px_35px_rgba(17,85,204,0.02)] sm:p-8"
              >
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1155CC]/5 text-[#1155CC]">
                    <Icon name="database" className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="mb-1 font-sora text-lg font-medium text-slate-900">
                      5. The User's Content
                    </h2>
                    <p className="text-xs font-semibold text-slate-400">
                      User inputs & indemnity guidelines
                    </p>
                  </div>
                </div>
                <p className="mb-4 text-xs leading-relaxed font-medium text-slate-600 sm:text-sm">
                  The User grants to TechSonance InfoTech LLP the non-exclusive right to use all
                  material entered into the Web site by the User (excluding private email
                  communications) in prints or electronic publications.
                </p>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs leading-relaxed font-medium text-slate-600">
                  <strong className="text-slate-800">User Indemnity:</strong> The User agrees to
                  indemnify and hold TechSonance InfoTech LLP and its representatives harmless from
                  all damages, liabilities, costs, and expenses (including legal fees) arising from
                  the User's breach of this Agreement.
                </div>
              </div>

              {/* 6. Payments, Cancellation & Refunds */}
              <div
                id="payments-refunds"
                className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_15px_35px_rgba(17,85,204,0.02)] sm:p-8"
              >
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1155CC]/5 text-[#1155CC]">
                    <Icon name="bolt" className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="mb-1 font-sora text-lg font-medium text-slate-900">
                      6. Payments, Cancellation & Refunds
                    </h2>
                    <p className="text-xs font-semibold text-slate-400">
                      Financial transactions & policy
                    </p>
                  </div>
                </div>
                <ul className="space-y-3 text-xs font-semibold text-slate-700 sm:text-sm">
                  <li className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1155CC]" />
                    <span>
                      <strong className="font-bold text-slate-800">Non-Refundability:</strong> All
                      reports, digital information assets, and portal access rights purchased on the
                      website are non-refundable.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1155CC]" />
                    <span>
                      <strong className="font-bold text-slate-800">
                        Transaction Decline Disclosures:
                      </strong>{" "}
                      TechSonance InfoTech LLP holds no liability for transaction failures or
                      declines resulting from cardholders exceeding preset acquiring bank limits.
                    </span>
                  </li>
                </ul>
              </div>

              {/* 7. Additional Legal Terms */}
              <div
                id="legal-terms"
                className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_15px_35px_rgba(17,85,204,0.02)] sm:p-8"
              >
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1155CC]/5 text-[#1155CC]">
                    <Icon name="check" className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="mb-1 font-sora text-lg font-medium text-slate-900">
                      7. Additional Legal Terms
                    </h2>
                    <p className="text-xs font-semibold text-slate-400">
                      Governing law & jurisdictions
                    </p>
                  </div>
                </div>
                <p className="mb-4 text-xs leading-relaxed font-medium text-slate-600 sm:text-sm">
                  This Agreement will continue until terminated by either party. Either party can
                  terminate by sending an email or phone notification to the other party.
                </p>
                <div className="rounded-2xl border border-blue-100/50 bg-blue-50/30 p-4 text-xs font-semibold text-slate-700">
                  <strong className="mb-1 block text-[#1155CC]">Governing Law</strong>
                  This Agreement, your rights and obligations, and all actions contemplated by this
                  Agreement shall be governed by the laws of India and subject to the jurisdiction
                  of courts in <span className="underline">Surat, Gujarat</span>.
                </div>
              </div>

              {/* 8. Anti-Hacking Provisions */}
              <div
                id="anti-hacking"
                className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_15px_35px_rgba(17,85,204,0.02)] sm:p-8"
              >
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1155CC]/5 text-[#1155CC]">
                    <Icon name="arrow" className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="mb-1 font-sora text-lg font-medium text-slate-900">
                      8. Anti-Hacking Provisions
                    </h2>
                    <p className="text-xs font-semibold text-slate-400">
                      Prohibited automated actions
                    </p>
                  </div>
                </div>
                <p className="mb-4 text-xs leading-relaxed font-medium text-slate-600 sm:text-sm">
                  You agree not to bypass, attack, or crawl our servers. Prohibited actions include:
                </p>
                <ul className="grid grid-cols-1 gap-2 text-xs font-semibold text-slate-700 sm:grid-cols-2">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                    Automated data scrapers & bots
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                    Circumventing firewall rules
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                    Bypassing portal authentication
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                    Hacking or password mining
                  </li>
                </ul>
              </div>

              {/* Questions */}
              <div
                id="questions"
                className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_15px_35px_rgba(17,85,204,0.02)] sm:p-8"
              >
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1155CC]/5 text-[#1155CC]">
                    <Icon name="arrow" className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="mb-1 font-sora text-lg font-medium text-slate-900">
                      Questions & Support
                    </h2>
                    <p className="text-xs font-semibold text-slate-400">
                      Resolve compliance inquiries
                    </p>
                  </div>
                </div>
                <p className="mb-4 text-xs leading-relaxed font-medium text-slate-600 sm:text-sm">
                  If there are any questions regarding these Terms & Conditions, you may contact us
                  using the information below:
                </p>
                <div className="grid grid-cols-1 gap-4 text-xs font-semibold text-slate-700 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <span className="mb-0.5 block text-slate-400">Corporate Email</span>
                    <a
                      href="mailto:hr@techsonance.co.in"
                      className="font-bold text-[#1155CC] hover:underline"
                    >
                      hr@techsonance.co.in
                    </a>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <span className="mb-0.5 block text-slate-400">Corporate Phone</span>
                    <a
                      href="tel:+919173101711"
                      className="font-bold font-bold text-[#1155CC] hover:underline"
                    >
                      +91 9173101711
                    </a>
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
