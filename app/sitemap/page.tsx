"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import SiteHeader from "@/app/components/home/SiteHeader";
import SiteFooter from "@/app/components/home/SiteFooter";
import { Icon } from "@/app/components/icons/Icon";
import { ElegantShape } from "@/components/ui/shape-landing-hero";
import { services } from "@/data/services";
import { projects } from "@/data/projects";
import { blogPosts } from "@/data/blog";
import { cn } from "@/lib/utils";

export default function SitemapPage() {
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
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <>
      <SiteHeader transparent={true} />
      <main className="bg-[#FAFBFD] min-h-screen pt-24 pb-20 relative overflow-hidden">
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
              delay={0.3}
              width={mounted && isMobile ? 200 : 400}
              height={mounted && isMobile ? 60 : 120}
              rotate={12}
              gradient="from-[#1155CC]/20 to-transparent"
              className="left-[-10%] top-[10%]"
            />
            <ElegantShape
              delay={0.5}
              width={mounted && isMobile ? 150 : 300}
              height={mounted && isMobile ? 50 : 100}
              rotate={-15}
              gradient="from-[#22B6F6]/25 to-transparent"
              className="right-[-5%] bottom-[10%]"
            />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <motion.span
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-[10px] font-black tracking-[0.25em] text-[#22B6F6] uppercase bg-[#22B6F6]/10 px-3 py-1.5 rounded-full mb-4 inline-block"
            >
              Corporate Directory
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl font-black font-sora text-white tracking-tight"
            >
              Site{" "}
              <span className="bg-gradient-to-r from-[#22B6F6] to-[#00E5FF] bg-clip-text text-transparent">
                Map
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-4 text-xs sm:text-sm font-semibold text-slate-350 max-w-xl mx-auto"
            >
              Quick access directory to all pages, services, case studies, and corporate policies.
            </motion.p>
          </div>
        </section>

        {/* Main Content Layout */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 sm:mt-16 relative z-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {/* Card 1: Core Navigation */}
            <motion.div
              variants={itemVariants}
              className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-[0_15px_35px_rgba(17,85,204,0.02)] hover:shadow-[0_20px_45px_rgba(17,85,204,0.04)] transition-all group duration-300"
            >
              <div className="flex gap-4 items-start mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#1155CC]/5 text-[#1155CC] flex items-center justify-center shrink-0">
                  <Icon name="monitor" className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 mb-1 font-sora">
                    Core Navigation
                  </h2>
                  <p className="text-xs font-semibold text-slate-400">
                    Main entry points of our web presence
                  </p>
                </div>
              </div>
              <ul className="space-y-3">
                {[
                  { label: "Home Page", href: "/" },
                  { label: "About the Agency", href: "/about" },
                  { label: "Our Services Overview", href: "/services" },
                  { label: "Portfolio (Case Studies)", href: "/portfolio" },
                  { label: "Blog & Insights", href: "/blog" },
                  { label: "Careers", href: "/careers" },
                  { label: "Contact Us", href: "/contact" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs sm:text-sm font-bold text-slate-700 hover:text-[#1155CC] hover:bg-slate-100/50 hover:border-[#1155CC]/20 transition-all group/item"
                    >
                      <span>{link.label}</span>
                      <Icon name="arrow" className="w-4 h-4 text-slate-400 group-hover/item:text-[#1155CC] group-hover/item:translate-x-1 transition-all" />
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Card 2: Legal & Corporate */}
            <motion.div
              variants={itemVariants}
              className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-[0_15px_35px_rgba(17,85,204,0.02)] hover:shadow-[0_20px_45px_rgba(17,85,204,0.04)] transition-all group duration-300"
            >
              <div className="flex gap-4 items-start mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#1155CC]/5 text-[#1155CC] flex items-center justify-center shrink-0">
                  <Icon name="shield" className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 mb-1 font-sora">
                    Legal & Corporate
                  </h2>
                  <p className="text-xs font-semibold text-slate-400">
                    Terms, regulations, and policy disclosures
                  </p>
                </div>
              </div>
              <ul className="space-y-3">
                {[
                  { label: "Privacy Policy", href: "/privacy-policy" },
                  { label: "Terms & Conditions", href: "/terms" },
                  { label: "Sitemap Directory", href: "/sitemap" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs sm:text-sm font-bold text-slate-700 hover:text-[#1155CC] hover:bg-slate-100/50 hover:border-[#1155CC]/20 transition-all group/item"
                    >
                      <span>{link.label}</span>
                      <Icon name="arrow" className="w-4 h-4 text-slate-400 group-hover/item:text-[#1155CC] group-hover/item:translate-x-1 transition-all" />
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Card 3: Our Expertises & Services */}
            <motion.div
              variants={itemVariants}
              className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-[0_15px_35px_rgba(17,85,204,0.02)] hover:shadow-[0_20px_45px_rgba(17,85,204,0.04)] transition-all group duration-300 md:col-span-2"
            >
              <div className="flex gap-4 items-start mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#1155CC]/5 text-[#1155CC] flex items-center justify-center shrink-0">
                  <Icon name="code" className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 mb-1 font-sora">
                    Our Expertises & Services
                  </h2>
                  <p className="text-xs font-semibold text-slate-400">
                    High-performance software and systems we design & engineer
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {services.map((service) => (
                  <Link
                    key={service.slug}
                    href={`/services/${service.slug}`}
                    className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:text-[#1155CC] hover:bg-slate-100/50 hover:border-[#1155CC]/20 transition-all group/item"
                  >
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover/item:text-[#1155CC] block mb-0.5">
                        {service.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold line-clamp-1">
                        {service.tagline}
                      </span>
                    </div>
                    <Icon name="arrow" className="w-4 h-4 text-slate-400 group-hover/item:text-[#1155CC] group-hover/item:translate-x-1 transition-all shrink-0 ml-4" />
                  </Link>
                ))}
              </div>
            </motion.div>

            {/* Card 4: Case Studies / Proof of Work */}
            <motion.div
              variants={itemVariants}
              className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-[0_15px_35px_rgba(17,85,204,0.02)] hover:shadow-[0_20px_45px_rgba(17,85,204,0.04)] transition-all group duration-300 md:col-span-2"
            >
              <div className="flex gap-4 items-start mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#1155CC]/5 text-[#1155CC] flex items-center justify-center shrink-0">
                  <Icon name="beaker" className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 mb-1 font-sora">
                    Featured Case Studies
                  </h2>
                  <p className="text-xs font-semibold text-slate-400">
                    Real-world solutions built for Indian businesses
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {projects.map((project) => (
                  <Link
                    key={project.slug}
                    href={`/portfolio/${project.slug}`}
                    className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:text-[#1155CC] hover:bg-slate-100/50 hover:border-[#1155CC]/20 transition-all group/item"
                  >
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover/item:text-[#1155CC] block mb-0.5">
                        {project.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {project.industry} &bull; {project.category}
                      </span>
                    </div>
                    <Icon name="arrow" className="w-4 h-4 text-slate-400 group-hover/item:text-[#1155CC] group-hover/item:translate-x-1 transition-all shrink-0 ml-4" />
                  </Link>
                ))}
              </div>
            </motion.div>

            {/* Card 5: Blog Insights */}
            <motion.div
              variants={itemVariants}
              className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-[0_15px_35px_rgba(17,85,204,0.02)] hover:shadow-[0_20px_45px_rgba(17,85,204,0.04)] transition-all group duration-300 md:col-span-2"
            >
              <div className="flex gap-4 items-start mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#1155CC]/5 text-[#1155CC] flex items-center justify-center shrink-0">
                  <Icon name="brain" className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 mb-1 font-sora">
                    Blog & Engineering Insights
                  </h2>
                  <p className="text-xs font-semibold text-slate-400">
                    Latest thoughts on system architecture, designs, and workflows
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {blogPosts.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:text-[#1155CC] hover:bg-slate-100/50 hover:border-[#1155CC]/20 transition-all group/item"
                  >
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover/item:text-[#1155CC] block mb-0.5">
                        {post.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {post.category} &bull; {post.readTime}
                      </span>
                    </div>
                    <Icon name="arrow" className="w-4 h-4 text-slate-400 group-hover/item:text-[#1155CC] group-hover/item:translate-x-1 transition-all shrink-0 ml-4" />
                  </Link>
                ))}
              </div>
            </motion.div>

          </motion.div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
