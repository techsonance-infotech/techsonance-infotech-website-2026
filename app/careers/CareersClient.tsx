"use client";

import React, {
  useState,
  useSyncExternalStore,
  useEffect,
  useMemo,
  useCallback,
  startTransition,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X, Sparkles, MapPin, Briefcase, RotateCcw } from "lucide-react";
import { motion } from "motion/react";
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

const subscribeClientTime = () => () => {};
const clientLoadedTimestamp = typeof window !== "undefined" ? Date.now() : 0;
const getClientTime = () => clientLoadedTimestamp;
const getServerTime = () => 0;

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
    startTransition(() => {
      setSearchTerm(searchParams.get("search") || "");
      setSelectedDept(searchParams.get("dept") || searchParams.get("department") || "all");
      setSelectedMode(searchParams.get("mode") || searchParams.get("workMode") || "all");
      setSelectedType(searchParams.get("type") || "all");
      setSelectedExp(searchParams.get("exp") || searchParams.get("experienceLevel") || "all");
      setSelectedSort(searchParams.get("sort") || "newest");
      setVisibleCount(PAGE_SIZE);
    });
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

  const allJobs = useMemo(() => {
    if (!initialJobs || !Array.isArray(initialJobs)) return [];
    return initialJobs.filter((j): j is JobPosting => j !== null && typeof j === "object");
  }, [initialJobs]);

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

  const currentTimestamp = useSyncExternalStore(subscribeClientTime, getClientTime, getServerTime);

  const departments = useMemo(() => {
    const set = new Set<string>();
    allJobs.forEach((j) => {
      if (j?.department && typeof j.department === "string") set.add(j.department);
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
      <main className="min-h-screen overflow-x-hidden bg-[#FAFBFD] font-sans font-medium text-slate-900">
        {/* ==========================================
            HERO SECTION (Geometric Shape Landing - Light Theme)
            ========================================== */}
        <section className="relative flex min-h-[70vh] flex-col justify-center overflow-hidden border-b border-slate-100 bg-white px-4 pt-36 pb-24 sm:px-6 lg:px-8">
          {/* Subtle Ambient Light Gradient */}
          <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-br from-blue-500/[0.03] via-transparent to-[#22B6F6]/[0.03] blur-3xl" />

          {/* Dot Grid Background */}
          <div
            className="pointer-events-none absolute inset-0 z-0 opacity-[0.22]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, #1155CC 1.5px, transparent 0)`,
              backgroundSize: "28px 28px",
            }}
          />

          {/* Floating Glassmorphic Shapes (Light Theme) */}
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
            {isMobile ? (
              <>
                <ElegantShape
                  delay={0.3}
                  width={240}
                  height={60}
                  rotate={12}
                  gradient="from-blue-500/[0.08]"
                  light={true}
                  className="top-[10%] left-[-15%]"
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
                  className="top-[15%] left-[-10%] md:top-[20%] md:left-[-5%]"
                />

                <ElegantShape
                  delay={0.5}
                  width={420}
                  height={110}
                  rotate={-15}
                  gradient="from-cyan-500/[0.08]"
                  light={true}
                  className="top-[60%] right-[-5%] md:top-[65%] md:right-[0%]"
                />

                <ElegantShape
                  delay={0.4}
                  width={280}
                  height={75}
                  rotate={-8}
                  gradient="from-indigo-500/[0.08]"
                  light={true}
                  className="bottom-[5%] left-[5%] md:bottom-[10%] md:left-[10%]"
                />

                <ElegantShape
                  delay={0.6}
                  width={180}
                  height={50}
                  rotate={20}
                  gradient="from-blue-600/[0.08]"
                  light={true}
                  className="top-[10%] right-[15%] md:top-[15%] md:right-[20%]"
                />

                <ElegantShape
                  delay={0.7}
                  width={130}
                  height={35}
                  rotate={-25}
                  gradient="from-cyan-400/[0.08]"
                  light={true}
                  className="top-[5%] left-[20%] md:top-[10%] md:left-[25%]"
                />
              </>
            )}
          </div>

          <div className="relative z-10 mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#1155CC]/15 bg-[#F1F5F9] px-4 py-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#22B6F6]" />
              <span className="text-[10px] font-black tracking-widest text-[#1155CC] uppercase">
                Join Our Tech Mission
              </span>
            </div>

            <h1 className="mb-6 text-4xl leading-tight font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Build Your Engineering Career With <br />
              <span className="text-[#1155CC]">TechSonance InfoTech LLP</span>
            </h1>

            <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed font-medium text-slate-500 sm:text-lg">
              We design and construct production-grade SaaS, AI systems, and cloud architectures.
              Learn, create, and launch products that make an immediate business impact.
            </p>

            <Button asChild variant="default">
              <a href="#positions">View Open Positions</a>
            </Button>
          </div>

          {/* Fade transition to the light section below */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-24 bg-gradient-to-t from-[#FAFBFD] to-transparent" />
        </section>

        {/* ==========================================
            WHY JOIN OUR TEAM
            ========================================== */}
        <section className="relative w-full overflow-hidden border-b border-slate-100 bg-[#f9f9ff] py-20">
          {/* Background Animated Orbits */}
          <div className="pointer-events-none absolute top-[-150px] right-[-150px] z-0 hidden h-[500px] w-[500px] opacity-90 md:block">
            <div className="absolute inset-0 animate-[spin_80s_linear_infinite] rounded-full border-2 border-dashed border-[#0066ff]/40">
              <div className="absolute top-1/2 left-0 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#e7eeff] bg-white shadow-md">
                <Icon
                  name="code"
                  className="h-5 w-5 animate-[spin_10s_linear_infinite] text-[#1155CC]"
                />
              </div>
              <div className="absolute top-1/2 right-0 flex h-9 w-9 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#e7eeff] bg-white shadow-md">
                <Icon name="bolt" className="h-5 w-5 text-cyan-600" />
              </div>
            </div>

            <div className="absolute inset-16 animate-[spin_50s_linear_infinite_reverse] rounded-full border-2 border-[#5d60eb]/30">
              <div className="absolute top-0 left-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#e7eeff] bg-white shadow-md">
                <Icon name="database" className="h-5 w-5 text-violet-600" />
              </div>
            </div>

            <div className="absolute inset-32 flex items-center justify-center rounded-full border border-[#0066ff]/20">
              <svg
                className="h-full w-full text-[#0066ff]/20"
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

          <div className="pointer-events-none absolute bottom-[-120px] left-[-120px] z-0 hidden h-[400px] w-[400px] opacity-90 md:block">
            <div className="absolute inset-0 animate-[spin_60s_linear_infinite_reverse] rounded-full border-2 border-dashed border-[#1155CC]/30">
              <div className="absolute bottom-1/2 left-0 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#e7eeff] bg-white shadow-md">
                <Icon name="arrow" className="h-5 w-5 text-emerald-600" />
              </div>
            </div>

            <div className="absolute inset-16 rounded-full border-2 border-[#0066ff]/20" />

            <div className="absolute inset-[130px] rounded-full bg-gradient-to-br from-[#1155CC] to-[#00ccf9] opacity-20 blur-xl" />
          </div>

          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-16 max-w-3xl text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#1155CC]/10 bg-blue-50/50 px-4.5 py-1">
                <span className="h-1.5 w-1.5 animate-ping rounded-full bg-[#1155CC]" />
                <span className="text-[9px] font-black tracking-wider text-[#1155CC] uppercase">
                  Core Values
                </span>
              </div>
              <h3 className="text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl">
                Why Join Our Team?
              </h3>
              <p className="mx-auto mt-3 max-w-2xl text-xs leading-relaxed font-semibold text-slate-500 sm:text-sm">
                We look for engineers who are passionate about writing clean, robust code,
                architecting smart systems, and building solutions that deliver real-world business
                impact.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
              {cultureValues.map((val, idx) => {
                const theme = cultureColors[idx % cultureColors.length];
                return (
                  <motion.div
                    key={val.title}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className={cn(
                      "relative rounded-3xl border border-slate-100 bg-white p-6 shadow-sm",
                      "group flex flex-col justify-between overflow-hidden transition-all duration-300 hover:shadow-md",
                    )}
                  >
                    <div
                      className={cn(
                        "pointer-events-none absolute -top-10 -right-10 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100",
                        theme.glow,
                      )}
                    />

                    <div className="relative z-10">
                      <div
                        className={cn(
                          "mb-6 flex h-10 w-10 items-center justify-center rounded-full shadow-sm transition-all duration-300 group-hover:scale-110",
                          theme.iconBg,
                        )}
                      >
                        <Icon
                          name={val.icon as IconName}
                          className={cn(
                            "h-5 w-5 transition-transform duration-500 group-hover:rotate-12",
                            theme.text,
                          )}
                        />
                      </div>

                      <h4 className="mb-3 text-base font-bold text-slate-900 transition-colors duration-200 group-hover:text-[#1155CC]">
                        {val.title}
                      </h4>
                      <p className="text-xs leading-relaxed font-medium text-slate-400">
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
        <section className="border-b border-slate-100 bg-white px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <div>
                <h2 className="mb-3 text-xs font-black tracking-widest text-[#1155CC] uppercase">
                  Life at TechSonance
                </h2>
                <h3 className="mb-5 text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl">
                  Engineers Working Together, Scaling Limits.
                </h3>
                <p className="mb-6 text-sm leading-relaxed font-medium text-slate-500 sm:text-base">
                  At TechSonance, we are team-focused and engineering-obsessed. From intense
                  architecture design sprints to lighthearted brainstorming calls, our work is
                  defined by collaboration, respect, and constant technical improvement.
                </p>

                <div className="grid grid-cols-2 gap-6 border-t border-slate-100 pt-4">
                  <div>
                    <span className="block text-2xl font-medium text-[#1155CC]">100%</span>
                    <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                      Engineering Culture
                    </span>
                  </div>
                  <div>
                    <span className="block text-2xl font-medium text-[#1155CC]">Direct</span>
                    <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                      Mentor Relationship
                    </span>
                  </div>
                </div>
              </div>

              {/* Single Team Collaboration Image */}
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-slate-100 shadow-md">
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
          className="relative mx-auto max-w-7xl overflow-hidden border-b border-slate-100 px-4 py-20 sm:px-6 lg:px-8"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-50" />
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
            className="pointer-events-none absolute top-10 left-10 h-72 w-72 rounded-full bg-[#1155CC]/5 blur-3xl"
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
            className="pointer-events-none absolute right-10 bottom-10 h-96 w-96 rounded-full bg-indigo-50/20 blur-3xl"
          />

          <div className="relative z-10 mx-auto mb-10 max-w-3xl text-center">
            <h2 className="mb-3 text-xs font-black tracking-widest text-[#1155CC] uppercase">
              Join Us
            </h2>
            <h3 className="text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl">
              Open Opportunities
            </h3>
            <p className="mt-2 text-sm font-medium text-slate-500 sm:text-base">
              Browse our currently open positions, filter by discipline, and find where you fit.
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div className="relative z-10 mx-auto mb-10 max-w-4xl space-y-4">
            {/* Search Input Box */}
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by title, technology (React, Node, Next.js), department, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pr-12 pl-12 text-sm font-medium text-slate-800 shadow-xs transition-all placeholder:text-slate-400 focus:border-[#1155CC] focus:ring-2 focus:ring-[#1155CC]/20 focus:outline-none"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    updateUrl({ search: "" });
                  }}
                  className="absolute top-1/2 right-4 -translate-y-1/2 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Department Filter Chips */}
            <div className="flex scrollbar-none items-center gap-2 overflow-x-auto pb-1">
              <span className="mr-1 shrink-0 text-xs font-bold tracking-wider text-slate-400 uppercase">
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
                      "shrink-0 cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all",
                      isActive
                        ? "bg-[#1155CC] text-white shadow-xs"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
                    )}
                  >
                    {dept}
                  </button>
                );
              })}
            </div>

            {/* Additional Filter Selects / Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="mr-1 shrink-0 text-xs font-bold tracking-wider text-slate-400 uppercase">
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
                      "shrink-0 cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition-all",
                      isActive
                        ? "bg-slate-800 text-white shadow-xs"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
                    )}
                  >
                    {wm.label}
                  </button>
                );
              })}

              <span className="mx-2 hidden text-slate-200 sm:inline">|</span>

              <span className="mr-1 shrink-0 text-xs font-bold tracking-wider text-slate-400 uppercase">
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
                      "shrink-0 cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition-all",
                      isActive
                        ? "bg-slate-800 text-white shadow-xs"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
                    )}
                  >
                    {jt.label}
                  </button>
                );
              })}

              <span className="mx-2 hidden text-slate-200 sm:inline">|</span>

              <span className="mr-1 shrink-0 text-xs font-bold tracking-wider text-slate-400 uppercase">
                Sort:
              </span>
              <select
                value={selectedSort}
                onChange={(e) => {
                  setSelectedSort(e.target.value);
                  updateUrl({ sort: e.target.value });
                }}
                className="cursor-pointer rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 focus:ring-1 focus:ring-blue-500 focus:outline-none"
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
                  className="ml-auto inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset filters
                </button>
              )}
            </div>
          </div>

          {/* Job Listings / Empty State */}
          <div className="relative z-10 mx-auto max-w-4xl space-y-6">
            {displayedJobs.length > 0 ? (
              <>
                {displayedJobs.map((job, idx) => {
                  const pubTime = job.publishedAt ? new Date(job.publishedAt).getTime() : NaN;
                  const closeTime = job.closesAt ? new Date(job.closesAt).getTime() : NaN;
                  const isNew = Boolean(
                    Number.isFinite(pubTime) &&
                    currentTimestamp - pubTime <= 14 * 24 * 60 * 60 * 1000,
                  );
                  const isClosingSoon = Boolean(
                    Number.isFinite(closeTime) &&
                    closeTime > currentTimestamp &&
                    closeTime - currentTimestamp <= 7 * 24 * 60 * 60 * 1000,
                  );

                  return (
                    <div
                      key={job.id || job.slug || String(idx)}
                      className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-xs transition-all duration-300 hover:shadow-md sm:p-8"
                    >
                      <div className="flex flex-col items-start justify-between gap-4 border-b border-slate-100 pb-6 sm:flex-row">
                        <div>
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className="inline-block rounded-full border border-blue-100/50 bg-blue-50 px-3 py-1 text-[10px] font-black tracking-wider text-[#1155CC] uppercase">
                              {job.department || "General"} • Active Opening
                            </span>
                            {isNew && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black tracking-wider text-emerald-700 uppercase">
                                ✨ New
                              </span>
                            )}
                            {isClosingSoon && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-black tracking-wider text-amber-700 uppercase">
                                ⏰ Closing Soon
                              </span>
                            )}
                            {job.workMode && (
                              <span className="inline-block rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold tracking-wider text-slate-600 uppercase">
                                {job.workMode}
                              </span>
                            )}
                          </div>
                          <Link
                            href={`/careers/${job.slug || "job"}`}
                            className="block text-2xl font-medium tracking-tight text-slate-900 transition-colors hover:text-[#1155CC] sm:text-3xl"
                          >
                            {job.title || "Untitled Position"}
                          </Link>
                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-500">
                            <span className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                              {job.location || "Remote, India"}
                            </span>
                            <span className="text-slate-200">•</span>
                            <span className="flex items-center gap-1.5">
                              <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                              {job.type || "Full Time"}
                            </span>
                            {job.experienceLevel && (
                              <>
                                <span className="text-slate-200">•</span>
                                <span className="text-[#1155CC]">Level: {job.experienceLevel}</span>
                              </>
                            )}
                            {job.showSalaryPublicly &&
                              typeof job.salaryMin === "number" &&
                              Number.isFinite(job.salaryMin) && (
                                <>
                                  <span className="text-slate-200">•</span>
                                  <span className="font-bold text-emerald-600">
                                    {job.salaryCurrency || "INR"}{" "}
                                    {job.salaryMin.toLocaleString("en-IN")}
                                    {typeof job.salaryMax === "number" &&
                                    Number.isFinite(job.salaryMax)
                                      ? ` - ${job.salaryMax.toLocaleString("en-IN")}`
                                      : ""}{" "}
                                    / {job.salaryPeriod || "month"}
                                  </span>
                                </>
                              )}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2 self-stretch sm:self-auto">
                          <Button asChild variant="outline" size="sm" className="rounded-xl">
                            <Link href={`/careers/${job.slug || "job"}`}>View Details</Link>
                          </Button>
                          <Button asChild variant="default" size="sm" className="rounded-xl">
                            <Link href={`/careers/${job.slug || "job"}?apply=true`}>Apply Now</Link>
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-4 pt-6">
                        <p className="line-clamp-3 text-xs leading-relaxed font-medium text-slate-600 sm:text-sm">
                          {job.summary || job.description || "No description provided."}
                        </p>

                        {Array.isArray(job.skills) && job.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-2">
                            {job.skills
                              .filter(
                                (s): s is string => typeof s === "string" && s.trim().length > 0,
                              )
                              .slice(0, 7)
                              .map((skill) => (
                                <span
                                  key={skill}
                                  className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-600"
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
                      className="rounded-2xl border-slate-300 px-8 font-bold shadow-xs hover:border-[#1155CC] hover:text-[#1155CC]"
                    >
                      Load More Positions ({filteredJobs.length - visibleCount} remaining)
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="mx-auto max-w-2xl space-y-5 rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center sm:p-14">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-[#1155CC]">
                  <Search className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-bold text-slate-900 sm:text-2xl">
                    No roles found matching your criteria
                  </h4>
                  <p className="mx-auto max-w-md text-sm leading-relaxed text-slate-500">
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
                    className="flex items-center gap-2 rounded-xl bg-[#1155CC] px-5 text-white hover:bg-[#0d44a4]"
                  >
                    <Sparkles className="h-4 w-4" />
                    Join our Talent Pool
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Talent Pool CTA card */}
          <div className="relative z-10 mx-auto mt-12 flex max-w-4xl flex-col items-center justify-between gap-6 rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 sm:flex-row sm:p-8">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="flex items-center justify-center gap-2 text-lg font-bold text-slate-900 sm:justify-start">
                <Sparkles className="h-5 w-5 text-[#1155CC]" />
                Don't see your specific role?
              </h4>
              <p className="max-w-lg text-xs text-slate-600 sm:text-sm">
                We're constantly expanding. Join our Talent Pool and our engineering recruitment
                team will reach out directly when matching roles open up.
              </p>
            </div>
            <Button
              onClick={() => setIsTalentPoolOpen(true)}
              className="shrink-0 rounded-xl bg-[#1155CC] px-6 text-white hover:bg-[#0d44a4]"
            >
              Join Talent Pool
            </Button>
          </div>
        </section>

        {/* ==========================================
            HIRING PROCESS
            ========================================== */}
        <section className="relative overflow-hidden border-b border-slate-100 bg-[#f9f9ff] px-4 py-20 sm:px-6 lg:px-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#e1e8f5_1px,transparent_1px)] [background-size:20px_20px] opacity-40" />

          <div className="relative z-10 mx-auto max-w-7xl">
            <div className="mx-auto mb-16 max-w-3xl text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#1155CC]/10 bg-[#1155CC]/5 px-4 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#1155CC]" />
                <span className="text-[9px] font-black tracking-wider text-[#1155CC] uppercase">
                  Hiring Path
                </span>
              </div>
              <h3 className="text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl">
                Our Hiring Process
              </h3>
              <p className="mx-auto mt-2 max-w-xl text-xs leading-relaxed font-semibold text-slate-500 sm:text-sm">
                We believe in a transparent, fast-paced assessment cycle designed to value your
                engineering and problem-solving abilities.
              </p>
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute top-12 right-10 left-10 z-0 hidden h-0.5 border-t-2 border-dashed border-slate-200/80 md:block" />

              <div className="relative z-10 flex snap-x snap-mandatory scrollbar-none gap-8 overflow-x-auto pb-8 md:grid md:grid-cols-4 md:pb-0">
                {hiringProcessSteps.map((step) => (
                  <motion.div
                    key={step.step}
                    whileHover={{ y: -6 }}
                    className="group flex w-[280px] flex-shrink-0 snap-center flex-col justify-between rounded-3xl border border-slate-100/80 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md md:w-auto"
                  >
                    <div>
                      <div className="relative z-10 mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-slate-100 bg-slate-50 font-mono font-bold text-slate-800 shadow-sm transition-all duration-300 group-hover:border-[#1155CC]/30 group-hover:bg-[#1155CC] group-hover:text-white">
                        {step.step}
                      </div>

                      <h4 className="mb-2 text-base font-bold text-slate-900 transition-colors duration-200 group-hover:text-[#1155CC]">
                        {step.title}
                      </h4>
                      <p className="text-xs leading-relaxed font-medium text-slate-500">
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
          className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
        >
          <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-linear-to-br from-slate-900 via-slate-800 to-blue-950 p-8 text-white shadow-xl sm:p-14">
            <div className="pointer-events-none absolute top-0 right-0 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative z-10 max-w-2xl space-y-5">
              <span className="inline-block rounded-full border border-blue-400/20 bg-blue-500/20 px-3.5 py-1.5 text-[10px] font-black tracking-widest text-[#22B6F6] uppercase">
                General Engineering Network
              </span>
              <h2 className="text-3xl leading-tight font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                Don't See Your Specific Role Open?
              </h2>
              <p className="text-sm leading-relaxed font-normal text-slate-300 sm:text-base">
                Join the TechSonance Talent Pool. We evaluate every submission directly through our
                engineering leadership and actively reach out when initiatives matching your
                technical skills and systems experience launch.
              </p>

              <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center">
                <Button
                  onClick={() => setIsTalentPoolOpen(true)}
                  className="w-full rounded-2xl bg-[#1155CC] px-8 py-6 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-[#0d44a4] sm:w-auto"
                >
                  Join Talent Pool &rarr;
                </Button>
                <span className="text-xs font-medium text-slate-400">
                  Takes under 60 seconds • Direct review by technical leads
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================
            CTA SECTION
            ========================================== */}
        <section className="relative overflow-hidden bg-gradient-to-r from-[#1155CC] to-[#22B6F6] px-4 py-20 text-white sm:px-6 lg:px-8">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1.5px, transparent 0)`,
              backgroundSize: "28px 28px",
            }}
          />

          <div className="relative z-10 mx-auto max-w-4xl text-center">
            <h3 className="mb-4 text-3xl font-medium tracking-tight text-white sm:text-4xl">
              Not Ready to Apply Yet?
            </h3>
            <p className="mx-auto mb-8 max-w-xl text-sm leading-relaxed font-medium text-blue-50/90 sm:text-base">
              Reach out to learn more about our company services, clients, or schedule a general
              introduction call.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                asChild
                variant="secondary"
                className="w-full border-transparent bg-white font-bold text-[#1155CC] shadow-md hover:border-transparent hover:bg-slate-50 hover:text-[#1155CC] hover:shadow-lg focus:ring-white/20 sm:w-auto"
              >
                <Link href="/about">About Company</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full border-2 border-white/70 bg-white/10 font-bold text-white backdrop-blur-xs hover:border-white hover:bg-white hover:text-[#1155CC] hover:shadow-lg focus:ring-white/20 sm:w-auto"
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
