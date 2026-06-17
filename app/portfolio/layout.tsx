import type { Metadata } from "next";
import SiteHeader from "@/app/components/home/SiteHeader";
import SiteFooter from "@/app/components/home/SiteFooter";

export const metadata: Metadata = {
  title: "Portfolio & Case Studies | TechSonance Infotech",
  description:
    "Explore our portfolio of enterprise-grade SaaS platforms, POS systems, e-commerce marketplaces, and AI-powered tools - built by TechSonance Infotech.",
  openGraph: {
    title: "Portfolio & Case Studies | TechSonance Infotech",
    description: "Real products. Real challenges. Real results.",
    type: "website",
  },
};

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FBFF] text-[#0F172A]">
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
