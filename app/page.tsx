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

export default function Home() {
  return (
    <>
      <SiteHeader transparent={true} />
      <main className="min-h-screen overflow-x-clip bg-[#F8FBFF] text-[#0F172A]">
      <HeroSection />
      <VisionSection />
      <ServicesSection />
      <FeaturedProjectsSection />
      <WhyChooseSection />
      <Testimonials />
      <TechnologiesSection />
      <section id="project-request" className="py-20 bg-[#F8FBFF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScopingContactForm />
        </div>
      </section>
      <SiteFooter />
    </main>
  </>
  );
}
