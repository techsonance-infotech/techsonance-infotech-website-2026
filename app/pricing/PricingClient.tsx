"use client";

import React, { useState } from "react";
import SiteHeader from "@/app/components/home/SiteHeader";
import SiteFooter from "@/app/components/home/SiteFooter";
import BookConsultationModal from "@/app/components/home/BookConsultationModal";
import { PricingHero } from "@/app/components/pricing/PricingHero";
import { PricingPlansSection } from "@/app/components/pricing/PricingPlansSection";
import { PricingCalculator } from "@/app/components/pricing/PricingCalculator";
import { PricingComparison } from "@/app/components/pricing/PricingComparison";
import { PricingFaqSection } from "@/app/components/pricing/PricingFaqSection";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export default function PricingClient() {
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);

  return (
    <>
      <SiteHeader transparent={true} />
      <main className="min-h-screen overflow-x-clip bg-[#FAFBFD] font-sans text-slate-900">
        <PricingHero />
        <PricingPlansSection onSelectPlan={() => setIsConsultationOpen(true)} />
        <PricingCalculator onBookPod={() => setIsConsultationOpen(true)} />
        <PricingComparison />
        <PricingFaqSection />

        {/* Bottom CTA Banner */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-[#0B2347] to-[#1155CC] px-6 py-12 text-center text-white shadow-xl sm:px-12 sm:py-16">
              <div className="relative z-10 mx-auto max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur-xs">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Custom Engineering Scope</span>
                </div>
                <h2 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-4xl">
                  Need a Tailored Architectural Estimate?
                </h2>
                <p className="mt-3 text-xs leading-relaxed text-blue-100 sm:text-sm">
                  Schedule a confidential 30-minute scoping call with our Technical Director to
                  review your requirements, tech stack, and deliverable timeline.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                  <Button
                    onClick={() => setIsConsultationOpen(true)}
                    variant="primary"
                    size="lg"
                    className="bg-white font-bold text-[#1155CC] hover:bg-slate-100"
                  >
                    <span>Schedule Free Consultation</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <SiteFooter />
      </main>

      <BookConsultationModal
        isOpen={isConsultationOpen}
        onClose={() => setIsConsultationOpen(false)}
      />
    </>
  );
}
