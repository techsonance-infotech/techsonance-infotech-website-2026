"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { services } from "@/data/services";
import { Icon, type IconName } from "@/app/components/icons/Icon";
import { ServiceIllustration } from "@/app/components/services/ServiceIllustrations";
import { HeroParallax } from "@/components/ui/hero-parallax";
import ScopingContactForm from "@/app/components/services/ScopingContactForm";
import { AEO_FAQS } from "@/lib/seo-aeo-geo-config";
import { Button } from "@/components/ui/button";

const serviceProducts = [
  {
    title: "Web Application Development",
    link: "/services/web-development",
    thumbnail: "/images/Web development.png",
  },
  {
    title: "AI Automation Solutions",
    link: "/services/ai-automation",
    thumbnail: "/images/AI Automation.png",
  },
  {
    title: "Custom Software Development",
    link: "/services/custom-software-development",
    thumbnail: "/images/projects/freightflow/freightflow-logistics-fleet-management-dashboard.png",
  },
  {
    title: "SaaS Product Development",
    link: "/services/saas-product-development",
    thumbnail: "/images/projects/syncserve/syncserve-retail-pos-sales-analytics.png",
  },
  {
    title: "Mobile App Development",
    link: "/services/mobile-development",
    thumbnail: "/images/mobile app.png",
  },
  {
    title: "API & Systems Integration",
    link: "/services/api-integrations",
    thumbnail: "/images/third-party-api-integration-services.svg",
  },
  {
    title: "Cloud & DevOps Engineering",
    link: "/services/cloud-devops",
    thumbnail: "/images/services/cloud_devops.png",
  },
  {
    title: "Product Engineering",
    link: "/services/product-engineering",
    thumbnail: "/images/services/product_engineering.png",
  },
  {
    title: "Enterprise Custom Platforms",
    link: "/services/custom-software-development",
    thumbnail: "/images/projects/freightflow/freightflow-logistics-fleet-management-dashboard.png",
  },
  {
    title: "Agentic AI Workflows",
    link: "/services/ai-automation",
    thumbnail: "/images/AI Automation.png",
  },
  {
    title: "Multi-tenant SaaS Analytics",
    link: "/services/saas-product-development",
    thumbnail: "/images/projects/syncserve/syncserve-retail-pos-sales-analytics.png",
  },
  {
    title: "Responsive Web Applications",
    link: "/services/web-development",
    thumbnail: "/images/Web development.png",
  },
  {
    title: "Cross-platform Mobile Solutions",
    link: "/services/mobile-development",
    thumbnail: "/images/mobile app.png",
  },
  {
    title: "Third-party System Integrations",
    link: "/services/api-integrations",
    thumbnail: "/images/third-party-api-integration-services.svg",
  },
  {
    title: "Automated CI/CD Infrastructure",
    link: "/services/cloud-devops",
    thumbnail: "/images/services/cloud_devops.png",
  },
];

const categories = [
  "General",
  "Custom Software",
  "AI & Automation",
  "SaaS Products",
  "Web Development",
  "Mobile Apps",
  "Cloud & DevOps",
  "API Integration",
  "Product Engineering",
];

// Compile all FAQs into a single master database list
const getCategoryForIndex = (idx: number): string => {
  if (idx >= 0 && idx < 5) return "General";
  if (idx >= 5 && idx < 11) return "Custom Software";
  if (idx >= 11 && idx < 18) return "AI & Automation";
  if (idx >= 18 && idx < 24) return "SaaS Products";
  if (idx >= 24 && idx < 30) return "Web Development";
  if (idx >= 30 && idx < 36) return "Mobile Apps";
  if (idx >= 36 && idx < 41) return "Cloud & DevOps";
  if (idx >= 41 && idx < 45) return "API Integration";
  return "Product Engineering";
};

const masterFaqs = AEO_FAQS.map((faq, idx) => ({
  category: getCategoryForIndex(idx),
  question: faq.question,
  answer: faq.directAnswer,
  directAnswer: faq.directAnswer,
  expandedExplanation: faq.expandedExplanation,
  businessBenefits: faq.businessBenefits,
}));

export default function ServicesClient() {
  // We keep active subservice indexes for all 8 service rows.
  const [activeSubIndices, setActiveSubIndices] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0]);

  const updateSubIndex = (serviceIndex: number, subIndex: number) => {
    setActiveSubIndices((prev) => {
      const updated = [...prev];
      updated[serviceIndex] = subIndex;
      return updated;
    });
  };

  // FAQ Search & Accordion State
  const [faqSearch, setFaqSearch] = useState("");
  const [activeFaqCategory, setActiveFaqCategory] = useState("General");
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaqIdx(openFaqIdx === idx ? null : idx);
  };

  const filteredFaqs = useMemo(() => {
    const result = masterFaqs.filter((f) => f.category === activeFaqCategory);
    if (!faqSearch) return result;
    const query = faqSearch.toLowerCase();
    return result.filter(
      (f) =>
        f.question.toLowerCase().includes(query) ||
        f.category.toLowerCase().includes(query) ||
        (f.directAnswer && f.directAnswer.toLowerCase().includes(query)) ||
        (f.expandedExplanation && f.expandedExplanation.toLowerCase().includes(query)) ||
        (f.businessBenefits && f.businessBenefits.toLowerCase().includes(query)),
    );
  }, [activeFaqCategory, faqSearch]);

  // Capabilities dataset (all styled in brand blue/slate)
  const capabilities = [
    {
      title: "High-Performance Architecture",
      desc: "We build microservices and database engines that scale smoothly past 100k requests per minute.",
      icon: "schema",
    },
    {
      title: "Developer Quality Control",
      desc: "Rigorous CI/CD integrations, automated unit tests, and type checking to ensure zero-error runtimes.",
      icon: "shield",
    },
    {
      title: "Agile Development Process",
      desc: "We operate on weekly iterations and transparent dashboards, allowing you to trace code updates directly.",
      icon: "trend",
    },
    {
      title: "Advanced Security & Isolation",
      desc: "Multi-tenant logic built from the ground up with secure JWT tokens, OAuth, and row-level database guards.",
      icon: "shield",
    },
    {
      title: "AI & ML Integrations",
      desc: "Connecting enterprise datasets to language models (RAG) and workflow agents for intelligent automations.",
      icon: "brain",
    },
    {
      title: "Performance Optimization",
      desc: "Zero-bloat bundle sizes, optimized database indexing, and CDN strategies ensuring perfect Lighthouse metrics.",
      icon: "speed",
    },
  ];

  return (
    <main className="relative min-h-screen overflow-x-clip bg-[#FAFBFD]">
      {/* Hero Parallax Section */}
      <HeroParallax products={serviceProducts} />

      <div className="relative z-20 bg-[#FAFBFD] pt-8 pb-24">
        {/* Ambient background blur blobs */}
        <div className="pointer-events-none absolute top-0 right-0 h-[650px] w-[650px] -translate-y-1/3 rounded-full bg-gradient-to-bl from-blue-100/30 to-transparent opacity-60 blur-3xl" />
        <div className="pointer-events-none absolute top-[35%] left-0 h-[550px] w-[550px] -translate-x-1/4 rounded-full bg-gradient-to-tr from-blue-100/20 to-transparent opacity-60 blur-3xl" />
        <div className="pointer-events-none absolute right-0 bottom-[20%] h-[500px] w-[500px] rounded-full bg-gradient-to-tl from-cyan-100/10 to-transparent opacity-50 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* ==========================================
            SERVICES DIRECTORY / NAVIGATOR
            ========================================== */}
          <div className="mb-24 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service, index) => {
              return (
                <motion.div
                  key={service.slug}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  onClick={() => {
                    const el = document.getElementById(service.slug);
                    if (el) {
                      el.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                  }}
                  className="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-[24px] border border-gray-100 bg-white p-6 shadow-[0_8px_30px_rgba(17, 85, 204,0.01)] transition-all duration-300 hover:border-slate-200/80 hover:shadow-[0_16px_45px_rgba(17, 85, 204,0.04)]"
                >
                  {/* Top decorative line showing dynamic brand color on hover */}
                  <div
                    className="absolute top-0 right-0 left-0 h-1 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
                    style={{ backgroundColor: service.accentColor }}
                  />

                  <div>
                    <div className="mb-5 flex items-center justify-between">
                      {/* Icon container with background that tints slightly to its accent color */}
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-2xl transition-colors duration-300"
                        style={{
                          backgroundColor: `${service.accentColor}0D`,
                          color: service.accentColor,
                        }}
                      >
                        <Icon name={service.icon as IconName} className="h-5.5 w-5.5" />
                      </div>
                      {/* Index identifier */}
                      <span className="font-mono text-xs font-bold text-gray-300 transition-colors group-hover:text-gray-400">
                        0{index + 1}
                      </span>
                    </div>

                    <h3 className="mb-2 text-base font-medium text-gray-900 transition-colors group-hover:text-[#1155CC]">
                      {service.shortTitle || service.title}
                    </h3>
                    <p className="line-clamp-2 text-xs leading-relaxed text-gray-400">
                      {service.tagline}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-gray-50 pt-4 text-[10px] font-black tracking-wider text-gray-400 uppercase transition-all group-hover:text-[#1155CC]">
                    <span>Explore Capabilities</span>
                    <div className="flex h-6 w-6 transform items-center justify-center rounded-full bg-slate-50 text-gray-400 transition-all group-hover:translate-x-0.5 group-hover:bg-[#1155CC] group-hover:text-white">
                      <Icon name="arrow" className="h-3 w-3" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* ==========================================
            ALTERNATING DETAILED SERVICE SECTIONS
            ========================================== */}
          <div className="mb-36 space-y-32">
            {services.map((service, index) => {
              const isEven = index % 2 === 0;
              const currentSubIndex = activeSubIndices[index];

              return (
                <div
                  key={service.slug}
                  id={service.slug}
                  className="grid scroll-mt-24 grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16"
                >
                  {/* Text Content Column with Scroll reveal */}
                  <motion.div
                    initial={{ opacity: 0, x: isEven ? -40 : 40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.7 }}
                    className={`flex flex-col justify-center lg:col-span-6 ${!isEven ? "lg:order-last" : ""}`}
                  >
                    {/* Accent tag */}
                    <div className="mb-4 flex items-center gap-2">
                      <div
                        className="h-0.5 w-6 rounded-full"
                        style={{ backgroundColor: service.accentColor }}
                      />
                      <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                        Service 0{index + 1}
                      </span>
                    </div>

                    <h2 className="mb-4 text-3xl leading-tight font-black tracking-tight text-gray-900 sm:text-4xl">
                      {service.title}
                    </h2>

                    <p className="mb-8 text-sm leading-relaxed text-gray-500 sm:text-base">
                      {service.tagline} {service.quickSummary}
                    </p>

                    {/* Interactive Specialties Accordion list */}
                    <div className="mb-8 space-y-2 p-0">
                      {service.whatWeBuild.map((specialty, subIdx) => {
                        const isActive = currentSubIndex === subIdx;
                        return (
                          <button
                            key={specialty}
                            onClick={() => updateSubIndex(index, subIdx)}
                            className={`relative flex w-full cursor-pointer items-start gap-4 overflow-hidden rounded-[22px] border px-4.5 py-3.5 text-left transition-all duration-300 ${
                              isActive
                                ? "bg-white shadow-[0_12px_30px_rgba(17, 85, 204,0.06)] border-slate-100"
                                : "bg-transparent border-transparent hover:bg-slate-50"
                            }`}
                          >
                            {isActive && (
                              <motion.div
                                layoutId={`active-accent-bar-${index}`}
                                className="absolute top-3.5 bottom-3.5 left-0 w-1 rounded-r bg-[#1155CC]"
                                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                              />
                            )}

                            {/* Number Indicator */}
                            <span
                              className={`mt-0.5 font-mono text-xs leading-none font-bold ${
                                isActive ? "text-[#1155CC]" : "text-gray-400"
                              }`}
                            >
                              0{subIdx + 1}
                            </span>

                            <div className="flex-grow">
                              <h4
                                className={`mb-1.5 text-sm leading-none font-bold transition-colors ${
                                  isActive ? "text-gray-900" : "text-gray-600"
                                }`}
                              >
                                {specialty}
                              </h4>
                              {isActive && (
                                <motion.p
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  className="mt-1 text-xs leading-relaxed text-gray-400"
                                >
                                  Specialized engineering workflows customized to build robust,
                                  secure, and production-grade {specialty.toLowerCase()} solutions
                                  for our partners.
                                </motion.p>
                              )}
                            </div>

                            <div
                              className={`flex h-5 w-5 items-center justify-center rounded-full transition-all ${
                                isActive
                                  ? "bg-[#1155CC] text-white"
                                  : "bg-transparent text-gray-400"
                              }`}
                            >
                              <Icon
                                name="chevron"
                                className={`h-2.5 w-2.5 transition-transform ${isActive ? "rotate-180" : ""}`}
                              />
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Call-to-action link */}
                    <div className="flex items-center gap-4">
                      <Button asChild variant="secondary" size="sm">
                        <Link href={`/services/${service.slug}`}>Deep Dive Into This Service</Link>
                      </Button>
                    </div>
                  </motion.div>

                  {/* Custom Interactive SVG Tech Illustration Column with scroll animation */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.7 }}
                    className="lg:col-span-6"
                  >
                    <ServiceIllustration slug={service.slug} />
                  </motion.div>
                </div>
              );
            })}
          </div>

          {/* ==========================================
            CAPABILITIES GRID SECTION
            ========================================== */}
          <div className="mb-36">
            <div className="mx-auto mb-16 max-w-3xl text-center">
              <h2 className="mb-4 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
                Our Core Architecture Principles
              </h2>
              <p className="text-sm leading-relaxed text-gray-500 sm:text-base">
                Every system we build incorporates enterprise-grade capabilities to deliver
                reliability, performance, and scale.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
              {capabilities.map((cap, idx) => (
                <motion.div
                  key={cap.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: 0.05 * (idx % 3) }}
                  className="rounded-[28px] border border-gray-100 bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.01)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(17, 85, 204,0.03)]"
                >
                  <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#1155CC]">
                    <Icon
                      name={(cap.icon === "lock" ? "shield" : cap.icon) as IconName}
                      className="h-5 w-5"
                    />
                  </div>
                  <h3 className="mb-2.5 text-base font-medium text-gray-900">{cap.title}</h3>
                  <p className="text-xs leading-relaxed text-gray-500">{cap.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ==========================================
            SCOPING CONTACT FORM SECTION
            ========================================== */}
          <div className="mb-36">
            <ScopingContactForm />
          </div>

          {/* ==========================================
            FAQ ACCORDION SECTION (UNIFIED LIST + SEARCH)
            ========================================== */}
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12">
              {/* Left Header Info */}
              <div className="lg:sticky lg:top-24 lg:col-span-4">
                <span className="mb-2.5 block text-[10px] font-black tracking-widest text-[#1155CC] uppercase">
                  Got a question?
                </span>
                <h2 className="mb-4 text-3xl leading-tight font-black tracking-tight text-gray-900 sm:text-4xl">
                  Frequently Asked <br />
                  Questions.
                </h2>
                <p className="mb-6 text-sm leading-relaxed text-gray-500">
                  Find answers regarding intellectual property, data compliance, typical timelines,
                  and our software engineering methods.
                </p>

                {/* Live search input */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search questions or keywords..."
                    value={faqSearch}
                    onChange={(e) => {
                      setFaqSearch(e.target.value);
                      setOpenFaqIdx(null); // Reset accordion on filter
                    }}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4.5 py-3 text-xs text-gray-800 placeholder-gray-400 transition-colors focus:border-[#1155CC] focus:outline-none"
                  />
                  {faqSearch && (
                    <button
                      onClick={() => setFaqSearch("")}
                      className="absolute top-1/2 right-3.5 -translate-y-1/2 text-[10px] font-bold text-gray-400 hover:text-gray-600"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Right Accordion block */}
              <div className="bg-transparent p-0 lg:col-span-8">
                <h3 className="mb-6 flex items-center justify-between border-b border-slate-200/50 pb-4 text-sm font-black text-gray-900">
                  <span>Showing {filteredFaqs.length} FAQ answers</span>
                  <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                    TechSonance Knowledge Database
                  </span>
                </h3>

                {/* Category selector tabs */}
                <div className="-mx-1 mb-6 flex scrollbar-none items-center gap-1.5 overflow-x-auto border-b border-slate-100/60 px-1 pb-3">
                  {categories.map((cat) => {
                    const isActive = activeFaqCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => {
                          setActiveFaqCategory(cat);
                          setOpenFaqIdx(null); // Reset accordion open state when switching tabs
                        }}
                        className={`cursor-pointer rounded-full px-3 py-1.5 text-[10px] font-bold tracking-wider whitespace-nowrap transition-all duration-300 ${
                          isActive
                            ? "bg-[#1155CC] text-white shadow-sm shadow-[#1155CC]/15"
                            : "bg-white text-gray-500 hover:text-[#1155CC] hover:bg-slate-50/50 border border-slate-100/80"
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>

                {filteredFaqs.length === 0 ? (
                  <div className="py-12 text-center text-xs text-gray-400">
                    No matches found for "{faqSearch}". Try searching other keywords.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredFaqs.map((item, idx) => {
                      const isOpen = openFaqIdx === idx;
                      return (
                        <div
                          key={idx}
                          className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
                            isOpen
                              ? "bg-white shadow-[0_12px_30px_rgba(17, 85, 204,0.05)] border-slate-100"
                              : "bg-transparent border-transparent hover:bg-slate-100/30"
                          }`}
                        >
                          {isOpen && (
                            <motion.div
                              layoutId="active-faq-accent-bar"
                              className="absolute top-5 bottom-5 left-0 w-1 rounded-r bg-[#1155CC]"
                              transition={{ type: "spring", stiffness: 380, damping: 30 }}
                            />
                          )}

                          <button
                            onClick={() => toggleFaq(idx)}
                            className="flex w-full cursor-pointer items-center justify-between p-5 text-left text-xs font-bold text-gray-900 transition-colors hover:text-[#1155CC] sm:text-sm"
                          >
                            <div className="flex flex-col gap-2 pr-4 sm:flex-row sm:items-center sm:gap-4.5">
                              <span className="shrink-0 self-start rounded-full bg-[#1155CC]/5 px-2.5 py-0.5 text-[9px] font-medium tracking-wide text-[#1155CC] uppercase sm:self-auto">
                                {item.category}
                              </span>
                              <span className="leading-snug">{item.question}</span>
                            </div>
                            <div
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                                isOpen
                                  ? "bg-[#1155CC] text-white"
                                  : "bg-slate-100 text-gray-500 hover:bg-slate-200"
                              }`}
                            >
                              <Icon
                                name="chevron"
                                className={`h-3 w-3 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                              />
                            </div>
                          </button>

                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: "easeInOut" }}
                              >
                                <div className="border-t border-gray-100/50 px-5 pt-0.5 pb-5 text-xs leading-relaxed text-gray-500 sm:text-sm">
                                  {item.directAnswer ? (
                                    <div className="space-y-4 pt-4">
                                      <div className="rounded-r-xl border-l-3 border-[#1155CC] bg-blue-50/50 p-3.5">
                                        <span className="mb-1 block text-[10px] font-black tracking-wider text-[#1155CC] uppercase">
                                          Direct Answer
                                        </span>
                                        <p className="text-xs leading-relaxed font-bold text-gray-950 sm:text-sm">
                                          {item.directAnswer}
                                        </p>
                                      </div>

                                      <div className="space-y-1">
                                        <span className="block text-[10px] font-black tracking-wider text-gray-400 uppercase">
                                          Technical Explanation & Integration
                                        </span>
                                        <p className="leading-relaxed text-gray-500">
                                          {item.expandedExplanation}
                                        </p>
                                      </div>

                                      <div className="space-y-1 rounded-r-xl border-l-3 border-green-500 bg-green-50/40 p-3.5">
                                        <span className="block text-[10px] font-black tracking-wider text-green-700 uppercase">
                                          Business Benefits & ROI
                                        </span>
                                        <p className="leading-relaxed font-semibold text-green-800">
                                          {item.businessBenefits}
                                        </p>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="pt-2">{item.answer}</div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
