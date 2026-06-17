"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { services } from "@/data/services";
import { Icon, type IconName } from "@/app/components/icons/Icon";
import { ServiceIllustration } from "@/app/components/services/ServiceIllustrations";
import { HeroParallax } from "@/components/ui/hero-parallax";
import ScopingContactForm from "@/app/components/services/ScopingContactForm";

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

// Compile all FAQs into a single master database list
const masterFaqs = [
  {
    category: "Custom Software",
    question: "How do you handle Intellectual Property (IP) ownership?",
    answer: "You retain 100% ownership of the custom code, databases, design assets, and intellectual property. The rights are fully transferred to your entity immediately upon project completion and final billing settlement."
  },
  {
    category: "AI & Automation",
    question: "Is our proprietary business data secure when integrating LLMs?",
    answer: "Yes, data security is our top priority. We integrate models using private enterprise APIs, custom VPC deployments, or self-hosted open-source LLMs (like Llama 3 or Mixtral). Your proprietary data is never used to train public foundation models."
  },
  {
    category: "SaaS Products",
    question: "What is your typical technology stack for SaaS platforms?",
    answer: "We build on modern, highly scalable foundations. For web frontends, we use Next.js/React. For backends, we use Node.js/NestJS or Go. Database layers are powered by PostgreSQL, Redis, and pgvector, hosted securely on AWS or GCP using Kubernetes."
  },
  {
    category: "Development Process",
    question: "How do you communicate progress during the build cycles?",
    answer: "We operate on weekly sprints. You will have access to a dedicated Jira/Linear board, weekly video demos, and a shared Slack/Teams channel. A project manager and lead engineer will be your direct points of contact throughout the process."
  },
  {
    category: "Cloud & Maintenance",
    question: "Do you provide post-launch maintenance and DevOps support?",
    answer: "Yes, we offer monthly SLA agreements covering infrastructure monitoring, security patches, database backups, minor feature updates, and scaling adjustments. We ensure your systems maintain 99.9% uptime."
  },
  {
    category: "Scoping & Timelines",
    question: "How quickly can we start and get an initial scope of work?",
    answer: "After our initial scoping call, we deliver a detailed technical roadmap, feature breakdown, and transparent timeline estimate within 3 to 5 business days. Once approved, engineering teams can typically kick off within 10 to 14 days."
  },
  {
    category: "Team Integration",
    question: "Can you collaborate directly with our existing in-house developers?",
    answer: "Absolutely. We routinely work alongside in-house technical teams. We adapt to your established git branching strategies, CI/CD systems, documentation formats, and communication channels to accelerate delivery."
  },
  {
    category: "Mobile Apps",
    question: "Do you build native or cross-platform mobile applications?",
    answer: "We specialize in both. We build high-performance cross-platform apps using React Native or Flutter to optimize launch times and budgets, or native Swift/Kotlin apps when hardware-level integrations are required."
  }
];

export default function ServicesOverviewPage() {
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
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaqIdx(openFaqIdx === idx ? null : idx);
  };

  const filteredFaqs = useMemo(() => {
    if (!faqSearch) return masterFaqs;
    const query = faqSearch.toLowerCase();
    return masterFaqs.filter(
      (f) =>
        f.question.toLowerCase().includes(query) ||
        f.answer.toLowerCase().includes(query) ||
        f.category.toLowerCase().includes(query)
    );
  }, [faqSearch]);

  // Capabilities dataset (all styled in brand blue/slate)
  const capabilities = [
    { title: "High-Performance Architecture", desc: "We build microservices and database engines that scale smoothly past 100k requests per minute.", icon: "schema" },
    { title: "Developer Quality Control", desc: "Rigorous CI/CD integrations, automated unit tests, and type checking to ensure zero-error runtimes.", icon: "shield" },
    { title: "Agile Development Process", desc: "We operate on weekly iterations and transparent dashboards, allowing you to trace code updates directly.", icon: "trend" },
    { title: "Advanced Security & Isolation", desc: "Multi-tenant logic built from the ground up with secure JWT tokens, OAuth, and row-level database guards.", icon: "shield" },
    { title: "AI & ML Integrations", desc: "Connecting enterprise datasets to language models (RAG) and workflow agents for intelligent automations.", icon: "brain" },
    { title: "Performance Optimization", desc: "Zero-bloat bundle sizes, optimized database indexing, and CDN strategies ensuring perfect Lighthouse metrics.", icon: "speed" }
  ];

  return (
    <main className="bg-[#F8FBFF] min-h-screen relative overflow-x-clip">
      
      {/* Hero Parallax Section */}
      <HeroParallax products={serviceProducts} />

      <div className="relative z-20 bg-[#F8FBFF] pt-8 pb-24">
        {/* Ambient background blur blobs */}
        <div className="absolute top-0 right-0 w-[650px] h-[650px] bg-gradient-to-bl from-blue-100/30 to-transparent rounded-full blur-3xl opacity-60 -translate-y-1/3 pointer-events-none" />
        <div className="absolute top-[35%] left-0 w-[550px] h-[550px] bg-gradient-to-tr from-blue-100/20 to-transparent rounded-full blur-3xl opacity-60 -translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-[20%] right-0 w-[500px] h-[500px] bg-gradient-to-tl from-cyan-100/10 to-transparent rounded-full blur-3xl opacity-50 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* ==========================================
            SERVICES DIRECTORY / NAVIGATOR
            ========================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
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
                className="bg-white border border-gray-100 hover:border-slate-200/80 rounded-[24px] p-6 shadow-[0_8px_30px_rgba(13,71,161,0.01)] hover:shadow-[0_16px_45px_rgba(13,71,161,0.04)] transition-all duration-300 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Top decorative line showing dynamic brand color on hover */}
                <div 
                  className="absolute top-0 left-0 right-0 h-1 transition-transform duration-300 scale-x-0 group-hover:scale-x-100 origin-left"
                  style={{ backgroundColor: service.accentColor }}
                />

                <div>
                  <div className="flex items-center justify-between mb-5">
                    {/* Icon container with background that tints slightly to its accent color */}
                    <div 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-300"
                      style={{ 
                        backgroundColor: `${service.accentColor}0D`, // ~5% opacity for background tint
                        color: service.accentColor 
                      }}
                    >
                      <Icon name={service.icon as IconName} className="w-5.5 h-5.5" />
                    </div>
                    {/* Index identifier */}
                    <span className="text-xs font-mono font-bold text-gray-300 group-hover:text-gray-400 transition-colors">
                      0{index + 1}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-gray-900 group-hover:text-[#0D47A1] transition-colors mb-2">
                    {service.shortTitle || service.title}
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
                    {service.tagline}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-gray-400 group-hover:text-[#0D47A1] transition-all">
                  <span>Explore Capabilities</span>
                  <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-gray-400 group-hover:bg-[#0D47A1] group-hover:text-white transition-all transform group-hover:translate-x-0.5">
                    <Icon name="arrow" className="w-3 h-3" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ==========================================
            ALTERNATING DETAILED SERVICE SECTIONS
            ========================================== */}
        <div className="space-y-32 mb-36">
          {services.map((service, index) => {
            const isEven = index % 2 === 0;
            const currentSubIndex = activeSubIndices[index];

            return (
              <div
                key={service.slug}
                id={service.slug}
                className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center scroll-mt-24"
              >
                
                {/* Text Content Column with Scroll reveal */}
                <motion.div
                  initial={{ opacity: 0, x: isEven ? -40 : 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.7 }}
                  className={`lg:col-span-6 flex flex-col justify-center ${!isEven ? "lg:order-last" : ""}`}
                >
                  {/* Accent tag */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-0.5 rounded-full" style={{ backgroundColor: service.accentColor }} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Service 0{index + 1}</span>
                  </div>

                  <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-4 leading-tight">
                    {service.title}
                  </h2>
                  
                  <p className="text-sm sm:text-base text-gray-500 leading-relaxed mb-8">
                    {service.tagline} {service.quickSummary}
                  </p>

                  {/* Interactive Specialties Accordion list */}
                  <div className="p-0 space-y-2 mb-8">
                    {service.whatWeBuild.map((specialty, subIdx) => {
                      const isActive = currentSubIndex === subIdx;
                      return (
                        <button
                          key={specialty}
                          onClick={() => updateSubIndex(index, subIdx)}
                          className={`relative w-full text-left py-3.5 px-4.5 rounded-[22px] transition-all duration-300 flex items-start gap-4 cursor-pointer overflow-hidden border ${
                            isActive
                              ? "bg-white shadow-[0_12px_30px_rgba(13,71,161,0.06)] border-slate-100"
                              : "bg-transparent border-transparent hover:bg-slate-50"
                          }`}
                        >
                          {isActive && (
                            <motion.div
                              layoutId={`active-accent-bar-${index}`}
                              className="absolute left-0 top-3.5 bottom-3.5 w-1 rounded-r bg-[#0D47A1]"
                              transition={{ type: "spring", stiffness: 380, damping: 30 }}
                            />
                          )}

                          {/* Number Indicator */}
                          <span
                            className={`text-xs font-mono font-bold leading-none mt-0.5 ${
                              isActive ? "text-[#0D47A1]" : "text-gray-400"
                            }`}
                          >
                            0{subIdx + 1}
                          </span>

                          <div className="flex-grow">
                            <h4
                              className={`text-sm font-bold leading-none mb-1.5 transition-colors ${
                                isActive ? "text-gray-900" : "text-gray-600"
                              }`}
                            >
                              {specialty}
                            </h4>
                            {isActive && (
                              <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="text-xs text-gray-400 leading-relaxed mt-1"
                              >
                                Specialized engineering workflows customized to build robust, secure, and production-grade {specialty.toLowerCase()} solutions for our partners.
                              </motion.p>
                            )}
                          </div>

                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                              isActive
                                ? "bg-[#0D47A1] text-white"
                                : "bg-transparent text-gray-400"
                            }`}
                          >
                            <Icon name="chevron" className={`w-2.5 h-2.5 transition-transform ${isActive ? "rotate-180" : ""}`} />
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Call-to-action link */}
                  <div className="flex items-center gap-4">
                    <Link
                      href={`/services/${service.slug}`}
                      className="inline-flex items-center gap-2 text-xs font-extrabold text-gray-800 hover:text-[#008BD9] transition-colors uppercase tracking-wider group cursor-pointer"
                    >
                      Deep Dive Into This Service
                      <div className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center transition-all group-hover:bg-[#0D47A1] group-hover:border-[#0D47A1] group-hover:text-white">
                        <Icon name="arrow" className="w-3 h-3" />
                      </div>
                    </Link>
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
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-4">
              Our Core Architecture Principles
            </h2>
            <p className="text-sm sm:text-base text-gray-500 leading-relaxed">
              Every system we build incorporates enterprise-grade capabilities to deliver reliability, performance, and scale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {capabilities.map((cap, idx) => (
              <motion.div
                key={cap.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: 0.05 * (idx % 3) }}
                className="bg-white rounded-[28px] p-8 border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-[0_16px_40px_rgba(13,71,161,0.03)] hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#0D47A1] flex items-center justify-center mb-6">
                  <Icon name={(cap.icon === "lock" ? "shield" : cap.icon) as IconName} className="w-5 h-5" />
                </div>
                <h3 className="text-base font-extrabold text-gray-900 mb-2.5">
                  {cap.title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {cap.desc}
                </p>
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Left Header Info */}
            <div className="lg:col-span-4 lg:sticky lg:top-24">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#0D47A1] mb-2.5 block">Got a question?</span>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-4 leading-tight">
                Frequently Asked <br />Questions.
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                Find answers regarding intellectual property, data compliance, typical timelines, and our software engineering methods.
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
                  className="w-full px-4.5 py-3 rounded-xl border border-gray-150 bg-white text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#0D47A1] transition-colors"
                />
                {faqSearch && (
                  <button
                    onClick={() => setFaqSearch("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 hover:text-gray-600 font-bold"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Right Accordion block */}
            <div className="lg:col-span-8 bg-transparent p-0">
              <h3 className="text-sm font-black text-gray-900 mb-6 pb-4 border-b border-slate-200/50 flex items-center justify-between">
                <span>Showing {filteredFaqs.length} FAQ answers</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">TechSonance Knowledge Database</span>
              </h3>

              {filteredFaqs.length === 0 ? (
                <div className="text-center py-12 text-xs text-gray-400">
                  No matches found for "{faqSearch}". Try searching other keywords.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredFaqs.map((item, idx) => {
                    const isOpen = openFaqIdx === idx;
                    return (
                      <div
                        key={idx}
                        className={`relative border rounded-2xl overflow-hidden transition-all duration-300 ${
                          isOpen
                            ? "bg-white shadow-[0_12px_30px_rgba(13,71,161,0.05)] border-slate-100"
                            : "bg-transparent border-transparent hover:bg-slate-100/30"
                        }`}
                      >
                        {isOpen && (
                          <motion.div
                            layoutId="active-faq-accent-bar"
                            className="absolute left-0 top-5 bottom-5 w-1 rounded-r bg-[#0D47A1]"
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          />
                        )}

                        <button
                          onClick={() => toggleFaq(idx)}
                          className="w-full flex items-center justify-between p-5 text-left font-bold text-gray-900 text-xs sm:text-sm hover:text-[#0D47A1] transition-colors cursor-pointer"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4.5 pr-4">
                            <span className="px-2.5 py-0.5 rounded-full bg-[#0D47A1]/5 text-[9px] font-extrabold text-[#0D47A1] uppercase tracking-wide self-start sm:self-auto shrink-0">
                              {item.category}
                            </span>
                            <span className="leading-snug">{item.question}</span>
                          </div>
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                              isOpen
                                ? "bg-[#0D47A1] text-white"
                                : "bg-slate-100 text-gray-500 hover:bg-slate-200"
                            }`}
                          >
                            <Icon
                              name="chevron"
                              className={`w-3 h-3 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
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
                              <div className="px-5 pb-5 pt-0.5 text-xs sm:text-sm text-gray-500 leading-relaxed border-t border-gray-100/50">
                                {item.answer}
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
