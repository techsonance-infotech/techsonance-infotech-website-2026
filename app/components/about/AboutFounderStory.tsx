"use client";

import React from "react";
import Image from "next/image";

export function AboutFounderStory() {
  return (
    <section className="border-b border-slate-100 bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left Column: Image in Circle + Statistics Card */}
          <div className="relative flex flex-col items-center pt-20 lg:col-span-4">
            <div className="relative flex w-full flex-col items-center rounded-[32px] border border-blue-100/60 bg-gradient-to-b from-[#F8FAFC] to-[#EFF6FF] p-6 pt-28 text-center shadow-[0_12px_40px_rgba(17,85,204,0.03)]">
              {/* Circular Image positioned on the upper side, offset upwards */}
              <div className="group absolute -top-22 left-1/2 h-44 w-44 -translate-x-1/2 overflow-hidden rounded-full border-4 border-white bg-slate-50 shadow-[0_8px_25px_rgba(17,85,204,0.08)]">
                <Image
                  src="/images/about-headshot-v2.png"
                  alt="Someshwari Adeya Founder"
                  fill
                  sizes="176px"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />
              </div>

              {/* Statistics Grid */}
              <div className="grid w-full grid-cols-2 gap-4 border-t border-blue-100/50 pt-5 text-left">
                <div className="border-r border-blue-100/80 pr-2">
                  <h5 className="text-lg font-medium text-[#1155CC]">10+</h5>
                  <p className="mt-1 text-[9.5px] leading-snug font-bold tracking-wider text-slate-400 uppercase">
                    Engineers & Designers
                  </p>
                </div>
                <div className="pl-2">
                  <h5 className="text-lg font-medium text-slate-800">90%+</h5>
                  <p className="mt-1 text-[9.5px] leading-snug font-bold tracking-wider text-slate-400 uppercase">
                    Client Retention Rate
                  </p>
                </div>
                <div className="border-t border-r border-blue-100/80 pt-3 pr-2">
                  <h5 className="text-lg font-medium text-slate-800">98%</h5>
                  <p className="mt-1 text-[9.5px] leading-snug font-bold tracking-wider text-slate-400 uppercase">
                    On-Time Delivery
                  </p>
                </div>
                <div className="border-t border-blue-100/80 pt-3 pl-2">
                  <h5 className="text-lg font-medium text-slate-800">&lt; 2h</h5>
                  <p className="mt-1 text-[9.5px] leading-snug font-bold tracking-wider text-slate-400 uppercase">
                    Support Response Time
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Founder Narrative */}
          <div className="text-left lg:col-span-8">
            <span className="text-[10px] font-bold tracking-widest text-[#1155CC] uppercase">
              Our Story
            </span>
            <h3 className="mt-1 mb-6 text-3xl font-medium tracking-tight text-gray-900 sm:text-4xl">
              Built by Engineers. <br />
              Focused on Business Impact.
            </h3>

            <div className="space-y-4 text-xs leading-relaxed font-medium text-slate-500 sm:text-sm">
              <p>
                At TechSonance, we started as software engineers who wanted to build code that
                directly improved business outcomes. We saw that legacy platforms were often built
                on generic templates, slow database configurations, and rigid structures that
                didn&apos;t adapt to real operational workflows.
              </p>
              <p>
                We built our agency to do the opposite: to deliver custom database design,
                automated pipeline runs, type-safe API routers, and clean interfaces that feel modern
                and scale seamlessly.
              </p>
              <p>
                Today, we collaborate directly with tech leadership and company founders, taking
                ownership of development complexity so you can focus on scale.
              </p>
            </div>

            <div className="mt-8 flex items-center gap-4 border-t border-slate-100 pt-6">
              <div>
                <h4 className="text-sm font-bold text-slate-800">Someshwari Adeya</h4>
                <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  Founder & CEO, TechSonance
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
