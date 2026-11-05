"use client";

import React, {
  useState,
  useRef,
  useSyncExternalStore,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X, Sparkles, MapPin, Briefcase, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import SafeImage from "@/app/components/SafeImage";
import SiteHeader from "@/app/components/home/SiteHeader";
import SiteFooter from "@/app/components/home/SiteFooter";
import { Icon, type IconName } from "@/app/components/icons/Icon";
import { ElegantShape } from "@/components/ui/shape-landing-hero";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { JobPosting } from "@/lib/content/types";
import { filterJobs } from "./filterUtils";
import { TalentPoolCaptureModal } from "@/components/careers/TalentPoolCaptureModal";

const subscribeResize = (callback: () => void) => {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
};

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
    iconBg: "bg-blue-100",
  },
  {
    text: "text-cyan-600",
    glow: "bg-cyan-400/5",
    iconBg: "bg-cyan-100",
  },
  {
    text: "text-violet-600",
    glow: "bg-violet-400/5",
    iconBg: "bg-violet-100",
  },
  {
    text: "text-emerald-600",
    glow: "bg-emerald-400/5",
    iconBg: "bg-emerald-100",
  },
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

export default function CareersClient({ initialJobs }: { initialJobs?: JobPosting[] } = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [selectedDept, setSelectedDept] = useState(
    searchParams.get("dept") || searchParams.get("department") || "all",
  );
  const [selectedMode, setSelectedMode] = useState(
    searchParams.get("mode") || searchParams.get("workMode") || "all",
  );
  const [selectedType, setSelectedType] = useState(searchParams.get("type") || "all");
  const [selectedExp, setSelectedExp] = useState(
    searchParams.get("exp") || searchParams.get("experienceLevel") || "all",
  );

  const [selectedSort, setSelectedSort] = useState(searchParams.get("sort") || "newest");
  const [isTalentPoolOpen, setIsTalentPoolOpen] = useState(false);

  const PAGE_SIZE = 6;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Sync state from URL when user navigates back/forward
  useEffect(() => {
    setSearchTerm(searchParams.get("search") || "");
    setSelectedDept(searchParams.get("dept") || searchParams.get("department") || "all");
    setSelectedMode(searchParams.get("mode") || searchParams.get("workMode") || "all");
    setSelectedType(searchParams.get("type") || "all");
    setSelectedExp(searchParams.get("exp") || searchParams.get("experienceLevel") || "all");
    setSelectedSort(searchParams.get("sort") || "newest");
    setVisibleCount(PAGE_SIZE);
  }, [searchParams]);

  // Sync state to URL with shallow replace
  const updateUrl = useCallback(
    (overrides: {
      search?: string;
      dept?: string;
      mode?: string;
      type?: string;
      exp?: string;
      sort?: string;
    }) => {
      const nextSearch = overrides.search !== undefined ? overrides.search : searchTerm;
      const nextDept = overrides.dept !== undefined ? overrides.dept : selectedDept;
      const nextMode = overrides.mode !== undefined ? overrides.mode : selectedMode;
      const nextType = overrides.type !== undefined ? overrides.type : selectedType;
      const nextExp = overrides.exp !== undefined ? overrides.exp : selectedExp;
      const nextSort = overrides.sort !== undefined ? overrides.sort : selectedSort;

      const params = new URLSearchParams();
      if (nextSearch.trim()) params.set("search", nextSearch.trim());
      if (nextDept && nextDept.toLowerCase() !== "all") params.set("dept", nextDept);
      if (nextMode && nextMode.toLowerCase() !== "all") params.set("mode", nextMode);
      if (nextType && nextType.toLowerCase() !== "all") params.set("type", nextType);
      if (nextExp && nextExp.toLowerCase() !== "all") params.set("exp", nextExp);
      if (nextSort && nextSort !== "newest") params.set("sort", nextSort);

      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [
      router,
      pathname,
      searchTerm,
      selectedDept,
      selectedMode,
      selectedType,
      selectedExp,
      selectedSort,
    ],
  );

  // Debounced search sync to URL
  useEffect(() => {
    const handler = setTimeout(() => {
      const currentParam = searchParams.get("search") || "";
      if (searchTerm.trim() !== currentParam) {
        updateUrl({ search: searchTerm });
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm, searchParams, updateUrl]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedDept("all");
    setSelectedMode("all");
    setSelectedType("all");
    setSelectedExp("all");
    setSelectedSort("newest");
    setVisibleCount(PAGE_SIZE);
    router.replace(pathname, { scroll: false });
  };

  const allJobs = useMemo(() => initialJobs || [], [initialJobs]);

  const filteredJobs = useMemo(() => {
    return filterJobs(allJobs, {
      search: searchTerm,
      department: selectedDept,
      workMode: selectedMode,
      type: selectedType,
      experienceLevel: selectedExp,
      sortBy: selectedSort as "newest" | "closing_soon" | "title",
    });
  }, [allJobs, searchTerm, selectedDept, selectedMode, selectedType, selectedExp, selectedSort]);

  const displayedJobs = useMemo(() => {
    return filteredJobs.slice(0, visibleCount);
  }, [filteredJobs, visibleCount]);

  const departments = useMemo(() => {
    const set = new Set<string>();
    allJobs.forEach((j) => {
      if (j.department) set.add(j.department);
    });
    return ["All", ...Array.from(set)];
  }, [allJobs]);

  const workModes = [
    { label: "All Modes", value: "all" },
    { label: "Remote", value: "remote" },
    { label: "Hybrid", value: "hybrid" },
    { label: "On-site", value: "on_site" },
  ];

  const jobTypes = [
    { label: "All Types", value: "all" },
    { label: "Full Time", value: "full_time" },
    { label: "Contract", value: "contract" },
    { label: "Internship", value: "internship" },
  ];

  const isMobile = useSyncExternalStore(
    subscribeResize,
    () => window.innerWidth < 768,
    () => false,
  );

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
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.22] z-0"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, #1155CC 1.5px, transparent 0)`,
              backgroundSize: "28px 28px",
            }}
          />

          {/* Floating Glassmorphic Shapes (Light Theme) */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {isMobile ? (
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
              <span className="text-[#1155CC]">TechSonance InfoTech LLP</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed mb-8">
              We design and construct production-grade SaaS, AI systems, and cloud architectures.
              Learn, create, and launch products that make an immediate business impact.
            </p>

            <Button asChild variant="default">
              <a href="#positions">View Open Positions</a>
            </Button>
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
                <Icon
                  name="code"
                  className="w-5 h-5 text-[#1155CC] animate-[spin_10s_linear_infinite]"
                />
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
              <svg
                className="w-full h-full text-[#0066ff]/20"
                viewBox="0 0 100 100"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
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
                <span className="text-[9px] font-black text-[#1155CC] uppercase tracking-wider">
                  Core Values
                </span>
              </div>
              <h3 className="text-3xl sm:text-4xl font-medium text-slate-900 tracking-tight">
                Why Join Our Team?
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold max-w-2xl mx-auto mt-3 leading-relaxed">
                We look for engineers who are passionate about writing clean, robust code,
                architecting smart systems, and building solutions that deliver real-world business
                impact.
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
                      "hover:shadow-md transition-all duration-300 group overflow-hidden flex flex-col justify-between",
                    )}
                  >
                    <div
                      className={cn(
                        "absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100",
                        theme.glow,
                      )}
                    />

                    <div className="relative z-10">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 shadow-sm",
                          theme.iconBg,
                        )}
                      >
                        <Icon
                          name={val.icon as IconName}
                          className={cn(
                            "w-5 h-5 transition-transform duration-500 group-hover:rotate-12",
                            theme.text,
                          )}
                        />
                      </div>

                      <h4 className="text-base font-bold text-slate-900 mb-3 group-hover:text-[#1155CC] transition-colors duration-200">
                        {val.title}
                      </h4>
                      <p className="text-xs text-slate-450 leading-relaxed font-medium">
                        {val.desc}
                      </p>
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
                <h2 className="text-xs font-black uppercase tracking-widest text-[#1155CC] mb-3">
                  Life at TechSonance
                </h2>
                <h3 className="text-3xl sm:text-4xl font-medium text-slate-900 tracking-tight mb-5">
                  Engineers Working Together, Scaling Limits.
                </h3>
                <p className="text-sm sm:text-base text-slate-500 font-medium leading-relaxed mb-6">
                  At TechSonance, we are team-focused and engineering-obsessed. From intense
                  architecture design sprints to lighthearted brainstorming calls, our work is
                  defined by collaboration, respect, and constant technical improvement.
                </p>

                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                  <div>
                    <span className="block text-2xl font-medium text-[#1155CC]">100%</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Engineering Culture
                    </span>
                  </div>
                  <div>
                    <span className="block text-2xl font-medium text-[#1155CC]">Direct</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Mentor Relationship
                    </span>
                  </div>
                </div>
              </div>

              {/* Single Team Collaboration Image */}
              <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-md aspect-[16/10] relative w-full">
                <SafeImage
                  src="/images/careers-life-at-techsonance.jpg"
                  alt="TechSonance engineers collaborating on ideas, product strategy, and scalable architectures"
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
        <section
          id="positions"
          className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative overflow-hidden border-b border-slate-100"
        >
          <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-50 pointer-events-none" />
          <motion.div
            animate={{
              y: [0, -15, 0],
              x: [0, 10, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
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
              ease: "easeInOut",
            }}
            className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-indigo-50/20 blur-3xl pointer-events-none"
          />

          <div className="text-center max-w-3xl mx-auto mb-10 relative z-10">
            <h2 className="text-xs font-black uppercase tracking-widest text-[#1155CC] mb-3">
              Join Us
            </h2>
            <h3 className="text-3xl sm:text-4xl font-medium text-slate-900 tracking-tight">
              Open Opportunities
            </h3>
            <p className="text-sm sm:text-base text-slate-500 font-medium mt-2">
              Browse our currently open positions, filter by discipline, and find where you fit.
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div className="max-w-4xl mx-auto mb-10 space-y-4 relative z-10">
            {/* Search Input Box */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by title, technology (React, Node, Next.js), department, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-12 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1155CC]/20 focus:border-[#1155CC] shadow-xs transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    updateUrl({ search: "" });
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Department Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
                Department:
              </span>
              {departments.map((dept) => {
                const isActive =
                  selectedDept.toLowerCase() === dept.toLowerCase() ||
                  (dept === "All" && (!selectedDept || selectedDept.toLowerCase() === "all"));
                return (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => {
                      const next = dept === "All" ? "all" : dept;
                      setSelectedDept(next);
                      updateUrl({ dept: next });
                    }}
                    className={cn(
                      "text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all shrink-0 cursor-pointer",
                      isActive
                        ? "bg-[#1155CC] text-white shadow-xs"
                        : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                    )}
                  >
                    {dept}
                  </button>
                );
              })}
            </div>

            {/* Additional Filter Selects / Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
                Work Mode:
              </span>
              {workModes.map((wm) => {
                const isActive = selectedMode === wm.value;
                return (
                  <button
                    key={wm.value}
                    type="button"
                    onClick={() => {
                      setSelectedMode(wm.value);
                      updateUrl({ mode: wm.value });
                    }}
                    className={cn(
                      "text-xs font-semibold px-3 py-1 rounded-full transition-all shrink-0 cursor-pointer",
                      isActive
                        ? "bg-slate-800 text-white shadow-xs"
                        : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                    )}
                  >
                    {wm.label}
                  </button>
                );
              })}

              <span className="text-slate-200 mx-2 hidden sm:inline">|</span>

              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
                Type:
              </span>
              {jobTypes.map((jt) => {
                const isActive = selectedType === jt.value;
                return (
                  <button
                    key={jt.value}
                    type="button"
                    onClick={() => {
                      setSelectedType(jt.value);
                      updateUrl({ type: jt.value });
                    }}
                    className={cn(
                      "text-xs font-semibold px-3 py-1 rounded-full transition-all shrink-0 cursor-pointer",
                      isActive
                        ? "bg-slate-800 text-white shadow-xs"
                        : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                    )}
                  >
                    {jt.label}
                  </button>
                );
              })}

              <span className="text-slate-200 mx-2 hidden sm:inline">|</span>

              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
                Sort:
              </span>
              <select
                value={selectedSort}
                onChange={(e) => {
                  setSelectedSort(e.target.value);
                  updateUrl({ sort: e.target.value });
                }}
                className="text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="closing_soon">Closing Soon</option>
                <option value="title">Role Title (A-Z)</option>
              </select>

              {/* Active filters reset button */}
              {(searchTerm ||
                selectedDept !== "all" ||
                selectedMode !== "all" ||
                selectedType !== "all" ||
                selectedExp !== "all" ||
                selectedSort !== "newest") && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-semibold ml-auto px-2 py-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset filters
                </button>
              )}
            </div>
          </div>

          {/* Job Listings / Empty State */}
          <div className="max-w-4xl mx-auto space-y-6 relative z-10">
            {displayedJobs.length > 0 ? (
              <>
                {displayedJobs.map((job) => {
                  const isNew = Boolean(
                    job.publishedAt &&
                    Date.now() - new Date(job.publishedAt).getTime() <= 14 * 24 * 60 * 60 * 1000,
                  );
                  const isClosingSoon = Boolean(
                    job.closesAt &&
                    new Date(job.closesAt).getTime() > Date.now() &&
                    new Date(job.closesAt).getTime() - Date.now() <= 7 * 24 * 60 * 60 * 1000,
                  );

                  return (
                    <div
                      key={job.id}
                      className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-xs hover:shadow-md transition-all duration-300 group relative overflow-hidden"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-100">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="text-[10px] font-black text-[#1155CC] uppercase tracking-wider bg-blue-50 border border-blue-100/50 px-3 py-1 rounded-full inline-block">
                              {job.department} • Active Opening
                            </span>
                            {isNew && (
                              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                                ✨ New
                              </span>
                            )}
                            {isClosingSoon && (
                              <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                                ⏰ Closing Soon
                              </span>
                            )}
                            {job.workMode && (
                              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-full inline-block">
                                {job.workMode}
                              </span>
                            )}
                          </div>
                          <Link
                            href={`/careers/${job.slug}`}
                            className="block text-2xl sm:text-3xl font-medium text-slate-900 tracking-tight hover:text-[#1155CC] transition-colors"
                          >
                            {job.title}
                          </Link>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs font-semibold text-slate-500">
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                              {job.location}
                            </span>
                            <span className="text-slate-200">•</span>
                            <span className="flex items-center gap-1.5">
                              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                              {job.type}
                            </span>
                            {job.experienceLevel && (
                              <>
                                <span className="text-slate-200">•</span>
                                <span className="text-[#1155CC]">Level: {job.experienceLevel}</span>
                              </>
                            )}
                            {job.showSalaryPublicly && job.salaryMin && (
                              <>
                                <span className="text-slate-200">•</span>
                                <span className="text-emerald-600 font-bold">
                                  {job.salaryCurrency || "INR"} {job.salaryMin.toLocaleString()}
                                  {job.salaryMax
                                    ? ` - ${job.salaryMax.toLocaleString()}`
                                    : ""} /{" "}
                                  {job.salaryPeriod || "month"}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 self-stretch sm:self-auto">
                          <Button asChild variant="outline" size="sm" className="rounded-xl">
                            <Link href={`/careers/${job.slug}`}>View Details</Link>
                          </Button>
                          <Button asChild variant="default" size="sm" className="rounded-xl">
                            <Link href={`/careers/${job.slug}#apply-form`}>Apply Now</Link>
                          </Button>
                        </div>
                      </div>

                      <div className="pt-6 space-y-4">
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium line-clamp-3">
                          {job.summary || job.description}
                        </p>

                        {job.skills && job.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-2">
                            {job.skills.slice(0, 7).map((skill) => (
                              <span
                                key={skill}
                                className="text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200 px-2.5 py-0.5 rounded-md"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {filteredJobs.length > visibleCount && (
                  <div className="pt-6 text-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                      className="rounded-2xl border-slate-300 hover:border-[#1155CC] hover:text-[#1155CC] font-bold px-8 shadow-xs"
                    >
                      Load More Positions ({filteredJobs.length - visibleCount} remaining)
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-10 sm:p-14 text-center max-w-2xl mx-auto space-y-5">
                <div className="w-16 h-16 mx-auto rounded-full bg-blue-50 text-[#1155CC] flex items-center justify-center">
                  <Search className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl sm:text-2xl font-bold text-slate-900">
                    No roles found matching your criteria
                  </h4>
                  <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                    We couldn't find any positions matching your selected filters. Try clearing
                    filters or joining our talent pool for future opportunities.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={handleResetFilters}
                    className="rounded-xl px-5"
                  >
                    Reset all filters
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => setIsTalentPoolOpen(true)}
                    className="rounded-xl px-5 bg-[#1155CC] hover:bg-[#0d44a4] text-white flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Join our Talent Pool
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Talent Pool CTA card */}
          <div className="max-w-4xl mx-auto mt-12 p-6 sm:p-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-lg font-bold text-slate-900 flex items-center justify-center sm:justify-start gap-2">
                <Sparkles className="w-5 h-5 text-[#1155CC]" />
                Don't see your specific role?
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 max-w-lg">
                We're constantly expanding. Join our Talent Pool and our engineering recruitment
                team will reach out directly when matching roles open up.
              </p>
            </div>
            <Button
              onClick={() => setIsTalentPoolOpen(true)}
              className="bg-[#1155CC] hover:bg-[#0d44a4] text-white shrink-0 rounded-xl px-6"
            >
              Join Talent Pool
            </Button>
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
                <span className="text-[9px] font-black text-[#1155CC] uppercase tracking-wider">
                  Hiring Path
                </span>
              </div>
              <h3 className="text-3xl sm:text-4xl font-medium text-slate-900 tracking-tight">
                Our Hiring Process
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold max-w-xl mx-auto mt-2 leading-relaxed">
                We believe in a transparent, fast-paced assessment cycle designed to value your
                engineering and problem-solving abilities.
              </p>
            </div>

            <div className="relative">
              <div className="absolute top-12 left-10 right-10 h-0.5 border-t-2 border-dashed border-slate-200/80 pointer-events-none hidden md:block z-0" />

              <div className="flex overflow-x-auto md:grid md:grid-cols-4 gap-8 pb-8 md:pb-0 scrollbar-none snap-x snap-mandatory z-10 relative">
                {hiringProcessSteps.map((step) => (
                  <motion.div
                    key={step.step}
                    whileHover={{ y: -6 }}
                    className="flex-shrink-0 w-[280px] md:w-auto snap-center bg-white border border-slate-100/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center font-mono font-bold text-slate-800 shadow-sm relative z-10 group-hover:border-[#1155CC]/30 group-hover:bg-[#1155CC] group-hover:text-white transition-all duration-300 mb-6">
                        {step.step}
                      </div>

                      <h4 className="text-base font-bold text-slate-900 mb-2 group-hover:text-[#1155CC] transition-colors duration-200">
                        {step.title}
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        {step.desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================
            TALENT POOL INVITATION
            ========================================== */}
        <section
          id="talent-pool"
          className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10"
        >
          <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-blue-950 text-white rounded-3xl p-8 sm:p-14 shadow-xl border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-2xl space-y-5 relative z-10">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#22B6F6] bg-blue-500/20 px-3.5 py-1.5 rounded-full inline-block border border-blue-400/20">
                General Engineering Network
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                Don't See Your Specific Role Open?
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
                Join the TechSonance Talent Pool. We evaluate every submission directly through our
                engineering leadership and actively reach out when initiatives matching your
                technical skills and systems experience launch.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-4">
                <Button
                  onClick={() => setIsTalentPoolOpen(true)}
                  className="bg-[#1155CC] hover:bg-[#0d44a4] text-white font-bold px-8 py-6 rounded-2xl shadow-lg shadow-blue-500/20 text-sm w-full sm:w-auto"
                >
                  Join Talent Pool &rarr;
                </Button>
                <span className="text-xs text-slate-400 font-medium">
                  Takes under 60 seconds • Direct review by technical leads
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================
            CTA SECTION
            ========================================== */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#1155CC] to-[#22B6F6] text-white relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.08]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1.5px, transparent 0)`,
              backgroundSize: "28px 28px",
            }}
          />

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h3 className="text-3xl sm:text-4xl font-medium text-white tracking-tight mb-4">
              Not Ready to Apply Yet?
            </h3>
            <p className="text-sm sm:text-base text-blue-50/90 max-w-xl mx-auto font-medium leading-relaxed mb-8">
              Reach out to learn more about our company services, clients, or schedule a general
              introduction call.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                asChild
                variant="secondary"
                className="w-full sm:w-auto bg-white hover:bg-slate-50 text-[#1155CC] hover:text-[#1155CC] border-transparent hover:border-transparent shadow-md hover:shadow-lg focus:ring-white/20"
              >
                <Link href="/about">About Company</Link>
              </Button>
              <Button
                asChild
                variant="secondary"
                className="w-full sm:w-auto border-white/40 hover:border-white text-white hover:text-white hover:bg-white/10 hover:shadow-lg focus:ring-white/20"
              >
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
      <TalentPoolCaptureModal
        isOpen={isTalentPoolOpen}
        onClose={() => setIsTalentPoolOpen(false)}
      />
    </>
  );
}
