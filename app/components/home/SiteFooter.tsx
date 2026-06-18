"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Icon, type IconName } from "@/app/components/icons/Icon";
import { services } from "@/data/services";

export default function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#030712] text-slate-400 border-t border-slate-900 pt-20 pb-12 relative overflow-hidden">
      {/* Ambient glowing gradients */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-tr from-[#1155CC]/5 to-transparent rounded-full blur-3xl opacity-40 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-bl from-[#22B6F6]/5 to-transparent rounded-full blur-3xl opacity-30 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-16 border-b border-slate-900">
          
          {/* Column 1: Brand details */}
          <div className="lg:col-span-4 flex flex-col justify-between">
            <div>
              <Link href="/" className="flex items-center gap-3 mb-6 self-start group">
                 <Image
                  src="/images/logo-icon.png"
                  alt="TechSonance logo"
                  width={56}
                  height={56}
                  className="h-14 w-14 object-contain transition-transform duration-300 group-hover:scale-105"
                />
                <div className="flex flex-col items-center">
                  <span className="block text-[22px] font-bold font-sora leading-none tracking-[0.04em]">
                    <span className="text-white">TECH</span>
                    <span className="bg-gradient-to-r from-[#1155CC] to-[#22B6F6] bg-clip-text text-transparent">SONΛNCE</span>
                  </span>
                  <span className="w-full flex items-center gap-2 text-[10px] font-medium font-sans uppercase tracking-[0.25em] text-[#94A3B8] mt-0.5">
                    <span className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[#475569]" />
                    INFOTECH LLP
                    <span className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[#475569]" />
                  </span>
                  <span className="block text-[8.5px] font-bold font-sans uppercase tracking-[0.28em] text-slate-400 mt-1 text-center">
                    INNOVATE <span className="text-[#22B6F6] font-bold">•</span> INTEGRATE <span className="text-[#22B6F6] font-bold">•</span> ELEVATE
                  </span>
                </div>
              </Link>
              
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                Engineering high-performance enterprise custom platforms, multi-tenant SaaS products, and agentic AI automation workflows. Built on robust types, scalability, and 99.9% reliability.
              </p>
            </div>

            {/* Social channels */}
            <div className="mt-8 flex items-center gap-3.5">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-600 hover:bg-slate-800/80 transition-all text-xs"
                aria-label="LinkedIn Profile"
              >
                in
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-600 hover:bg-slate-800/80 transition-all text-xs"
                aria-label="GitHub Profile"
              >
                git
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-600 hover:bg-slate-800/80 transition-all text-xs"
                aria-label="Twitter X Profile"
              >
                𝕏
              </a>
              <a
                href="mailto:info@techsonance.co.in"
                className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-600 hover:bg-slate-800/80 transition-all text-xs"
                aria-label="Send Email"
              >
                @
              </a>
            </div>
          </div>

          {/* Column 2: Core services */}
          <div className="lg:col-span-3 lg:pl-6">
            <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-5">
              Expertise & Services
            </h3>
            <ul className="space-y-3.5 text-xs">
              {services.slice(0, 6).map((service) => (
                <li key={service.slug}>
                  <Link
                    href={`/services/${service.slug}`}
                    className="text-slate-400 hover:text-[#22B6F6] transition-colors hover:translate-x-0.5 inline-block"
                  >
                    {service.shortTitle || service.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Navigation */}
          <div className="lg:col-span-2">
            <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-5">
              Corporate Directory
            </h3>
            <ul className="space-y-3.5 text-xs">
              <li>
                <Link href="/services" className="text-slate-400 hover:text-[#22B6F6] transition-colors">
                  Our Services
                </Link>
              </li>
              <li>
                <Link href="/portfolio" className="text-slate-400 hover:text-[#22B6F6] transition-colors">
                  Case Studies
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-slate-400 hover:text-[#22B6F6] transition-colors">
                  About the Agency
                </Link>
              </li>
              <li>
                <a
                  href="https://cal.id/techsonance-infotech/connect-with-founder?duration=15"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-[#22B6F6] transition-colors"
                >
                  Book Scoping Call
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-[#22B6F6] transition-colors">
                  Careers (We're Hiring)
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact/Newsletter info */}
          <div className="lg:col-span-3">
            <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-5">
              Contact Tech Lead
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Schedule a tech scoping session to review your product design, system flowcharts, and architecture roadmap.
            </p>
            <a
              href="https://cal.id/techsonance-infotech/connect-with-founder?duration=15"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-white hover:bg-slate-800 hover:border-slate-700 transition-all shadow-md group"
            >
              Book Free Session
              <Icon name="arrow" className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-all transform group-hover:translate-x-0.5" />
            </a>
            <div className="mt-6 text-[10px] text-slate-500 leading-relaxed">
              Office Hours: Mon - Fri, 9AM - 6PM IST <br />
              Standard response timeline: 24 Hours
            </div>
          </div>

        </div>

        {/* Lower row: copyright & compliance */}
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-5 text-[11px] text-slate-500">
          <div>
            © {currentYear} TechSonance Infotech LLP. All rights reserved.
          </div>
          <div className="flex flex-wrap gap-5 justify-center sm:justify-end">
            <a href="#" className="hover:text-slate-350 transition-colors">Privacy Policy</a>
            <span className="text-slate-800">•</span>
            <a href="#" className="hover:text-slate-350 transition-colors">Terms of Service</a>
            <span className="text-slate-800">•</span>
            <a href="#" className="hover:text-slate-350 transition-colors">SLA Agreement</a>
            <span className="text-slate-800">•</span>
            <a href="#" className="hover:text-slate-350 transition-colors">Security Guard</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
