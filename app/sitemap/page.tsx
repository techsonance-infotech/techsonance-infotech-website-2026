"use client";

import React, { useSyncExternalStore } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import SiteHeader from "@/app/components/home/SiteHeader";
import SiteFooter from "@/app/components/home/SiteFooter";
import { Icon } from "@/app/components/icons/Icon";
import { ElegantShape } from "@/components/ui/shape-landing-hero";
import { services } from "@/data/services";
import { projects } from "@/data/projects";
import { blogPosts } from "@/data/blog";
import { cn } from "@/lib/utils";

const subscribeResize = (callback: () => void) => {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
};

export default function SitemapPage() {
  const isMobile = useSyncExternalStore(
    subscribeResize,
    () => window.innerWidth < 768,
    () => false,
  );
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
      <main className="relative min-h-screen overflow-hidden bg-[#FAFBFD] pt-24 pb-20">
        {/* Ambient background glows */}
        <div
          className={cn(
            "pointer-events-none absolute top-0 left-0 rounded-full bg-[#1155CC]/5 blur-[100px]",
            isMobile ? "h-[250px] w-[250px]" : "h-[500px] w-[500px]",
          )}
        />
        <div
          className={cn(
            "pointer-events-none absolute top-[40%] right-0 rounded-full bg-[#22B6F6]/5 blur-[120px]",
            isMobile ? "h-[300px] w-[300px]" : "h-[600px] w-[600px]",
          )}
        />

        {/* Hero Banner Header */}
        <section className="relative overflow-hidden border-b border-[#1E293B] bg-gradient-to-br from-[#071A35] via-[#0F172A] to-[#0b2447] py-16 text-white sm:py-24">
          <div className="pointer-events-none absolute inset-0 opacity-[0.05]">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: "radial-gradient(#22B6F6 1.5px, transparent 1.5px)",
                backgroundSize: "24px 24px",
              }}
            />
          </div>

          {/* Floating Elegant Shapes */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <ElegantShape
              delay={0.3}
              width={isMobile ? 200 : 400}
              height={isMobile ? 60 : 120}
              rotate={12}
              gradient="from-[#1155CC]/20 to-transparent"
              className="top-[10%] left-[-10%]"
            />
            <ElegantShape
              delay={0.5}
              width={isMobile ? 150 : 300}
              height={isMobile ? 50 : 100}
              rotate={-15}
              gradient="from-[#22B6F6]/25 to-transparent"
              className="right-[-5%] bottom-[10%]"
            />
          </div>

          <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <motion.span
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-4 inline-block rounded-full bg-[#22B6F6]/10 px-3 py-1.5 text-[10px] font-black tracking-[0.25em] text-[#22B6F6] uppercase"
            >
              Corporate Directory
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-sora text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl"
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
              className="mx-auto mt-4 max-w-xl text-xs font-semibold text-slate-300 sm:text-sm"
            >
              Quick access directory to all pages, services, case studies, and corporate policies.
            </motion.p>
          </div>
        </section>

        {/* Main Content Layout */}
        <section className="relative z-10 mx-auto mt-12 max-w-7xl px-4 sm:mt-16 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-8 md:grid-cols-2"
          >
            {/* Card 1: Core Navigation */}
            <motion.div
              variants={itemVariants}
              className="group rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_15px_35px_rgba(17,85,204,0.02)] transition-all duration-300 hover:shadow-[0_20px_45px_rgba(17,85,204,0.04)] sm:p-8"
            >
              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1155CC]/5 text-[#1155CC]">
                  <Icon name="monitor" className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="mb-1 font-sora text-lg font-medium text-slate-900">
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
                      className="group/item flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-3 text-xs font-bold text-slate-700 transition-all hover:border-[#1155CC]/20 hover:bg-slate-100/50 hover:text-[#1155CC] sm:text-sm"
                    >
                      <span>{link.label}</span>
                      <Icon
                        name="arrow"
                        className="h-4 w-4 text-slate-400 transition-all group-hover/item:translate-x-1 group-hover/item:text-[#1155CC]"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Card 2: Legal & Corporate */}
            <motion.div
              variants={itemVariants}
              className="group rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_15px_35px_rgba(17,85,204,0.02)] transition-all duration-300 hover:shadow-[0_20px_45px_rgba(17,85,204,0.04)] sm:p-8"
            >
              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1155CC]/5 text-[#1155CC]">
                  <Icon name="shield" className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="mb-1 font-sora text-lg font-medium text-slate-900">
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
                      className="group/item flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-3 text-xs font-bold text-slate-700 transition-all hover:border-[#1155CC]/20 hover:bg-slate-100/50 hover:text-[#1155CC] sm:text-sm"
                    >
                      <span>{link.label}</span>
                      <Icon
                        name="arrow"
                        className="h-4 w-4 text-slate-400 transition-all group-hover/item:translate-x-1 group-hover/item:text-[#1155CC]"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Card 3: Our Expertises & Services */}
            <motion.div
              variants={itemVariants}
              className="group rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_15px_35px_rgba(17,85,204,0.02)] transition-all duration-300 hover:shadow-[0_20px_45px_rgba(17,85,204,0.04)] sm:p-8 md:col-span-2"
            >
              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1155CC]/5 text-[#1155CC]">
                  <Icon name="code" className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="mb-1 font-sora text-lg font-medium text-slate-900">
                    Our Expertises & Services
                  </h2>
                  <p className="text-xs font-semibold text-slate-400">
                    High-performance software and systems we design & engineer
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {services.map((service) => (
                  <Link
                    key={service.slug}
                    href={`/services/${service.slug}`}
                    className="group/item flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 transition-all hover:border-[#1155CC]/20 hover:bg-slate-100/50 hover:text-[#1155CC]"
                  >
                    <div>
                      <span className="mb-0.5 block text-xs font-bold text-slate-800 group-hover/item:text-[#1155CC] sm:text-sm">
                        {service.title}
                      </span>
                      <span className="line-clamp-1 text-[10px] font-semibold text-slate-400">
                        {service.tagline}
                      </span>
                    </div>
                    <Icon
                      name="arrow"
                      className="ml-4 h-4 w-4 shrink-0 text-slate-400 transition-all group-hover/item:translate-x-1 group-hover/item:text-[#1155CC]"
                    />
                  </Link>
                ))}
              </div>
            </motion.div>

            {/* Card 4: Case Studies / Proof of Work */}
            <motion.div
              variants={itemVariants}
              className="group rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_15px_35px_rgba(17,85,204,0.02)] transition-all duration-300 hover:shadow-[0_20px_45px_rgba(17,85,204,0.04)] sm:p-8 md:col-span-2"
            >
              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1155CC]/5 text-[#1155CC]">
                  <Icon name="beaker" className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="mb-1 font-sora text-lg font-medium text-slate-900">
                    Featured Case Studies
                  </h2>
                  <p className="text-xs font-semibold text-slate-400">
                    Real-world solutions built for Indian businesses
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {projects.map((project) => (
                  <Link
                    key={project.slug}
                    href={`/portfolio/${project.slug}`}
                    className="group/item flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 transition-all hover:border-[#1155CC]/20 hover:bg-slate-100/50 hover:text-[#1155CC]"
                  >
                    <div>
                      <span className="mb-0.5 block text-xs font-bold text-slate-800 group-hover/item:text-[#1155CC] sm:text-sm">
                        {project.title}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {project.industry} &bull; {project.category}
                      </span>
                    </div>
                    <Icon
                      name="arrow"
                      className="ml-4 h-4 w-4 shrink-0 text-slate-400 transition-all group-hover/item:translate-x-1 group-hover/item:text-[#1155CC]"
                    />
                  </Link>
                ))}
              </div>
            </motion.div>

            {/* Card 5: Blog Insights */}
            <motion.div
              variants={itemVariants}
              className="group rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_15px_35px_rgba(17,85,204,0.02)] transition-all duration-300 hover:shadow-[0_20px_45px_rgba(17,85,204,0.04)] sm:p-8 md:col-span-2"
            >
              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1155CC]/5 text-[#1155CC]">
                  <Icon name="brain" className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="mb-1 font-sora text-lg font-medium text-slate-900">
                    Blog & Engineering Insights
                  </h2>
                  <p className="text-xs font-semibold text-slate-400">
                    Latest thoughts on system architecture, designs, and workflows
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {blogPosts.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="group/item flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 transition-all hover:border-[#1155CC]/20 hover:bg-slate-100/50 hover:text-[#1155CC]"
                  >
                    <div>
                      <span className="mb-0.5 block text-xs font-bold text-slate-800 group-hover/item:text-[#1155CC] sm:text-sm">
                        {post.title}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {post.category} &bull; {post.readTime}
                      </span>
                    </div>
                    <Icon
                      name="arrow"
                      className="ml-4 h-4 w-4 shrink-0 text-slate-400 transition-all group-hover/item:translate-x-1 group-hover/item:text-[#1155CC]"
                    />
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
