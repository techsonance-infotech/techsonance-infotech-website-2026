import SiteHeader from "./components/home/SiteHeader";
import HeroSection from "./components/home/HeroSection";
import VisionSection from "./components/home/VisionSection";
import ServicesSection from "./components/home/ServicesSection";
import FeaturedProjectsSection from "./components/FeaturedProjectsSection";
import Testimonials from "@/components/ui/testimonials";
import WhyChooseSection from "./components/home/WhyChooseSection";
import TechnologiesSection from "./components/home/TechnologiesSection";
import ScopingContactForm from "@/app/components/services/ScopingContactForm";
import SiteFooter from "./components/home/SiteFooter";
import { SEO_METADATA } from "@/lib/seo-aeo-geo-config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: SEO_METADATA.home.title,
  description: SEO_METADATA.home.description,
  keywords: SEO_METADATA.home.keywords,
  alternates: {
    canonical: SEO_METADATA.home.canonical,
  },
  openGraph: {
    title: SEO_METADATA.home.ogTitle,
    description: SEO_METADATA.home.ogDescription,
    url: SEO_METADATA.home.canonical,
    images: [{ url: SEO_METADATA.home.ogImage }],
  },
};

export default function Home() {
  return (
    <>
      <SiteHeader transparent={true} />
      <main className="min-h-screen overflow-x-clip bg-[#FAFBFD] text-[#0F172A]">
      <HeroSection />
      <VisionSection />
      <ServicesSection />
      <FeaturedProjectsSection />
      <WhyChooseSection />
      <Testimonials />
      <TechnologiesSection />
      <section id="project-request" className="py-20 bg-[#FAFBFD]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScopingContactForm />
        </div>
      </section>
      <SiteFooter />
    </main>
  </>
  );
}
