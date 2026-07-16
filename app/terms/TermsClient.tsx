"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import SiteHeader from "@/app/components/home/SiteHeader";
import SiteFooter from "@/app/components/home/SiteFooter";
import { Icon } from "@/app/components/icons/Icon";
import { ElegantShape } from "@/components/ui/shape-landing-hero";
import { cn } from "@/lib/utils";

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
      <main className="bg-[#FAFBFD] min-h-screen pt-24 pb-20 relative overflow-hidden font-medium">
        {/* Ambient background glows */}
        <div className={cn(
          "absolute top-0 left-0 bg-[#1155CC]/5 rounded-full blur-[100px] pointer-events-none",
          mounted && isMobile ? "w-[250px] h-[250px]" : "w-[500px] h-[500px]"
        )} />
        <div className={cn(
          "absolute top-[40%] right-0 bg-[#22B6F6]/5 rounded-full blur-[120px] pointer-events-none",
          mounted && isMobile ? "w-[300px] h-[300px]" : "w-[600px] h-[600px]"
        )} />

        {/* Hero Banner Header */}
        <section className="relative py-16 sm:py-24 overflow-hidden border-b border-[#1E293B] bg-gradient-to-br from-[#071A35] via-[#0F172A] to-[#0b2447] text-white">
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none">
            <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(#22B6F6 1.5px, transparent 1.5px)", backgroundSize: "24px 24px" }} />
          </div>

          {/* Floating Elegant Shapes */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <ElegantShape
              delay={0.4}
              width={mounted && isMobile ? 180 : 350}
              height={mounted && isMobile ? 55 : 110}
              rotate={-12}
              gradient="from-[#22B6F6]/25 to-transparent"
              className="left-[-5%] top-[15%]"
            />
            <ElegantShape
              delay={0.6}
              width={mounted && isMobile ? 220 : 420}
              height={mounted && isMobile ? 70 : 130}
              rotate={18}
              gradient="from-[#1155CC]/20 to-transparent"
              className="right-[-10%] bottom-[15%]"
            />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <motion.span
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-[10px] font-black tracking-[0.25em] text-[#22B6F6] uppercase bg-[#22B6F6]/10 px-3 py-1.5 rounded-full mb-4 inline-block"
            >
              Legal & Compliance
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl font-black font-sora text-white tracking-tight"
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
              className="mt-4 text-xs sm:text-sm font-semibold text-slate-350 max-w-xl mx-auto"
            >
              Effective Date: January 1, 2026 &bull; Last Updated: June 18, 2026
            </motion.p>
          </div>
        </section>

        {/* Main Content Layout */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 sm:mt-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

            {/* Sticky Navigation Sidebar (Desktop) */}
            <div className="hidden lg:block lg:col-span-4 sticky top-28 bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_15px_30px_rgba(17,85,204,0.02)]">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pb-3 mb-4 border-b border-slate-100">
                Table of Contents
              </h3>
              <nav className="flex flex-col gap-1">
                {termsSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-xs font-bold transition-all group ${activeSection === section.id
                        ? "bg-[#1155CC] text-white shadow-md shadow-[#1155CC]/10"
                        : "text-slate-600 hover:text-[#1155CC] hover:bg-slate-50"
                      }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full transition-all ${activeSection === section.id ? "bg-white scale-125" : "bg-slate-300 group-hover:bg-[#1155CC]"
                      }`} />
                    {section.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Terms and Conditions Main Content */}
            <div className="col-span-1 lg:col-span-8 space-y-8">

              {/* Domain & Ownership */}
              <div
                id="domain-ownership"
                className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-[0_15px_35px_rgba(17,85,204,0.02)]"
              >
                <div className="flex gap-4 items-start mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#1155CC]/5 text-[#1155CC] flex items-center justify-center shrink-0">
                    <Icon name="check" className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-slate-900 mb-1 font-sora">
                      Domain & Ownership
                    </h2>
                    <p className="text-xs font-semibold text-slate-400">
                      Company identifier and domain authority
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-4 text-xs font-semibold text-slate-700 space-y-2 font-bold">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Domain Name:</span>
                    <span className="text-[#1155CC]">www.techsonance.co.in</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Registered Entity:</span>
                    <span>TechSonance InfoTech LLP</span>
                  </div>
                </div>
                <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed">
                  This website is owned and managed by TechSonance InfoTech LLP. By accessing and using the www.techsonance.co.in website (the "Web Site"), you are agreeing to be legally bound by these Terms & Conditions. The terms "you" and "User" refer to anyone who accesses the Web Site.
                </p>
              </div>

              {/* Agreement to Terms */}
              <div
                id="agreement-terms"
                className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-[0_15px_35px_rgba(17,85,204,0.02)]"
              >
                <div className="flex gap-4 items-start mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#1155CC]/5 text-[#1155CC] flex items-center justify-center shrink-0">
                    <Icon name="bolt" className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-slate-900 mb-1 font-sora">
                      Agreement to Terms
                    </h2>
                    <p className="text-xs font-semibold text-slate-400">
                      Scope of terms & modifications
                    </p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed space-y-4">
                  As you browse through the website and TechSonance InfoTech LLP sites you may access other websites that are subject to different terms of use. When you use those sites, you will be legally bound by the specific terms of use posted on such sites. If there is a conflict between these Terms & Conditions and the other terms and conditions, the other terms & conditions will govern with respect to use of such pages.
                  <br /><br />
                  TechSonance InfoTech LLP may change these Terms & Conditions at any time without notice. Changes will be posted on the website under "Terms & Conditions". Your use of the Web Site after any changes have been posted will constitute your agreement to the modified Terms & Conditions and all of the changes.
                </p>
              </div>

              {/* 1. Use of the Web Site */}
              <div
                id="use-site"
                className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-[0_15px_35px_rgba(17,85,204,0.02)]"
              >
                <div className="flex gap-4 items-start mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#1155CC]/5 text-[#1155CC] flex items-center justify-center shrink-0">
                    <Icon name="code" className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-slate-900 mb-1 font-sora">
                      1. Use of the Web Site
                    </h2>
                    <p className="text-xs font-semibold text-slate-400">
                      License limits and IP ownership
                    </p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed mb-4">
                  TechSonance InfoTech LLP hereby grants you a non-exclusive, non-transferable, limited license to access and use the Web Site under the terms set forth below.
                </p>
                <ul className="space-y-3 text-xs sm:text-sm font-semibold text-slate-700 font-bold">
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1155CC] mt-2 shrink-0" />
                    <span><strong className="text-slate-800 font-bold">Commercial Limitation:</strong> The Content displayed on the Web Site may be used only for your personal and non-commercial use. You agree not to copy, reproduce, modify, or store any Content, in whole or in part, without the express prior written consent of TechSonance InfoTech LLP.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1155CC] mt-2 shrink-0" />
                    <span><strong className="text-slate-800 font-bold">IP Protections:</strong> All Content displayed on the Web Site is the exclusive property of TechSonance InfoTech LLP or its licensors, and is protected by copyright and trademark laws.</span>
                  </li>
                </ul>
              </div>

              {/* 2. Registration */}
              <div
                id="registration"
                className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-[0_15px_35px_rgba(17,85,204,0.02)]"
              >
                <div className="flex gap-4 items-start mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#1155CC]/5 text-[#1155CC] flex items-center justify-center shrink-0">
                    <Icon name="check" className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-slate-900 mb-1 font-sora">
                      2. Registration
                    </h2>
                    <p className="text-xs font-semibold text-slate-400">
                      Account security & integrity
                    </p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed font-bold">
                  As part of the registration process, you must select a username and password and provide the website with accurate, complete, and updated information. Failure to do so constitutes a breach of this Agreement, which may result in immediate termination of your access.
                </p>
              </div>

              {/* 3. Limitation of Liability */}
              <div
                id="liability-limit"
                className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-[0_15px_35px_rgba(17,85,204,0.02)]"
              >
                <div className="flex gap-4 items-start mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#1155CC]/5 text-[#1155CC] flex items-center justify-center shrink-0">
                    <Icon name="arrow" className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-slate-900 mb-1 font-sora">
                      3. Limitation of Liability
                    </h2>
                    <p className="text-xs font-semibold text-slate-400">
                      Disclaimers and "AS IS" clauses
                    </p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed mb-4">
                  THE CONTENT AND THE WEB SITE ARE PROVIDED "AS IS", WITHOUT ANY WARRANTIES. NEITHER TECHSONANCE INFOTECH LLP NOR ITS WEB PORTAL MAKES ANY GUARANTEES AS TO THE ACCURACY, COMPLETENESS, TIMELINESS OR RESULTS TO BE OBTAINED FROM ACCESSING AND USING THE WEB SITE.
                </p>
                <div className="p-4 bg-red-50/50 border border-red-100 rounded-2xl text-xs font-medium text-slate-650 leading-relaxed font-bold">
                  <strong className="text-slate-800">Software Disclosures:</strong> TechSonance InfoTech LLP assumes no responsibility for third party software on the website and shall have no liability to any person or entity for outcomes generated by such code integrations.
                </div>
              </div>

              {/* 4. Links to Other Web Sites */}
              <div
                id="external-links"
                className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-[0_15px_35px_rgba(17,85,204,0.02)]"
              >
                <div className="flex gap-4 items-start mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#1155CC]/5 text-[#1155CC] flex items-center justify-center shrink-0">
                    <Icon name="schema" className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-slate-900 mb-1 font-sora">
                      4. Links to Other Web Sites
                    </h2>
                    <p className="text-xs font-semibold text-slate-400">
                      Third-party hyperlink disclaimers
                    </p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed">
                  You may, through hyperlinks, gain access to websites operated by entities other than TechSonance. Such links are provided for reference only, and are the exclusive responsibility of their respective owners. TechSonance assumes no liability for external site content.
                </p>
              </div>

              {/* 5. The User's Content */}
              <div
                id="user-content"
                className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-[0_15px_35px_rgba(17,85,204,0.02)]"
              >
                <div className="flex gap-4 items-start mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#1155CC]/5 text-[#1155CC] flex items-center justify-center shrink-0">
                    <Icon name="database" className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-slate-900 mb-1 font-sora">
                      5. The User's Content
                    </h2>
                    <p className="text-xs font-semibold text-slate-400">
                      User inputs & indemnity guidelines
                    </p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed mb-4">
                  The User grants to TechSonance InfoTech LLP the non-exclusive right to use all material entered into the Web site by the User (excluding private email communications) in prints or electronic publications.
                </p>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-medium text-slate-650 leading-relaxed font-bold">
                  <strong className="text-slate-800">User Indemnity:</strong> The User agrees to indemnify and hold TechSonance InfoTech LLP and its representatives harmless from all damages, liabilities, costs, and expenses (including legal fees) arising from the User's breach of this Agreement.
                </div>
              </div>

              {/* 6. Payments, Cancellation & Refunds */}
              <div
                id="payments-refunds"
                className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-[0_15px_35px_rgba(17,85,204,0.02)]"
              >
                <div className="flex gap-4 items-start mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#1155CC]/5 text-[#1155CC] flex items-center justify-center shrink-0">
                    <Icon name="bolt" className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-slate-900 mb-1 font-sora">
                      6. Payments, Cancellation & Refunds
                    </h2>
                    <p className="text-xs font-semibold text-slate-400">
                      Financial transactions & policy
                    </p>
                  </div>
                </div>
                <ul className="space-y-3 text-xs sm:text-sm font-semibold text-slate-700 font-bold">
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1155CC] mt-2 shrink-0" />
                    <span><strong className="text-slate-800 font-bold">Non-Refundability:</strong> All reports, digital information assets, and portal access rights purchased on the website are non-refundable.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1155CC] mt-2 shrink-0" />
                    <span><strong className="text-slate-800 font-bold">Transaction Decline Disclosures:</strong> TechSonance InfoTech LLP holds no liability for transaction failures or declines resulting from cardholders exceeding preset acquiring bank limits.</span>
                  </li>
                </ul>
              </div>

              {/* 7. Additional Legal Terms */}
              <div
                id="legal-terms"
                className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-[0_15px_35px_rgba(17,85,204,0.02)]"
              >
                <div className="flex gap-4 items-start mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#1155CC]/5 text-[#1155CC] flex items-center justify-center shrink-0">
                    <Icon name="check" className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-slate-900 mb-1 font-sora">
                      7. Additional Legal Terms
                    </h2>
                    <p className="text-xs font-semibold text-slate-400">
                      Governing law & jurisdictions
                    </p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed mb-4">
                  This Agreement will continue until terminated by either party. Either party can terminate by sending an email or phone notification to the other party.
                </p>
                <div className="p-4 bg-blue-50/30 border border-blue-100/50 rounded-2xl text-xs font-semibold text-slate-750 font-bold">
                  <strong className="text-[#1155CC] block mb-1">Governing Law</strong>
                  This Agreement, your rights and obligations, and all actions contemplated by this Agreement shall be governed by the laws of India and subject to the jurisdiction of courts in <span className="underline">Surat, Gujarat</span>.
                </div>
              </div>

              {/* 8. Anti-Hacking Provisions */}
              <div
                id="anti-hacking"
                className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-[0_15px_35px_rgba(17,85,204,0.02)]"
              >
                <div className="flex gap-4 items-start mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#1155CC]/5 text-[#1155CC] flex items-center justify-center shrink-0">
                    <Icon name="arrow" className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-slate-900 mb-1 font-sora">
                      8. Anti-Hacking Provisions
                    </h2>
                    <p className="text-xs font-semibold text-slate-400">
                      Prohibited automated actions
                    </p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed mb-4">
                  You agree not to bypass, attack, or crawl our servers. Prohibited actions include:
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-slate-700 font-bold">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    Automated data scrapers & bots
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    Circumventing firewall rules
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    Bypassing portal authentication
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    Hacking or password mining
                  </li>
                </ul>
              </div>

              {/* Questions */}
              <div
                id="questions"
                className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-[0_15px_35px_rgba(17,85,204,0.02)]"
              >
                <div className="flex gap-4 items-start mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#1155CC]/5 text-[#1155CC] flex items-center justify-center shrink-0">
                    <Icon name="arrow" className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-slate-900 mb-1 font-sora">
                      Questions & Support
                    </h2>
                    <p className="text-xs font-semibold text-slate-400">
                      Resolve compliance inquiries
                    </p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed mb-4">
                  If there are any questions regarding these Terms & Conditions, you may contact us using the information below:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-750 font-bold">
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <span className="text-slate-400 block mb-0.5">Corporate Email</span>
                    <a href="mailto:hr@techsonance.co.in" className="text-[#1155CC] font-bold hover:underline font-bold">
                      hr@techsonance.co.in
                    </a>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <span className="text-slate-400 block mb-0.5">Corporate Phone</span>
                    <a href="tel:+919173101711" className="text-[#1155CC] font-bold hover:underline font-bold">
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
