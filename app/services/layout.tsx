import type { Metadata } from "next";
import SiteHeader from "@/app/components/home/SiteHeader";
import SiteFooter from "@/app/components/home/SiteFooter";

export const metadata: Metadata = {
  title: "Services | TechSonance Infotech - AI & Custom Software Engineering",
  description:
    "From custom software and AI automation to SaaS products and cloud infrastructure - TechSonance engineers end-to-end digital solutions that help your business grow.",
  openGraph: {
    title: "Services | TechSonance Infotech",
    description: "AI & Custom Software Engineering Partner - 8 specialised service lines.",
    type: "website",
  },
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAFBFD] text-[#0F172A]">
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
