"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import SiteHeader from "@/app/components/home/SiteHeader";
import SiteFooter from "@/app/components/home/SiteFooter";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ClosedJobBanner } from "@/components/careers/ClosedJobBanner";
import type { JobPosting } from "@/lib/content/types";
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";
import { submitCareerApplication } from "@/lib/api/careers.api";
import {
  MapPin,
  Briefcase,
  Clock,
  Banknote,
  Calendar,
  Share2,
  Check,
  Copy,
  Mail,
  ArrowLeft,
  Users,
  Award,
  Sparkles,
  ShieldCheck,
  Send,
  Upload,
  ExternalLink,
} from "lucide-react";

interface JobDetailClientProps {
  job: JobPosting;
  similarJobs?: JobPosting[];
}

const DEFAULT_HIRING_STEPS = [
  {
    step: "01",
    title: "Application Review",
    desc: "Our recruiting and engineering leads review your experience, portfolio, and past shipped systems.",
  },
  {
    step: "02",
    title: "Technical Discovery",
    desc: "A hands-on discussion and coding evaluation covering real-world architecture and engineering decisions.",
  },
  {
    step: "03",
    title: "Team & Culture Fit",
    desc: "A virtual 1-on-1 session with peers and leadership to discuss goals, ownership, and engineering practices.",
  },
  {
    step: "04",
    title: "Offer & Onboarding",
    desc: "Formal offer package, equipment provisioning, and personalized onboarding roadmap.",
  },
];

const DEFAULT_EEOC_STATEMENT =
  "TechSonance Infotech LLP is committed to diversity, equity, and inclusion. We provide equal employment opportunities to all applicants and employees regardless of race, color, religion, sex, sexual orientation, gender identity, national origin, age, veteran status, or disability status. We evaluate every candidate on merit, technical capability, and collaborative drive.";

interface ApplicationFormValues {
  fullName: string;
  email: string;
  phone?: string;
  currentLocation?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  noticePeriodWeeks: number;
  coverLetter?: string;
  privacyConsent: boolean;
  talentPoolConsent: boolean;
  website_url?: string;
}

export default function JobDetailClient({ job, similarJobs = [] }: JobDetailClientProps) {
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");
  const [formStatus, setFormStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [formError, setFormError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ApplicationFormValues>({
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      currentLocation: "",
      portfolioUrl: "",
      githubUrl: "",
      linkedinUrl: "",
      noticePeriodWeeks: 0,
      coverLetter: "",
      privacyConsent: false,
      talentPoolConsent: true,
      website_url: "",
    },
  });

  const [submittedCandidate, setSubmittedCandidate] = useState<{
    name: string;
    email: string;
  } | null>(null);
  const [screeningAnswers, setScreeningAnswers] = useState<Record<string, string | boolean>>({});
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");

  const isClosed = job.status === "CLOSED";
  const isPaused = job.status === "PAUSED";
  const canApply = !isClosed && !isPaused;

  // Prevent background scroll and pause Lenis while dialog is open
  useEffect(() => {
    if (isApplyOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      if (typeof window !== "undefined" && (window as Window)?.__lenis) {
        (window as Window)?.__lenis?.stop();
      }
      return () => {
        document.body.style.overflow = originalOverflow;
        if (typeof window !== "undefined" && (window as Window)?.__lenis) {
          (window as Window)?.__lenis?.start();
        }
      };
    }
  }, [isApplyOpen]);

  // Read the URL on the client only (avoids SSR/hydration issues)
  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  const handleCopyLink = async () => {
    try {
      if (typeof window !== "undefined" && navigator?.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // Ignore clipboard write failures
    }
  };

  const handleDialogChange = (open: boolean) => {
    setIsApplyOpen(open);
    // Reset the success screen so reopening the dialog shows a fresh form
    if (!open && formStatus === "success") {
      setFormStatus("idle");
      setSubmittedCandidate(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError("");
    const file = e.target.files?.[0];
    if (!file) {
      setResumeFile(null);
      return;
    }

    const name = file.name.toLowerCase();
    const isAllowedExt = name.endsWith(".pdf") || name.endsWith(".docx") || name.endsWith(".doc");

    if (!isAllowedExt) {
      setFileError("Invalid format. Please upload a PDF or Word (.doc/.docx) document.");
      setResumeFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFileError("File too large. Maximum allowed resume size is 5MB.");
      setResumeFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setResumeFile(file);
  };

  const onFormSubmit = async (values: ApplicationFormValues) => {
    if (job.resumeRequired !== false && !resumeFile) {
      setFileError("Please attach your resume (PDF or DOCX).");
      return;
    }

    if (
      job.coverLetterRequirement === "REQUIRED" &&
      (!values.coverLetter || !values.coverLetter.trim())
    ) {
      setFormError("A cover letter is required for this role.");
      return;
    }

    // Validate required screening questions
    if (job.screeningQuestions && Array.isArray(job.screeningQuestions)) {
      for (const sq of job.screeningQuestions) {
        if (sq.required) {
          const val = screeningAnswers[sq.id];
          if (val === undefined || val === "") {
            setFormError(`Please answer the screening question: "${sq.question}"`);
            return;
          }
        }
      }
    }

    setFormStatus("loading");
    setFormError("");

    try {
      const screeningPayload =
        job.screeningQuestions && Array.isArray(job.screeningQuestions)
          ? job.screeningQuestions.map((q) => ({
              questionId: q.id,
              question: q.question,
              answer: screeningAnswers[q.id] ?? "",
            }))
          : undefined;

      await submitCareerApplication({
        jobId: job.id || job.slug,
        candidateName: values.fullName,
        email: values.email,
        phone: values.phone,
        currentLocation: values.currentLocation,
        portfolioUrl: values.portfolioUrl,
        githubUrl: values.githubUrl,
        linkedinUrl: values.linkedinUrl,
        coverLetter: values.coverLetter,
        noticePeriodWeeks: values.noticePeriodWeeks,
        privacyConsent: values.privacyConsent,
        talentPoolConsent: values.talentPoolConsent,
        source: "careers_page",
        screeningAnswers: screeningPayload,
        resumeFile,
        website_url: values.website_url,
      });

      setSubmittedCandidate({ name: values.fullName, email: values.email });
      setFormStatus("success");
      setResumeFile(null);
      setScreeningAnswers({});
      if (fileInputRef.current) fileInputRef.current.value = "";
      reset();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setFormError(message);
      setFormStatus("error");
    }
  };

  const formatSalary = () => {
    if (!job.showSalaryPublicly) return null;
    const { salaryMin, salaryMax, salaryCurrency = "INR", salaryPeriod = "year" } = job;
    if (salaryMin === undefined && salaryMax === undefined) return null;

    const formatter = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: salaryCurrency,
      maximumFractionDigits: 0,
    });

    const periodLabel =
      salaryPeriod.toLowerCase() === "month"
        ? "/ mo"
        : salaryPeriod.toLowerCase() === "hour"
          ? "/ hr"
          : "/ yr";

    if (salaryMin !== undefined && salaryMax !== undefined) {
      return `${formatter.format(salaryMin)} – ${formatter.format(salaryMax)} ${periodLabel}`;
    }
    if (salaryMin !== undefined) {
      return `From ${formatter.format(salaryMin)} ${periodLabel}`;
    }
    if (salaryMax !== undefined) {
      return `Up to ${formatter.format(salaryMax)} ${periodLabel}`;
    }
    return null;
  };

  const formattedSalary = formatSalary();

  const hiringSteps =
    job.hiringProcess && job.hiringProcess.length > 0 ? job.hiringProcess : DEFAULT_HIRING_STEPS;

  const eeocStatement = job.equalOpportunityStatement || DEFAULT_EEOC_STATEMENT;

  return (
    <>
      <SiteHeader transparent={true} />
      <main className="bg-[#FAFBFD] min-h-screen font-sans text-slate-900 overflow-x-hidden pt-28 pb-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back link */}
          <div className="mb-6">
            <Link
              href="/careers"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#1155CC] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to all open positions</span>
            </Link>
          </div>

          {/* Closed / Paused State Banner */}
          {(isClosed || isPaused) && (
            <ClosedJobBanner status={job.status} similarJobs={similarJobs} />
          )}

          {/* Role Header Card */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden mb-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/[0.04] rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-slate-100 relative z-10">
              <div className="space-y-3 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black tracking-wider uppercase px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[#1155CC]">
                    {job.department}
                  </span>
                  {job.experienceLevel && (
                    <span className="text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full bg-slate-100 text-slate-600">
                      Level: {job.experienceLevel}
                    </span>
                  )}
                  {job.referenceCode && (
                    <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-slate-50 text-slate-400 border border-slate-200/60">
                      Ref: {job.referenceCode}
                    </span>
                  )}
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  {job.title}
                </h1>

                {job.summary && (
                  <p className="text-base text-slate-600 leading-relaxed font-medium">
                    {job.summary}
                  </p>
                )}
              </div>

              {canApply && (
                <div className="flex sm:flex-col gap-3 shrink-0">
                  {job.applicationMethod === "external" && job.externalApplyUrl ? (
                    <Button
                      asChild
                      size="lg"
                      className="w-full sm:w-auto font-bold shadow-md shadow-blue-500/10"
                    >
                      <a href={job.externalApplyUrl} target="_blank" rel="noopener noreferrer">
                        <span>Apply Externally</span>
                        <ExternalLink className="w-4 h-4 ml-1.5" />
                      </a>
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      onClick={() => setIsApplyOpen(true)}
                      className="w-full sm:w-auto font-bold shadow-md shadow-blue-500/10"
                    >
                      <span>Apply for this Role</span>
                      <Send className="w-4 h-4 ml-1.5" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 pt-6 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1155CC] shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Location
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-slate-800">
                    {job.location}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Work Mode / Type
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-slate-800">
                    {job.workMode ? `${job.workMode} • ${job.type}` : job.type}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Compensation
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-slate-800">
                    {formattedSalary || "Competitive / Undisclosed"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Application Deadline
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-slate-800">
                    {job.closesAt
                      ? new Date(job.closesAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Rolling Basis"}
                  </div>
                </div>
              </div>
            </div>

            {/* Social Share Strip */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Share this opening with colleagues:</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  aria-label="Copy job link"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy link</span>
                    </>
                  )}
                </button>

                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                    currentUrl,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-[#0A66C2] hover:border-[#0A66C2]/30 transition-colors"
                  aria-label="Share on LinkedIn"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>

                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    `Check out this role: ${job.title} at TechSonance Infotech`,
                  )}&url=${encodeURIComponent(currentUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-black hover:border-black/30 transition-colors"
                  aria-label="Share on X / Twitter"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>

                <a
                  href={`mailto:?subject=${encodeURIComponent(
                    `Job Opening: ${job.title} at TechSonance`,
                  )}&body=${encodeURIComponent(
                    `Hey, thought you might be interested in this opening:\n\n${job.title}\n${currentUrl}`,
                  )}`}
                  className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-200 transition-colors"
                  aria-label="Share via Email"
                >
                  <Mail className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Main Content Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-8 space-y-12">
              {/* 1. About the Role */}
              <section className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 font-mono mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#1155CC]" />
                  <span>{"// About the Role"}</span>
                </h2>
                <div className="text-slate-700 leading-relaxed font-normal whitespace-pre-line text-sm sm:text-base">
                  {job.description}
                </div>
              </section>

              {/* 2. Key Responsibilities */}
              {job.responsibilities && job.responsibilities.length > 0 && (
                <section className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 font-mono mb-6 flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#1155CC]" />
                    <span>{"// Key Responsibilities"}</span>
                  </h2>
                  <ul className="space-y-4">
                    {job.responsibilities.map((resp, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3.5 text-sm sm:text-base text-slate-700"
                      >
                        <span className="w-5 h-5 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1155CC] shrink-0 mt-0.5 text-xs font-bold">
                          ✓
                        </span>
                        <span className="leading-snug">{resp}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* 3. Requirements & Qualifications */}
              {job.requirements && job.requirements.length > 0 && (
                <section className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 font-mono mb-6 flex items-center gap-2">
                    <Award className="w-4 h-4 text-indigo-600" />
                    <span>{"// Requirements & Qualifications"}</span>
                  </h2>
                  <ul className="space-y-4">
                    {job.requirements.map((req, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3.5 text-sm sm:text-base text-slate-700"
                      >
                        <span className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5 text-xs font-bold">
                          ✓
                        </span>
                        <span className="leading-snug">{req}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* 4. Preferred Qualifications */}
              {job.preferredQualifications && job.preferredQualifications.length > 0 && (
                <section className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 font-mono mb-6 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-600" />
                    <span>{"// Preferred Qualifications (Bonus Points)"}</span>
                  </h2>
                  <ul className="space-y-4">
                    {job.preferredQualifications.map((pref, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3.5 text-sm sm:text-base text-slate-700"
                      >
                        <span className="w-5 h-5 rounded-full bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 shrink-0 mt-0.5 text-xs font-bold">
                          +
                        </span>
                        <span className="leading-snug">{pref}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* 5. Benefits & Perks */}
              {job.benefits && job.benefits.length > 0 && (
                <section className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 font-mono mb-6 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>{"// Benefits & Perks"}</span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {job.benefits.map((benefit, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3"
                      >
                        <span className="w-6 h-6 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 text-xs font-bold">
                          ★
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
                          {benefit}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* 6. About the Team */}
              <section className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 font-mono mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>{"// About the Team"}</span>
                </h2>
                <p className="text-slate-700 leading-relaxed font-normal text-sm sm:text-base">
                  {job.aboutTeam ||
                    "You will work alongside senior software engineers, system architects, and technical product managers who are passionate about engineering craftsmanship. We believe in autonomous squads, fast feedback loops, continuous learning, and zero micro-management."}
                </p>
              </section>

              {/* 7. Hiring Process Steps */}
              <section className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 font-mono mb-8 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#1155CC]" />
                  <span>{"// Hiring Process Steps"}</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {hiringSteps.map((step) => (
                    <div
                      key={step.step}
                      className="p-5 rounded-2xl bg-[#FAFBFD] border border-slate-100 space-y-2 relative"
                    >
                      <div className="text-xs font-black font-mono text-[#1155CC] tracking-wider">
                        STEP {step.step}
                      </div>
                      <h3 className="text-base font-bold text-slate-900">{step.title}</h3>
                      {step.desc && (
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                          {step.desc}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* 8. Equal Opportunity Statement */}
              <section className="bg-slate-100/60 border border-slate-200/60 rounded-3xl p-6 sm:p-8">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 font-mono mb-3">
                  {"// Equal Opportunity Employer"}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  {eeocStatement}
                </p>
              </section>
            </div>

            {/* Sidebar Sticky Panel */}
            <aside
              aria-label="Role overview and application sidebar"
              className="lg:col-span-4 space-y-6 lg:sticky lg:top-28"
            >
              {/* Quick Info Box */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-4">
                  Position Snapshot
                </h3>

                <div className="space-y-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold block mb-0.5">Role Title</span>
                    <span className="font-bold text-slate-800 text-sm">{job.title}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block mb-0.5">Department</span>
                    <span className="font-bold text-slate-800">{job.department}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block mb-0.5">Location</span>
                    <span className="font-bold text-slate-800">{job.location}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block mb-0.5">
                      Work Arrangement
                    </span>
                    <span className="font-bold text-slate-800">{job.workMode || "Hybrid"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block mb-0.5">
                      Employment Type
                    </span>
                    <span className="font-bold text-slate-800">{job.type}</span>
                  </div>
                  {job.skills && job.skills.length > 0 && (
                    <div>
                      <span className="text-slate-400 font-semibold block mb-2">
                        Key Competencies
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {job.skills.map((skill) => (
                          <span
                            key={skill}
                            className="px-2.5 py-1 rounded-lg bg-blue-50/70 text-[#1155CC] text-[11px] font-semibold border border-blue-100/50"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {canApply ? (
                  <div className="pt-4 border-t border-slate-100">
                    {job.applicationMethod === "external" && job.externalApplyUrl ? (
                      <Button
                        asChild
                        size="lg"
                        className="w-full font-bold shadow-md shadow-blue-500/10"
                      >
                        <a href={job.externalApplyUrl} target="_blank" rel="noopener noreferrer">
                          <span>Apply Externally</span>
                          <ExternalLink className="w-4 h-4 ml-1.5" />
                        </a>
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        onClick={() => setIsApplyOpen(true)}
                        className="w-full font-bold shadow-md shadow-blue-500/10"
                      >
                        <span>Apply for this Position</span>
                        <Send className="w-4 h-4 ml-1.5" />
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="pt-4 border-t border-slate-100 text-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Applications Inactive
                    </span>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>

        {/* Sticky Mobile Apply Bar */}
        {canApply && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 py-3 shadow-lg">
            <div className="flex items-center justify-between gap-4 max-w-md mx-auto">
              <div className="truncate">
                <div className="text-xs font-bold text-slate-900 truncate">{job.title}</div>
                <div className="text-[11px] text-slate-500 truncate">
                  {job.location} • {job.type}
                </div>
              </div>
              {job.applicationMethod === "external" && job.externalApplyUrl ? (
                <Button asChild size="sm" className="font-bold shrink-0">
                  <a href={job.externalApplyUrl} target="_blank" rel="noopener noreferrer">
                    <span>Apply</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </a>
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setIsApplyOpen(true)}
                  className="font-bold shrink-0"
                >
                  <span>Apply Now</span>
                  <Send className="w-3.5 h-3.5 ml-1" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Apply Dialog Modal */}
        <Dialog open={isApplyOpen} onOpenChange={handleDialogChange}>
          <DialogContent
            data-lenis-prevent="true"
            className="sm:max-w-2xl max-h-[90vh] p-0 flex flex-col overflow-hidden overscroll-contain bg-white rounded-3xl border border-slate-200/90 shadow-2xl"
          >
            {/* Sticky Modal Header */}
            <div className="p-6 pb-4 border-b border-slate-100 shrink-0 bg-white">
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1155CC]">
                    {job.department}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {job.workMode || job.location}
                  </span>
                </div>
                <DialogTitle className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-sora">
                  Apply for {job.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Submit your details and resume below. Direct review by engineering leads.
                </DialogDescription>
              </DialogHeader>
            </div>

            {formStatus === "success" ? (
              <div
                data-lenis-prevent="true"
                className="py-10 px-6 text-center space-y-4 overflow-y-auto overscroll-contain flex-1"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl font-black shadow-sm">
                  ✓
                </div>
                <h4 className="text-2xl font-black text-slate-900 tracking-tight font-sora">
                  Application Submitted!
                </h4>
                <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Thank you, <strong>{submittedCandidate?.name}</strong>. We have received your
                  application for <strong>{job.title}</strong> and sent a confirmation to{" "}
                  <span className="font-semibold text-slate-900">{submittedCandidate?.email}</span>.
                </p>

                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 max-w-md mx-auto text-left space-y-2 mt-4 text-xs text-slate-600">
                  <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                    What happens next:
                  </div>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Our hiring team reviews your resume and project links.</li>
                    <li>If aligned, our recruiter will reach out within 3 business days.</li>
                    <li>
                      For questions or data requests, contact{" "}
                      <span className="font-medium text-[#1155CC]">careers@techsonance.co.in</span>.
                    </li>
                  </ul>
                </div>

                <div className="pt-4 flex items-center justify-center gap-3">
                  <Button variant="outline" onClick={() => handleDialogChange(false)}>
                    Close
                  </Button>
                  <Button
                    asChild
                    variant="default"
                    className="bg-[#1155CC] hover:bg-[#0d44a4] text-white"
                  >
                    <Link href="/careers">Explore Other Roles</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit(onFormSubmit)}
                className="flex flex-col flex-1 overflow-hidden"
              >
                {/* Scrollable Form Body */}
                <div
                  data-lenis-prevent="true"
                  className="overflow-y-auto overscroll-contain p-6 space-y-4 flex-1 focus:outline-none"
                >
                  {/* Honeypot field for bot defeat */}
                  <input
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    className="hidden"
                    {...register("website_url")}
                  />

                  {formError && (
                    <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2">
                      <span className="font-bold shrink-0">⚠️</span>
                      <span>{formError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Maya Sharma"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      {...register("fullName", { required: "Full name is required" })}
                    />
                    {errors.fullName && (
                      <p className="text-xs text-rose-500 font-semibold mt-1">
                        {errors.fullName.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="maya@example.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        {...register("email", {
                          required: "Email address is required",
                          pattern: {
                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: "Invalid email format",
                          },
                        })}
                      />
                      {errors.email && (
                        <p className="text-xs text-rose-500 font-semibold mt-1">
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        {...register("phone")}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Current Location
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Bengaluru, India"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        {...register("currentLocation")}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Notice Period / Availability
                      </label>
                      <select
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        {...register("noticePeriodWeeks", {
                          valueAsNumber: true,
                        })}
                      >
                        <option value={0}>Immediate availability</option>
                        <option value={2}>2 weeks</option>
                        <option value={4}>1 month (4 weeks)</option>
                        <option value={8}>2 months (8 weeks)</option>
                        <option value={12}>3 months (12 weeks)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                        LinkedIn
                      </label>
                      <input
                        type="url"
                        placeholder="https://linkedin.com/in/..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        {...register("linkedinUrl")}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                        GitHub
                      </label>
                      <input
                        type="url"
                        placeholder="https://github.com/..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        {...register("githubUrl")}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Portfolio
                      </label>
                      <input
                        type="url"
                        placeholder="https://portfolio.dev"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        {...register("portfolioUrl")}
                      />
                    </div>
                  </div>

                  {/* Resume Upload */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Resume / CV (PDF or DOCX, max 5MB){" "}
                      {job.resumeRequired !== false && <span className="text-rose-500">*</span>}
                    </label>
                    <div className="mt-1 flex items-center justify-center px-4 py-4 border-2 border-dashed border-slate-200 rounded-2xl hover:border-blue-400 transition-colors bg-slate-50/50">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                        onChange={handleFileChange}
                        className="hidden"
                        id="resume-upload-modal"
                      />
                      <label
                        htmlFor="resume-upload-modal"
                        className="cursor-pointer flex flex-col items-center gap-1.5 text-center w-full"
                      >
                        <Upload className="w-5 h-5 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-700">
                          {resumeFile ? resumeFile.name : "Click to select a resume file"}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          PDF or Word (.docx) up to 5MB • Validated before upload
                        </span>
                      </label>
                    </div>
                    {fileError && (
                      <p className="text-xs text-rose-600 font-semibold mt-1.5">{fileError}</p>
                    )}
                  </div>

                  {/* Cover Letter */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Cover Letter / Notes{" "}
                      {job.coverLetterRequirement === "REQUIRED" && (
                        <span className="text-rose-500">*</span>
                      )}
                      {job.coverLetterRequirement === "OPTIONAL" && (
                        <span className="text-slate-400 font-normal lowercase">(optional)</span>
                      )}
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Tell us what excites you about this role and why you're a great fit..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      {...register("coverLetter")}
                    />
                  </div>

                  {/* Screening Questions (if role specifies any) */}
                  {job.screeningQuestions &&
                    Array.isArray(job.screeningQuestions) &&
                    job.screeningQuestions.length > 0 && (
                      <div className="space-y-3 pt-2 border-t border-slate-100">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                          Role Screening Questions
                        </h5>
                        {job.screeningQuestions.map((sq, index) => (
                          <div key={sq.id || index} className="space-y-1.5">
                            <label className="block text-xs font-semibold text-slate-800">
                              {sq.question}{" "}
                              {sq.required && <span className="text-rose-500">*</span>}
                            </label>
                            {sq.type === "boolean" ? (
                              <div className="flex items-center gap-4 text-xs font-medium text-slate-700">
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`sq-${sq.id}`}
                                    checked={screeningAnswers[sq.id] === true}
                                    onChange={() =>
                                      setScreeningAnswers({
                                        ...screeningAnswers,
                                        [sq.id]: true,
                                      })
                                    }
                                  />
                                  <span>Yes</span>
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`sq-${sq.id}`}
                                    checked={screeningAnswers[sq.id] === false}
                                    onChange={() =>
                                      setScreeningAnswers({
                                        ...screeningAnswers,
                                        [sq.id]: false,
                                      })
                                    }
                                  />
                                  <span>No</span>
                                </label>
                              </div>
                            ) : sq.type === "choice" && sq.options && sq.options.length > 0 ? (
                              <select
                                value={String(screeningAnswers[sq.id] || "")}
                                onChange={(e) =>
                                  setScreeningAnswers({
                                    ...screeningAnswers,
                                    [sq.id]: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              >
                                <option value="">Select an option...</option>
                                {sq.options.map((opt: string) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            ) : sq.type === "long_text" ? (
                              <textarea
                                rows={2}
                                value={String(screeningAnswers[sq.id] || "")}
                                onChange={(e) =>
                                  setScreeningAnswers({
                                    ...screeningAnswers,
                                    [sq.id]: e.target.value,
                                  })
                                }
                                placeholder="Your answer..."
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              />
                            ) : (
                              <input
                                type="text"
                                value={String(screeningAnswers[sq.id] || "")}
                                onChange={(e) =>
                                  setScreeningAnswers({
                                    ...screeningAnswers,
                                    [sq.id]: e.target.value,
                                  })
                                }
                                placeholder="Your answer..."
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                  {/* Consent Checkboxes */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        required
                        className="mt-0.5 rounded border-slate-300 text-[#1155CC] focus:ring-[#1155CC]"
                        {...register("privacyConsent", {
                          required: "You must accept the privacy policy",
                        })}
                      />
                      <span>
                        I have read and agree to the{" "}
                        <Link
                          href="/privacy-policy"
                          target="_blank"
                          className="text-[#1155CC] underline font-semibold"
                        >
                          Privacy Policy
                        </Link>{" "}
                        and consent to the processing of my application data.{" "}
                        <span className="text-rose-500 font-bold">*</span>
                      </span>
                    </label>
                    {errors.privacyConsent && (
                      <p className="text-xs text-rose-500 font-semibold">
                        {errors.privacyConsent.message}
                      </p>
                    )}

                    <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        className="mt-0.5 rounded border-slate-300 text-[#1155CC] focus:ring-[#1155CC]"
                        {...register("talentPoolConsent")}
                      />
                      <span>
                        Keep my profile and resume in the TechSonance Talent Pool for future roles
                        matching my skills.
                      </span>
                    </label>
                  </div>
                </div>

                {/* Sticky Action Footer */}
                <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/90 backdrop-blur-xs flex items-center justify-end gap-3 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleDialogChange(false)}
                    disabled={formStatus === "loading"}
                    className="rounded-xl px-5"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={formStatus === "loading"}
                    className="font-bold bg-[#1155CC] hover:bg-[#0d44a4] text-white rounded-xl px-6 shadow-sm"
                  >
                    {formStatus === "loading" ? "Submitting Application..." : "Submit Application"}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </main>
      <SiteFooter />
    </>
  );
}
