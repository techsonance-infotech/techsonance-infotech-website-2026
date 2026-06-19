"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import SafeImage from "@/app/components/SafeImage";
import SiteHeader from "@/app/components/home/SiteHeader";
import SiteFooter from "@/app/components/home/SiteFooter";
import { Icon } from "@/app/components/icons/Icon";
import { ElegantShape } from "@/components/ui/shape-landing-hero";
import { cn } from "@/lib/utils";

const constellationNodes = Array.from({ length: 24 }, (_, i) => {
  const x = `${((i * 17) % 95) + 2}%`;
  const y = `${((i * 23) % 85) + 5}%`;
  const size = 3 + (i % 4);
  const duration = 12 + (i % 6) * 3;
  const delay = i * 0.2;
  const color = i % 3 === 0 ? "#1155CC" : i % 3 === 1 ? "#22B6F6" : "#0F172A";
  return { id: i, x, y, size, duration, delay, color };
});

const circuitLines = [
  { d: "M 0 30 C 20vw 10vh, 40vw 50vh, 60vw 20vh, 80vw 60vh, 100vw 30vh", duration: 16 },
  { d: "M 0 70 C 25vw 80vh, 45vw 30vh, 65vw 70vh, 85vw 20vh, 100vw 60vh", duration: 22 },
  { d: "M 10vw 0 C 30vw 25vh, 20vw 65vh, 50vw 80vh, 70vw 45vh, 90vw 100vh", duration: 18 }
];

const hiringProcessSteps = [
  {
    step: "01",
    title: "Application Review",
    desc: "We evaluate your resume, GitHub profile, and past project works.",
  },
  {
    step: "02",
    title: "Technical Assessment",
    desc: "A hands-on coding task to evaluate frontend and backend engineering skills.",
  },
  {
    step: "03",
    title: "Technical Interview",
    desc: "A 1-on-1 virtual call to discuss your solution, engineering interests, and culture fit.",
  },
  {
    step: "04",
    title: "Offer",
    desc: "Welcome onboard! Receive details on onboarding, mentors, and stipend.",
  },
];

const cultureColors = [
  {
    text: "text-[#1155CC]",
    glow: "bg-blue-400/5",
    iconBg: "bg-blue-100"
  },
  {
    text: "text-cyan-600",
    glow: "bg-cyan-400/5",
    iconBg: "bg-cyan-100"
  },
  {
    text: "text-violet-600",
    glow: "bg-violet-400/5",
    iconBg: "bg-violet-100"
  },
  {
    text: "text-emerald-600",
    glow: "bg-emerald-400/5",
    iconBg: "bg-emerald-100"
  }
];

const cultureValues = [
  {
    icon: "code",
    title: "Engineering Excellence",
    desc: "Work on cutting-edge stacks (Next.js, Node.js, AI APIs) and build robust, scalable architectures.",
  },
  {
    icon: "bolt",
    title: "High Ownership",
    desc: "We don't micro-manage. Take charge of features, lead components, and make code decisions from day one.",
  },
  {
    icon: "database",
    title: "Real Business Impact",
    desc: "Build platforms that scaling startups and enterprise clients run live on every single day.",
  },
  {
    icon: "arrow",
    title: "Fast-Paced Mentorship",
    desc: "Learn directly from senior software engineers who will help you polish your technical and systems architecture skills.",
  },
];

export default function CareersClient() {
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

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    role: "Full Stack Developer Intern",
    message: "",
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [touched, setTouched] = useState<{
    fullName?: boolean;
    email?: boolean;
    message?: boolean;
    resume?: boolean;
  }>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTouched((prev) => ({ ...prev, resume: true }));
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage("File size must be under 5MB");
        setStatus("error");
        setResumeFile(file);
        return;
      }
      setResumeFile(file);
      setErrorMessage("");
      if (status === "error") setStatus("idle");
    }
  };

  const getValidationError = (field: string) => {
    if (!touched[field as keyof typeof touched]) return undefined;

    if (field === "fullName") {
      if (!formData.fullName.trim()) return "Full name is required.";
    }
    if (field === "email") {
      if (!formData.email.trim()) {
        return "Email address is required.";
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        return "Please enter a valid email address.";
      }
    }
    if (field === "message") {
      if (!formData.message.trim()) {
        return "Message / Cover letter is required.";
      }
    }
    if (field === "resume") {
      if (!resumeFile) return "Resume file is required.";
      if (resumeFile.size > 5 * 1024 * 1024) return "Resume size must be under 5MB.";
    }
    return undefined;
  };

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim());
  const isFormValid =
    !!formData.fullName.trim() &&
    !!formData.email.trim() &&
    !!formData.message.trim() &&
    isEmailValid &&
    !!resumeFile &&
    resumeFile.size <= 5 * 1024 * 1024;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      fullName: true,
      email: true,
      message: true,
      resume: true,
    });

    if (!isFormValid) {
      setErrorMessage("Please fill all fields correctly.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const data = new FormData();
      data.append("fullName", formData.fullName);
      data.append("email", formData.email);
      data.append("role", formData.role);
      data.append("message", formData.message);
      if (resumeFile) {
        data.append("resume", resumeFile);
      }

      const response = await fetch("/api/careers", {
        method: "POST",
        body: data,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Something went wrong.");
      }

      setStatus("success");
      setFormData({
        fullName: "",
        email: "",
        role: "Full Stack Developer Intern",
        message: "",
      });
      setResumeFile(null);
      setTouched({});
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      console.error("Submission error:", err);
      setErrorMessage(err.message || "Failed to submit application.");
      setStatus("error");
    }
  };

  return (
    <>
      <SiteHeader transparent={true} />
      <main className="bg-[#FAFBFD] min-h-screen font-sans text-slate-900 overflow-x-hidden font-medium">

        {/* ==========================================
            HERO SECTION (Geometric Shape Landing - Light Theme)
            ========================================== */}
        <section className="relative pt-36 pb-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-100 overflow-hidden flex flex-col justify-center min-h-[70vh]">
          {/* Subtle Ambient Light Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.03] via-transparent to-[#22B6F6]/[0.03] blur-3xl pointer-events-none z-0" />

          {/* Dot Grid Background */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.22] z-0"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, #1155CC 1.5px, transparent 0)`,
              backgroundSize: "28px 28px"
            }}
          />

          {/* Floating Glassmorphic Shapes (Light Theme) */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {mounted && isMobile ? (
              <>
                <ElegantShape
                  delay={0.3}
                  width={240}
                  height={60}
                  rotate={12}
                  gradient="from-blue-500/[0.08]"
                  light={true}
                  className="left-[-15%] top-[10%]"
                />
                <ElegantShape
                  delay={0.5}
                  width={180}
                  height={45}
                  rotate={-15}
                  gradient="from-cyan-500/[0.08]"
                  light={true}
                  className="right-[-10%] bottom-[15%]"
                />
              </>
            ) : (
              <>
                <ElegantShape
                  delay={0.3}
                  width={520}
                  height={130}
                  rotate={12}
                  gradient="from-blue-500/[0.08]"
                  light={true}
                  className="left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]"
                />

                <ElegantShape
                  delay={0.5}
                  width={420}
                  height={110}
                  rotate={-15}
                  gradient="from-cyan-500/[0.08]"
                  light={true}
                  className="right-[-5%] md:right-[0%] top-[60%] md:top-[65%]"
                />

                <ElegantShape
                  delay={0.4}
                  width={280}
                  height={75}
                  rotate={-8}
                  gradient="from-indigo-500/[0.08]"
                  light={true}
                  className="left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%]"
                />

                <ElegantShape
                  delay={0.6}
                  width={180}
                  height={50}
                  rotate={20}
                  gradient="from-blue-600/[0.08]"
                  light={true}
                  className="right-[15%] md:right-[20%] top-[10%] md:top-[15%]"
                />

                <ElegantShape
                  delay={0.7}
                  width={130}
                  height={35}
                  rotate={-25}
                  gradient="from-cyan-400/[0.08]"
                  light={true}
                  className="left-[20%] md:left-[25%] top-[5%] md:top-[10%]"
                />
              </>
            )}
          </div>

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 bg-[#F1F5F9] border border-[#1155CC]/15 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 rounded-full bg-[#22B6F6] animate-pulse" />
              <span className="text-[10px] font-black text-[#1155CC] tracking-widest uppercase">
                Join Our Tech Mission
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6.5xl font-black text-slate-900 tracking-tight leading-tight mb-6">
              Build Your Engineering Career With <br />
              <span className="text-[#1155CC]">
                TechSonance InfoTech LLP
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed mb-8">
              We design and construct production-grade SaaS, AI systems, and cloud architectures. Learn, create, and launch products that make an immediate business impact.
            </p>

            <a
              href="#positions"
              className="inline-flex items-center gap-2 rounded-full btn-primary px-7 py-3 text-sm font-semibold text-white cursor-pointer shadow-lg hover:shadow-xl transition-all"
            >
              View Open Positions
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
                <Icon name="arrow" className="h-3 w-3" />
              </span>
            </a>
          </div>

          {/* Fade transition to the light section below */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#FAFBFD] to-transparent pointer-events-none z-0" />
        </section>

        {/* ==========================================
            WHY JOIN OUR TEAM
            ========================================== */}
        <section className="w-full py-20 bg-[#f9f9ff] relative overflow-hidden border-b border-slate-100">

          {/* Background Animated Orbits */}
          <div className="absolute right-[-150px] top-[-150px] w-[500px] h-[500px] pointer-events-none hidden md:block opacity-90 z-0">
            <div className="absolute inset-0 border-2 border-dashed border-[#0066ff]/40 rounded-full animate-[spin_80s_linear_infinite]">
              <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center border border-[#e7eeff]">
                <Icon name="code" className="w-5 h-5 text-[#1155CC] animate-[spin_10s_linear_infinite]" />
              </div>
              <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center border border-[#e7eeff]">
                <Icon name="bolt" className="w-5 h-5 text-cyan-600" />
              </div>
            </div>

            <div className="absolute inset-16 border-2 border-[#5d60eb]/30 rounded-full animate-[spin_50s_linear_infinite_reverse]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center border border-[#e7eeff]">
                <Icon name="database" className="w-5 h-5 text-violet-600" />
              </div>
            </div>

            <div className="absolute inset-32 border border-[#0066ff]/20 rounded-full flex items-center justify-center">
              <svg className="w-full h-full text-[#0066ff]/20" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M 50 10 A 40 40 0 0 1 90 50" strokeDasharray="2 2" />
                <path d="M 50 90 A 40 40 0 0 1 10 50" />
                <path d="M 15 50 A 35 35 0 0 1 85 50" strokeDasharray="4 2" />
              </svg>
            </div>

            <div className="absolute inset-[180px] rounded-full bg-gradient-to-tr from-[#0066ff] to-[#1155CC] opacity-20 blur-xl" />
          </div>

          <div className="absolute left-[-120px] bottom-[-120px] w-[400px] h-[400px] pointer-events-none hidden md:block opacity-90 z-0">
            <div className="absolute inset-0 border-2 border-dashed border-[#1155CC]/30 rounded-full animate-[spin_60s_linear_infinite_reverse]">
              <div className="absolute bottom-1/2 left-0 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center border border-[#e7eeff]">
                <Icon name="arrow" className="w-5 h-5 text-emerald-600" />
              </div>
            </div>

            <div className="absolute inset-16 border-2 border-[#0066ff]/20 rounded-full" />

            <div className="absolute inset-[130px] rounded-full bg-gradient-to-br from-[#1155CC] to-[#00ccf9] opacity-20 blur-xl" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 bg-blue-50/50 border border-[#1155CC]/10 rounded-full px-4.5 py-1 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1155CC] animate-ping" />
                <span className="text-[9px] font-black text-[#1155CC] uppercase tracking-wider">Core Values</span>
              </div>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Why Join Our Team?</h3>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold max-w-2xl mx-auto mt-3 leading-relaxed">
                We look for engineers who are passionate about writing clean, robust code, architecting smart systems, and building solutions that deliver real-world business impact.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {cultureValues.map((val, idx) => {
                const theme = cultureColors[idx % cultureColors.length];
                return (
                  <motion.div
                    key={val.title}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className={cn(
                      "relative bg-white border border-slate-100 rounded-3xl p-6 shadow-sm",
                      "hover:shadow-md transition-all duration-300 group overflow-hidden flex flex-col justify-between"
                    )}
                  >
                    <div className={cn("absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100", theme.glow)} />

                    <div className="relative z-10">
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 shadow-sm", theme.iconBg)}>
                        <Icon name={val.icon as any} className={cn("w-5 h-5 transition-transform duration-500 group-hover:rotate-12", theme.text)} />
                      </div>

                      <h4 className="text-base font-bold text-slate-900 mb-3 group-hover:text-[#1155CC] transition-colors duration-200">{val.title}</h4>
                      <p className="text-xs text-slate-450 leading-relaxed font-medium">{val.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ==========================================
            LIFE AT TECHSONANCE
            ========================================== */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <h2 className="text-xs font-black uppercase tracking-widest text-[#1155CC] mb-3">Life at TechSonance</h2>
                <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-5">
                  Engineers Working Together, Scaling Limits.
                </h3>
                <p className="text-sm sm:text-base text-slate-500 font-medium leading-relaxed mb-6">
                  At TechSonance, we are team-focused and engineering-obsessed. From intense architecture design sprints to lighthearted brainstorming calls, our work is defined by collaboration, respect, and constant technical improvement.
                </p>

                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                  <div>
                    <span className="block text-2xl font-extrabold text-[#1155CC]">100%</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Engineering Culture</span>
                  </div>
                  <div>
                    <span className="block text-2xl font-extrabold text-[#1155CC]">Direct</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Mentor Relationship</span>
                  </div>
                </div>
              </div>

              {/* Single Team Collaboration Image */}
              <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-md aspect-[16/10] relative w-full">
                <SafeImage
                  src="/images/about-team-collaboration.png"
                  alt="Team collaboration"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================
            OPEN POSITIONS (FULL STACK DEVELOPER INTERN)
            ========================================== */}
        <section id="positions" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative overflow-hidden border-b border-slate-100">
          <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-50 pointer-events-none" />
          <motion.div
            animate={{
              y: [0, -15, 0],
              x: [0, 10, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-10 left-10 w-72 h-72 rounded-full bg-[#1155CC]/5 blur-3xl pointer-events-none"
          />
          <motion.div
            animate={{
              y: [0, 15, 0],
              x: [0, -10, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-indigo-50/20 blur-3xl pointer-events-none"
          />

          <div className="text-center max-w-3xl mx-auto mb-16 relative z-10">
            <h2 className="text-xs font-black uppercase tracking-widest text-[#1155CC] mb-3">Join Us</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Open Opportunities</h3>
            <p className="text-sm sm:text-base text-slate-500 font-medium mt-2">
              Browse our currently open positions and find where you fit.
            </p>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-10 shadow-sm hover:shadow-md transition-all duration-300 max-w-4xl mx-auto group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#1155CC]/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-8 border-b border-slate-100 relative z-10">
              <div>
                <span className="text-[9px] font-black text-[#1155CC] uppercase tracking-wider bg-blue-50 border border-blue-100/50 px-3 py-1 rounded-full mb-3 inline-block">
                  Active Internship
                </span>
                <h4 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Full Stack Developer Intern</h4>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs font-semibold text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> On-Site
                  </span>
                  <span className="text-slate-200">•</span>
                  <span>Duration: 3-6 Months</span>
                  <span className="text-slate-200">•</span>
                  <span className="text-[#1155CC]">Stipend: Competitive</span>
                </div>
              </div>
              <a
                href="#apply"
                className="group/btn rounded-full bg-slate-900 hover:bg-[#1155CC] text-white px-8 py-3 text-xs font-bold tracking-wide transition-all duration-300 flex items-center gap-2 shadow-sm"
              >
                Apply Now
                <Icon name="arrow" className="w-3.5 h-3.5 transition-transform duration-300 group-hover/btn:translate-x-1" />
              </a>
            </div>

            <div className="py-8 space-y-8 relative z-10">
              <div>
                <h5 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 font-mono">{"// Role Overview"}</h5>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  We are looking for a highly motivated Full Stack Developer Intern who is passionate about web development, UI design, and cloud services. You will work side-by-side with senior developers to construct premium products, write production-ready code, and implement state-of-the-art APIs.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-50">
                <div>
                  <h5 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 font-mono">{"// Key Responsibilities"}</h5>
                  <ul className="space-y-3">
                    {[
                      "Design and build clean, responsive client-side UI components in React and Next.js.",
                      "Develop scalable backend logic and RESTful API integrations in Node.js & TypeScript.",
                      "Optimize databases (PostgreSQL/MongoDB) and manage state flow.",
                      "Collaborate in Git workflows, code reviews, and project scoping processes."
                    ].map((resp, i) => (
                      <li key={i} className="flex items-start gap-3 text-xs text-slate-650 font-medium">
                        <span className="w-5 h-5 rounded-full bg-blue-50/50 border border-blue-100/50 flex items-center justify-center text-[#1155CC] shrink-0 mt-0.5 font-bold">
                          ✓
                        </span>
                        <span>{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h5 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 font-mono">{"// Technical Requirements"}</h5>
                  <ul className="space-y-3">
                    {[
                      "Familiarity with JS/TS, React, Tailwind CSS, and HTML5 semantic markup.",
                      "Basic understanding of database schemas and backend query models.",
                      "Comfortable with Git command workflows and clean commit management.",
                      "Strong willingness to receive feedback, learn fast, and solve complex problems."
                    ].map((req, i) => (
                      <li key={i} className="flex items-start gap-3 text-xs text-slate-650 font-medium">
                        <span className="w-5 h-5 rounded-full bg-indigo-50/50 border border-indigo-100/50 flex items-center justify-center text-indigo-650 shrink-0 mt-0.5 font-bold">
                          ✓
                        </span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-50">
                <h5 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 font-mono">{"// Tech Stack / Tools You Will Use"}</h5>
                <div className="flex flex-wrap gap-2.5">
                  {[
                    { name: "React", bg: "bg-blue-50/50 border-blue-100 text-blue-700" },
                    { name: "Next.js", bg: "bg-slate-50 border-slate-200 text-slate-800" },
                    { name: "Node.js", bg: "bg-emerald-50/50 border-emerald-100 text-emerald-700" },
                    { name: "TypeScript", bg: "bg-[#1155CC]/5 border-[#1155CC]/15 text-[#1155CC]" },
                    { name: "Tailwind CSS", bg: "bg-cyan-50/50 border-cyan-100 text-cyan-700" },
                    { name: "PostgreSQL", bg: "bg-indigo-50/50 border-indigo-100 text-indigo-750" },
                    { name: "Framer Motion", bg: "bg-violet-50/50 border-violet-100 text-violet-750" },
                    { name: "Git", bg: "bg-orange-50/50 border-orange-100 text-orange-700" }
                  ].map((tech) => (
                    <span
                      key={tech.name}
                      className={cn(
                        "text-[10px] sm:text-xs font-mono font-semibold border px-3 py-1 rounded-lg transition-transform duration-200 hover:-translate-y-0.5 cursor-default shadow-2xs",
                        tech.bg
                      )}
                    >
                      {tech.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================
            HIRING PROCESS
            ========================================== */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#f9f9ff] border-b border-slate-100 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#e1e8f5_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 bg-[#1155CC]/5 border border-[#1155CC]/10 rounded-full px-4 py-1 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1155CC]" />
                <span className="text-[9px] font-black text-[#1155CC] uppercase tracking-wider">Hiring Path</span>
              </div>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Our Hiring Process</h3>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold max-w-xl mx-auto mt-2 leading-relaxed">
                We believe in a transparent, fast-paced assessment cycle designed to value your engineering and problem-solving abilities.
              </p>
            </div>

            <div className="relative">
              <div className="absolute top-12 left-10 right-10 h-0.5 border-t-2 border-dashed border-slate-200/80 pointer-events-none hidden md:block z-0" />

              <div className="flex overflow-x-auto md:grid md:grid-cols-4 gap-8 pb-8 md:pb-0 scrollbar-none snap-x snap-mandatory z-10 relative">
                {hiringProcessSteps.map((step, idx) => (
                  <motion.div
                    key={step.step}
                    whileHover={{ y: -6 }}
                    className="flex-shrink-0 w-[280px] md:w-auto snap-center bg-white border border-slate-100/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center font-mono font-bold text-slate-800 shadow-sm relative z-10 group-hover:border-[#1155CC]/30 group-hover:bg-[#1155CC] group-hover:text-white transition-all duration-300 mb-6">
                        {step.step}
                      </div>

                      <h4 className="text-base font-bold text-slate-900 mb-2 group-hover:text-[#1155CC] transition-colors duration-200">{step.title}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">{step.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================
            HIRING APPLICATION FORM
            ========================================== */}
        <section id="apply" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

            <div className="lg:col-span-5 pr-0 lg:pr-6">
              <h2 className="text-xs font-black uppercase tracking-widest text-[#1155CC] mb-3">Join Us Today</h2>
              <h3 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
                Submit Your Application
              </h3>
              <p className="text-sm text-slate-550 leading-relaxed font-medium mb-6">
                Tell us about yourself and upload your latest resume. Once submitted, our team will review details and get back to you within 3 business days.
              </p>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-50 text-[#1155CC] flex items-center justify-center shrink-0 mt-0.5">
                    <Icon name="check" className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Immediate Reviews</h4>
                    <p className="text-[10px] text-slate-400 font-medium">All applications are screened by real engineering leads directly.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-50 text-[#1155CC] flex items-center justify-center shrink-0 mt-0.5">
                    <Icon name="check" className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Direct Contact</h4>
                    <p className="text-[10px] text-slate-400 font-medium">You will receive notifications at every single step of evaluation.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 bg-white border-2 border-[#22B6F6] rounded-3xl p-6 sm:p-8 shadow-[0_15px_35px_rgba(17,85,204,0.02)]">
              <form onSubmit={handleFormSubmit} className="space-y-6">

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="fullName" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Full Name <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      id="fullName"
                      required
                      value={formData.fullName}
                      onChange={handleInputChange}
                      onBlur={() => setTouched(prev => ({ ...prev, fullName: true }))}
                      placeholder="e.g. John Doe"
                      className={`w-full rounded-2xl border ${getValidationError("fullName") ? "border-red-500 focus:border-red-500 focus:ring-red-500/10" : "border-slate-200 focus:border-[#1155CC] focus:ring-[#1155CC]/10"} bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:bg-white transition-all font-medium`}
                    />
                    {getValidationError("fullName") && (
                      <p className="text-[10px] font-semibold text-red-500 mt-1">{getValidationError("fullName")}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Email Address <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                      placeholder="john@example.com"
                      className={`w-full rounded-2xl border ${getValidationError("email") ? "border-red-500 focus:border-red-500 focus:ring-red-500/10" : "border-slate-200 focus:border-[#1155CC] focus:ring-[#1155CC]/10"} bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:bg-white transition-all font-medium`}
                    />
                    {getValidationError("email") && (
                      <p className="text-[10px] font-semibold text-red-500 mt-1">{getValidationError("email")}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="role" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Role Interested In <span className="text-red-500 font-bold">*</span>
                  </label>
                  <select
                    name="role"
                    id="role"
                    required
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-[#1155CC] focus:ring-2 focus:ring-[#1155CC]/10 transition-all cursor-pointer font-bold"
                  >
                    <option value="Full Stack Developer Intern">Full Stack Developer Intern</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="resume" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Resume Upload (PDF / DOCX - Max 5MB) <span className="text-red-500 font-bold">*</span>
                  </label>
                  <div
                    onClick={() => {
                      setTouched(prev => ({ ...prev, resume: true }));
                      fileInputRef.current?.click();
                    }}
                    className={`w-full border-2 border-dashed ${getValidationError("resume") ? "border-red-500 bg-red-50/5 hover:bg-red-50/10" : "border-slate-200 hover:border-[#1155CC] hover:bg-slate-50/50"} rounded-2xl px-6 py-6 text-center cursor-pointer transition-all flex flex-col items-center`}
                  >
                    <input
                      type="file"
                      name="resume"
                      id="resume"
                      ref={fileInputRef}
                      required
                      accept=".pdf,.docx,.doc"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="w-10 h-10 rounded-2xl bg-blue-50/50 text-[#1155CC] border border-blue-150 flex items-center justify-center mb-3">
                      <Icon name="chevron" className="w-5 h-5 rotate-180" />
                    </div>
                    {resumeFile ? (
                      <div>
                        <span className="block text-xs font-bold text-slate-900">{resumeFile.name}</span>
                        <span className="block text-[10px] text-slate-400 font-medium mt-0.5">
                          Click to select a different file
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="block text-xs font-bold text-slate-900">Drag or select your resume file</span>
                        <span className="block text-[10px] text-slate-400 font-medium mt-0.5">
                          PDF, DOCX formats supported
                        </span>
                      </div>
                    )}
                  </div>
                  {getValidationError("resume") && (
                    <p className="text-[10px] font-semibold text-red-500 mt-1">{getValidationError("resume")}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="message" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Tell Us About Yourself / Cover Letter <span className="text-red-500 font-bold">*</span>
                  </label>
                  <textarea
                    name="message"
                    id="message"
                    required
                    rows={4}
                    value={formData.message}
                    onChange={handleInputChange}
                    onBlur={() => setTouched(prev => ({ ...prev, message: true }))}
                    placeholder="Briefly introduce yourself, mention links to your portfolio/GitHub, and why you are excited to join us..."
                    className={`w-full rounded-2xl border ${getValidationError("message") ? "border-red-500 focus:border-red-500 focus:ring-red-500/10" : "border-slate-200 focus:border-[#1155CC] focus:ring-[#1155CC]/10"} bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:bg-white transition-all font-medium`}
                  />
                  {getValidationError("message") && (
                    <p className="text-[10px] font-semibold text-red-500 mt-1">{getValidationError("message")}</p>
                  )}
                </div>

                {/* Status Banners */}
                <AnimatePresence mode="wait">
                  {status === "error" && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-xs font-bold"
                    >
                      {errorMessage || "An error occurred. Please check your inputs."}
                    </motion.div>
                  )}

                  {status === "success" && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-xs font-bold"
                    >
                      🎉 Application submitted successfully! We will get in touch with you soon.
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={status === "loading" || !isFormValid}
                  className="w-full flex items-center justify-center gap-2 rounded-full btn-primary py-3.5 text-sm font-semibold text-white cursor-pointer shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === "loading" ? "Submitting Application..." : "Submit Application"}
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
                    <Icon name="arrow" className="h-3 w-3" />
                  </span>
                </button>

              </form>
            </div>
          </div>
        </section>

        {/* ==========================================
            CTA SECTION
            ========================================== */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#1155CC] to-[#22B6F6] text-white relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-[0.08]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1.5px, transparent 0)`,
              backgroundSize: "28px 28px"
            }}
          />

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
              Not Ready to Apply Yet?
            </h3>
            <p className="text-sm sm:text-base text-blue-50/90 max-w-xl mx-auto font-medium leading-relaxed mb-8">
              Reach out to learn more about our company services, clients, or schedule a general introduction call.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/about"
                className="w-full sm:w-auto rounded-full bg-white hover:bg-slate-50 text-[#1155CC] px-7 py-3 text-sm font-bold shadow-md transition-all duration-300"
              >
                About Company
              </a>
              <a
                href="/contact"
                className="w-full sm:w-auto rounded-full border border-white/40 hover:border-white text-white px-7 py-3 text-sm font-bold transition-all duration-300"
              >
                Contact Us
              </a>
            </div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </>
  );
}
