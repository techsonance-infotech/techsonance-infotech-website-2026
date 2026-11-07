"use client";

import React, { useState } from "react";
import { LazyMotion, domAnimation } from "motion/react";
import SiteHeader from "@/app/components/home/SiteHeader";
import SiteFooter from "@/app/components/home/SiteFooter";
import AboutHero from "@/app/components/about/AboutHero";
import BookConsultationModal from "@/app/components/home/BookConsultationModal";
import { AboutImpactMetrics } from "@/app/components/about/AboutImpactMetrics";
import { AboutEngineeringDna } from "@/app/components/about/AboutEngineeringDna";
import { AboutProjectsShowcase } from "@/app/components/about/AboutProjectsShowcase";
import { AboutProcessTimeline } from "@/app/components/about/AboutProcessTimeline";
import { AboutTechEcosystem } from "@/app/components/about/AboutTechEcosystem";
import { AboutFounderStory } from "@/app/components/about/AboutFounderStory";
import { AboutTrustCredibility } from "@/app/components/about/AboutTrustCredibility";
import { AboutCtaSection } from "@/app/components/about/AboutCtaSection";

export default function AboutClient() {
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  return (
    <LazyMotion features={domAnimation}>
      <SiteHeader transparent={true} />
      <main className="relative min-h-screen overflow-x-clip bg-[#FAFBFD] font-sans text-slate-900">
        <AboutHero />
        <AboutImpactMetrics />
        <AboutEngineeringDna />
        <AboutProjectsShowcase />
        <AboutProcessTimeline />
        <AboutTechEcosystem />
        <AboutFounderStory />
        <AboutTrustCredibility />
        <AboutCtaSection onBookCall={() => setIsBookModalOpen(true)} />
        <SiteFooter />
      </main>

      <BookConsultationModal isOpen={isBookModalOpen} onClose={() => setIsBookModalOpen(false)} />
    </LazyMotion>
  );
}
