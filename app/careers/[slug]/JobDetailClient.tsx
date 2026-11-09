"use client";

import React, { useState, useRef, useEffect, startTransition } from "react";
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
  FileText,
  X,
  Globe,
  CheckCircle2,
} from "lucide-react";

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.6 1.6 0 0 0 1.6-1.6 1.6 1.6 0 0 0-1.6-1.6 1.6 1.6 0 0 0 1.6 1.6m1.4 9.74v-8.37H5.06v8.37h2.8z" />
    </svg>
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

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

const DEFAULT_SIMILAR_JOBS: JobPosting[] = [];

export default function JobDetailClient({
  job,
  similarJobs = DEFAULT_SIMILAR_JOBS,
}: JobDetailClientProps) {
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
  const [isDragging, setIsDragging] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const validateAndSetFile = (file: File | null | undefined) => {
    setFileError("");
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

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const isClosed = job.status === "CLOSED";
  const isPaused = job.status === "PAUSED";
  const canApply = !isClosed && !isPaused;

  // Prevent background scroll and pause Lenis while dialog is open
  useEffect(() => {
    if (isApplyOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const win =
        typeof window !== "undefined"
          ? (window as unknown as Record<string, { stop: () => void; start: () => void }>)
          : null;
      if (win && win["__lenis"]) {
        win["__lenis"].stop();
      }
      return () => {
        document.body.style.overflow = originalOverflow;
        if (win && win["__lenis"]) {
          win["__lenis"].start();
        }
      };
    }
  }, [isApplyOpen]);

  // Read the URL on the client only (avoids SSR/hydration issues)
  useEffect(() => {
    startTransition(() => {
      setCurrentUrl(window.location.href);
    });
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

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void handleSubmit(onFormSubmit)(e);
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
    validateAndSetFile(e.target.files?.[0]);
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
    if (Array.isArray(job.screeningQuestions)) {
      for (const sq of job.screeningQuestions) {
        if (sq?.required) {
          const val = screeningAnswers[sq.id];
          if (val === undefined || val === "") {
            setFormError(
              `Please answer the screening question: "${sq.question || "Required question"}"`,
            );
            return;
          }
        }
      }
    }

    setFormStatus("loading");
    setFormError("");

    try {
      const screeningPayload = Array.isArray(job.screeningQuestions)
        ? job.screeningQuestions
            .filter((q) => q && typeof q === "object")
            .map((q) => ({
              questionId: q.id || "q",
              question: q.question || "",
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
    const isMinValid = typeof salaryMin === "number" && Number.isFinite(salaryMin);
    const isMaxValid = typeof salaryMax === "number" && Number.isFinite(salaryMax);
    if (!isMinValid && !isMaxValid) return null;

    try {
      const formatter = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: salaryCurrency,
        maximumFractionDigits: 0,
      });

      const periodLabel =
        (salaryPeriod || "").toLowerCase() === "month"
          ? "/ mo"
          : (salaryPeriod || "").toLowerCase() === "hour"
            ? "/ hr"
            : "/ yr";

      if (isMinValid && isMaxValid) {
        return `${formatter.format(salaryMin!)} – ${formatter.format(salaryMax!)} ${periodLabel}`;
      }
      if (isMinValid) {
        return `From ${formatter.format(salaryMin!)} ${periodLabel}`;
      }
      if (isMaxValid) {
        return `Up to ${formatter.format(salaryMax!)} ${periodLabel}`;
      }
    } catch {
      return null;
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
      <main className="min-h-screen overflow-x-hidden bg-[#FAFBFD] pt-28 pb-32 font-sans text-slate-900">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Back link */}
          <div className="mb-6">
            <Link
              href="/careers"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition-colors hover:text-[#1155CC]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to all open positions</span>
            </Link>
          </div>

          {/* Closed / Paused State Banner */}
          {(isClosed || isPaused) && (
            <ClosedJobBanner status={job.status} similarJobs={similarJobs} />
          )}

          {/* Role Header Card */}
          <div className="relative mb-10 overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-10">
            <div className="pointer-events-none absolute top-0 right-0 h-96 w-96 rounded-full bg-blue-500/[0.04] blur-3xl" />

            <div className="relative z-10 flex flex-col justify-between gap-6 border-b border-slate-100 pb-8 lg:flex-row lg:items-center">
              <div className="max-w-3xl space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-black tracking-wider text-[#1155CC] uppercase">
                    {job.department}
                  </span>
                  {job.experienceLevel && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold tracking-wider text-slate-600 uppercase">
                      Level: {job.experienceLevel}
                    </span>
                  )}
                  {job.referenceCode && (
                    <span className="rounded-full border border-slate-200/60 bg-slate-50 px-2.5 py-1 font-mono text-[10px] text-slate-400">
                      Ref: {job.referenceCode}
                    </span>
                  )}
                </div>

                <h1 className="text-3xl leading-tight font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                  {job.title}
                </h1>

                {job.summary && (
                  <p className="text-base leading-relaxed font-medium text-slate-600">
                    {job.summary}
                  </p>
                )}
              </div>

              {canApply && (
                <div className="flex shrink-0 gap-3 sm:flex-col">
                  {job.applicationMethod === "external" && job.externalApplyUrl ? (
                    <Button
                      asChild
                      size="lg"
                      className="w-full font-bold shadow-md shadow-blue-500/10 sm:w-auto"
                    >
                      <a href={job.externalApplyUrl} target="_blank" rel="noopener noreferrer">
                        <span>Apply Externally</span>
                        <ExternalLink className="ml-1.5 h-4 w-4" />
                      </a>
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      onClick={() => setIsApplyOpen(true)}
                      className="w-full font-bold shadow-md shadow-blue-500/10 sm:w-auto"
                    >
                      <span>Apply for this Role</span>
                      <Send className="ml-1.5 h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Summary Strip */}
            <div className="relative z-10 grid grid-cols-2 gap-4 pt-6 sm:grid-cols-4 sm:gap-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-[#1155CC]">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    Location
                  </div>
                  <div className="text-xs font-semibold text-slate-800 sm:text-sm">
                    {job.location}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 text-indigo-600">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    Work Mode / Type
                  </div>
                  <div className="text-xs font-semibold text-slate-800 sm:text-sm">
                    {job.workMode ? `${job.workMode} • ${job.type}` : job.type}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600">
                  <Banknote className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    Compensation
                  </div>
                  <div className="text-xs font-semibold text-slate-800 sm:text-sm">
                    {formattedSalary || "Competitive / Undisclosed"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-amber-100 bg-amber-50 text-amber-600">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    Application Deadline
                  </div>
                  <div className="text-xs font-semibold text-slate-800 sm:text-sm">
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
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <Share2 className="h-3.5 w-3.5 text-slate-400" />
                <span>Share this opening with colleagues:</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                  aria-label="Copy job link"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-slate-500" />
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
                  className="rounded-xl border border-slate-200 p-2 text-slate-600 transition-colors hover:border-[#0A66C2]/30 hover:text-[#0A66C2]"
                  aria-label="Share on LinkedIn"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>

                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    `Check out this role: ${job.title} at TechSonance Infotech`,
                  )}&url=${encodeURIComponent(currentUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-slate-200 p-2 text-slate-600 transition-colors hover:border-black/30 hover:text-black"
                  aria-label="Share on X / Twitter"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>

                <a
                  href={`mailto:?subject=${encodeURIComponent(
                    `Job Opening: ${job.title} at TechSonance`,
                  )}&body=${encodeURIComponent(
                    `Hey, thought you might be interested in this opening:\n\n${job.title}\n${currentUrl}`,
                  )}`}
                  className="rounded-xl border border-slate-200 p-2 text-slate-600 transition-colors hover:border-rose-200 hover:text-rose-600"
                  aria-label="Share via Email"
                >
                  <Mail className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Main Content Layout */}
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
            <div className="space-y-12 lg:col-span-8">
              {/* 1. About the Role */}
              <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="mb-4 flex items-center gap-2 font-mono text-xs font-black tracking-wider text-slate-400 uppercase">
                  <Sparkles className="h-4 w-4 text-[#1155CC]" />
                  <span>{"// About the Role"}</span>
                </h2>
                <div className="text-sm leading-relaxed font-normal whitespace-pre-line text-slate-700 sm:text-base">
                  {job.description}
                </div>
              </section>

              {/* 2. Key Responsibilities */}
              {job.responsibilities && job.responsibilities.length > 0 && (
                <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
                  <h2 className="mb-6 flex items-center gap-2 font-mono text-xs font-black tracking-wider text-slate-400 uppercase">
                    <Check className="h-4 w-4 text-[#1155CC]" />
                    <span>{"// Key Responsibilities"}</span>
                  </h2>
                  <ul className="space-y-4">
                    {job.responsibilities.map((resp) => (
                      <li
                        key={`resp-${resp.slice(0, 30)}`}
                        className="flex items-start gap-3.5 text-sm text-slate-700 sm:text-base"
                      >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-xs font-bold text-[#1155CC]">
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
                <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
                  <h2 className="mb-6 flex items-center gap-2 font-mono text-xs font-black tracking-wider text-slate-400 uppercase">
                    <Award className="h-4 w-4 text-indigo-600" />
                    <span>{"// Requirements & Qualifications"}</span>
                  </h2>
                  <ul className="space-y-4">
                    {job.requirements.map((req) => (
                      <li
                        key={`req-${req.slice(0, 30)}`}
                        className="flex items-start gap-3.5 text-sm text-slate-700 sm:text-base"
                      >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-indigo-100 bg-indigo-50 text-xs font-bold text-indigo-600">
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
                <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
                  <h2 className="mb-6 flex items-center gap-2 font-mono text-xs font-black tracking-wider text-slate-400 uppercase">
                    <Sparkles className="h-4 w-4 text-violet-600" />
                    <span>{"// Preferred Qualifications (Bonus Points)"}</span>
                  </h2>
                  <ul className="space-y-4">
                    {job.preferredQualifications.map((pref) => (
                      <li
                        key={`pref-${pref.slice(0, 30)}`}
                        className="flex items-start gap-3.5 text-sm text-slate-700 sm:text-base"
                      >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-violet-100 bg-violet-50 text-xs font-bold text-violet-600">
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
                <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
                  <h2 className="mb-6 flex items-center gap-2 font-mono text-xs font-black tracking-wider text-slate-400 uppercase">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>{"// Benefits & Perks"}</span>
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {job.benefits.map((benefit) => (
                      <div
                        key={`benefit-${benefit.slice(0, 30)}`}
                        className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4"
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-xs font-bold text-emerald-700">
                          ★
                        </span>
                        <span className="text-xs leading-snug font-semibold text-slate-800 sm:text-sm">
                          {benefit}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* 6. About the Team */}
              <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="mb-4 flex items-center gap-2 font-mono text-xs font-black tracking-wider text-slate-400 uppercase">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span>{"// About the Team"}</span>
                </h2>
                <p className="text-sm leading-relaxed font-normal text-slate-700 sm:text-base">
                  {job.aboutTeam ||
                    "You will work alongside senior software engineers, system architects, and technical product managers who are passionate about engineering craftsmanship. We believe in autonomous squads, fast feedback loops, continuous learning, and zero micro-management."}
                </p>
              </section>

              {/* 7. Hiring Process Steps */}
              <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="mb-8 flex items-center gap-2 font-mono text-xs font-black tracking-wider text-slate-400 uppercase">
                  <Clock className="h-4 w-4 text-[#1155CC]" />
                  <span>{"// Hiring Process Steps"}</span>
                </h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {hiringSteps.map((step) => (
                    <div
                      key={step.step}
                      className="relative space-y-2 rounded-2xl border border-slate-100 bg-[#FAFBFD] p-5"
                    >
                      <div className="font-mono text-xs font-black tracking-wider text-[#1155CC]">
                        STEP {step.step}
                      </div>
                      <h3 className="text-base font-bold text-slate-900">{step.title}</h3>
                      {step.desc && (
                        <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
                          {step.desc}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* 8. Equal Opportunity Statement */}
              <section className="rounded-3xl border border-slate-200/60 bg-slate-100/60 p-6 sm:p-8">
                <h2 className="mb-3 font-mono text-xs font-black tracking-wider text-slate-500 uppercase">
                  {"// Equal Opportunity Employer"}
                </h2>
                <p className="text-xs leading-relaxed font-medium text-slate-600 sm:text-sm">
                  {eeocStatement}
                </p>
              </section>
            </div>

            {/* Sidebar Sticky Panel */}
            <aside
              aria-label="Role overview and application sidebar"
              className="space-y-6 lg:sticky lg:top-28 lg:col-span-4"
            >
              {/* Quick Info Box */}
              <div className="space-y-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <h3 className="border-b border-slate-100 pb-4 text-sm font-bold tracking-wider text-slate-900 uppercase">
                  Position Snapshot
                </h3>

                <div className="space-y-4 text-xs">
                  <div>
                    <span className="mb-0.5 block font-semibold text-slate-400">Role Title</span>
                    <span className="text-sm font-bold text-slate-800">{job.title}</span>
                  </div>
                  <div>
                    <span className="mb-0.5 block font-semibold text-slate-400">Department</span>
                    <span className="font-bold text-slate-800">{job.department}</span>
                  </div>
                  <div>
                    <span className="mb-0.5 block font-semibold text-slate-400">Location</span>
                    <span className="font-bold text-slate-800">{job.location}</span>
                  </div>
                  <div>
                    <span className="mb-0.5 block font-semibold text-slate-400">
                      Work Arrangement
                    </span>
                    <span className="font-bold text-slate-800">{job.workMode || "Hybrid"}</span>
                  </div>
                  <div>
                    <span className="mb-0.5 block font-semibold text-slate-400">
                      Employment Type
                    </span>
                    <span className="font-bold text-slate-800">{job.type}</span>
                  </div>
                  {job.skills && job.skills.length > 0 && (
                    <div>
                      <span className="mb-2 block font-semibold text-slate-400">
                        Key Competencies
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {job.skills.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-lg border border-blue-100/50 bg-blue-50/70 px-2.5 py-1 text-[11px] font-semibold text-[#1155CC]"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {canApply ? (
                  <div className="border-t border-slate-100 pt-4">
                    {job.applicationMethod === "external" && job.externalApplyUrl ? (
                      <Button
                        asChild
                        size="lg"
                        className="w-full font-bold shadow-md shadow-blue-500/10"
                      >
                        <a href={job.externalApplyUrl} target="_blank" rel="noopener noreferrer">
                          <span>Apply Externally</span>
                          <ExternalLink className="ml-1.5 h-4 w-4" />
                        </a>
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        onClick={() => setIsApplyOpen(true)}
                        className="w-full font-bold shadow-md shadow-blue-500/10"
                      >
                        <span>Apply for this Position</span>
                        <Send className="ml-1.5 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="border-t border-slate-100 pt-4 text-center">
                    <span className="block text-xs font-bold tracking-wider text-slate-400 uppercase">
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
          <div className="fixed right-0 bottom-0 left-0 z-40 border-t border-slate-200/80 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-md lg:hidden">
            <div className="mx-auto flex max-w-md items-center justify-between gap-4">
              <div className="truncate">
                <div className="truncate text-xs font-bold text-slate-900">{job.title}</div>
                <div className="truncate text-[11px] text-slate-500">
                  {job.location} • {job.type}
                </div>
              </div>
              {job.applicationMethod === "external" && job.externalApplyUrl ? (
                <Button asChild size="sm" className="shrink-0 font-bold">
                  <a href={job.externalApplyUrl} target="_blank" rel="noopener noreferrer">
                    <span>Apply</span>
                    <ExternalLink className="ml-1 h-3.5 w-3.5" />
                  </a>
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setIsApplyOpen(true)}
                  className="shrink-0 font-bold"
                >
                  <span>Apply Now</span>
                  <Send className="ml-1 h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Apply Dialog Modal */}
        <Dialog open={isApplyOpen} onOpenChange={handleDialogChange}>
          <DialogContent
            data-lenis-prevent="true"
            className="flex max-h-[90vh] flex-col overflow-hidden overscroll-contain rounded-3xl border border-slate-200/90 bg-white p-0 shadow-2xl sm:max-w-2xl"
          >
            {/* Sticky Modal Header */}
            <div className="shrink-0 border-b border-slate-100 bg-white p-6 pb-4">
              <DialogHeader>
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-black tracking-wider text-[#1155CC] uppercase">
                    {job.department}
                  </span>
                  <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                    {job.workMode || job.location}
                  </span>
                </div>
                <DialogTitle className="font-sora text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
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
                className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-6 py-10 text-center"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl font-black text-emerald-600 shadow-sm">
                  ✓
                </div>
                <h4 className="font-sora text-2xl font-black tracking-tight text-slate-900">
                  Application Submitted!
                </h4>
                <p className="mx-auto max-w-md text-sm leading-relaxed text-slate-600">
                  Thank you, <strong>{submittedCandidate?.name}</strong>. We have received your
                  application for <strong>{job.title}</strong> and sent a confirmation to{" "}
                  <span className="font-semibold text-slate-900">{submittedCandidate?.email}</span>.
                </p>

                <div className="mx-auto mt-4 max-w-md space-y-2 rounded-2xl border border-slate-200/80 bg-slate-50 p-4 text-left text-xs text-slate-600">
                  <div className="text-[10px] font-bold tracking-wider text-slate-800 uppercase">
                    What happens next:
                  </div>
                  <ul className="list-disc space-y-1 pl-4">
                    <li>Our hiring team reviews your resume and project links.</li>
                    <li>If aligned, our recruiter will reach out within 3 business days.</li>
                    <li>
                      For questions or data requests, contact{" "}
                      <span className="font-medium text-[#1155CC]">careers@techsonance.co.in</span>.
                    </li>
                  </ul>
                </div>

                <div className="flex items-center justify-center gap-3 pt-4">
                  <Button variant="outline" onClick={() => handleDialogChange(false)}>
                    Close
                  </Button>
                  <Button
                    asChild
                    variant="default"
                    className="bg-[#1155CC] text-white hover:bg-[#0d44a4]"
                  >
                    <Link href="/careers">Explore Other Roles</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="flex flex-1 flex-col overflow-hidden">
                {/* Scrollable Form Body */}
                <div
                  data-lenis-prevent="true"
                  className="flex-1 space-y-4 overflow-y-auto overscroll-contain p-6 focus:outline-none"
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
                    <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-700">
                      <span className="shrink-0 font-bold">⚠️</span>
                      <span>{formError}</span>
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="apply-fullName"
                      className="mb-1 block text-xs font-bold tracking-wider text-slate-700 uppercase"
                    >
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="apply-fullName"
                      type="text"
                      required
                      placeholder="e.g. Maya Sharma"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                      {...register("fullName", { required: "Full name is required" })}
                    />
                    {errors.fullName && (
                      <p className="mt-1 text-xs font-semibold text-rose-500">
                        {errors.fullName.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="apply-email"
                        className="mb-1 block text-xs font-bold tracking-wider text-slate-700 uppercase"
                      >
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="apply-email"
                        type="email"
                        required
                        placeholder="maya@example.com"
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                        {...register("email", {
                          required: "Email address is required",
                          pattern: {
                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: "Invalid email format",
                          },
                        })}
                      />
                      {errors.email && (
                        <p className="mt-1 text-xs font-semibold text-rose-500">
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="apply-phone"
                        className="mb-1 block text-xs font-bold tracking-wider text-slate-700 uppercase"
                      >
                        Phone Number
                      </label>
                      <input
                        id="apply-phone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                        {...register("phone")}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="apply-location"
                        className="mb-1 block text-xs font-bold tracking-wider text-slate-700 uppercase"
                      >
                        Current Location
                      </label>
                      <input
                        id="apply-location"
                        type="text"
                        placeholder="e.g. Surat, Gujarat, India"
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                        {...register("currentLocation")}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="apply-noticePeriodWeeks"
                        className="mb-1 block text-xs font-bold tracking-wider text-slate-700 uppercase"
                      >
                        Notice Period / Availability
                      </label>
                      <select
                        id="apply-noticePeriodWeeks"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                        {...register("noticePeriodWeeks", {
                          valueAsNumber: true,
                        })}
                      >
                        <option value={0}>Immediate availability</option>
                        <option value={2}>2 weeks (15 days)</option>
                        <option value={4}>1 month (30 days)</option>
                        <option value={8}>2 months (60 days)</option>
                        <option value={12}>3 months (90 days)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label
                        htmlFor="apply-linkedin"
                        className="mb-1 flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-slate-700 uppercase"
                      >
                        <LinkedinIcon className="h-3.5 w-3.5 text-[#0A66C2]" />
                        <span>LinkedIn</span>
                      </label>
                      <input
                        id="apply-linkedin"
                        type="url"
                        placeholder="https://linkedin.com/in/..."
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                        {...register("linkedinUrl")}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="apply-github"
                        className="mb-1 flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-slate-700 uppercase"
                      >
                        <GithubIcon className="h-3.5 w-3.5 text-slate-800" />
                        <span>GitHub</span>
                      </label>
                      <input
                        id="apply-github"
                        type="url"
                        placeholder="https://github.com/..."
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                        {...register("githubUrl")}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="apply-portfolio"
                        className="mb-1 flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-slate-700 uppercase"
                      >
                        <Globe className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Portfolio</span>
                      </label>
                      <input
                        id="apply-portfolio"
                        type="url"
                        placeholder="https://portfolio.dev"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                        {...register("portfolioUrl")}
                      />
                    </div>
                  </div>

                  {/* Resume Upload */}
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label className="block text-xs font-bold tracking-wider text-slate-700 uppercase">
                        Resume / CV (PDF or DOCX, max 5MB){" "}
                        {job.resumeRequired !== false ? (
                          <span className="text-rose-500">*</span>
                        ) : (
                          <span className="font-normal text-slate-400 lowercase">(optional)</span>
                        )}
                      </label>
                      {resumeFile && (
                        <button
                          type="button"
                          onClick={() => {
                            setResumeFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className="cursor-pointer font-mono text-[10px] font-bold text-rose-500 hover:text-rose-600"
                        >
                          Remove file
                        </button>
                      )}
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                      onChange={handleFileChange}
                      className="hidden"
                      id="resume-upload-modal"
                    />

                    {resumeFile ? (
                      <div className="flex items-center justify-between rounded-2xl border border-blue-200 bg-blue-50/60 p-3.5 transition-all">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-slate-900">
                              {resumeFile.name}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500">
                              <span>{formatFileSize(resumeFile.size)}</span>
                              <span>•</span>
                              <span className="flex items-center gap-0.5 font-semibold text-emerald-600">
                                <CheckCircle2 className="inline h-3 w-3" /> Ready to upload
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setResumeFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className="ml-2 cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-200/60 hover:text-slate-700"
                          aria-label="Remove resume file"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`mt-1 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-5 text-center transition-all ${
                          isDragging
                            ? "border-blue-500 bg-blue-50/70 scale-[0.99]"
                            : "border-slate-200 bg-slate-50/50 hover:border-blue-400 hover:bg-slate-50"
                        }`}
                      >
                        <div
                          className={`mb-2 flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                            isDragging ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          <Upload className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-semibold text-slate-800">
                          {isDragging
                            ? "Drop your resume here"
                            : "Click to select or drag and drop your resume"}
                        </span>
                        <span className="mt-0.5 text-[10px] text-slate-400">
                          PDF or Word (.doc, .docx) up to 5MB • Validated before upload
                        </span>
                      </div>
                    )}

                    {fileError && (
                      <p className="mt-1.5 text-xs font-semibold text-rose-600">{fileError}</p>
                    )}
                  </div>

                  {/* Cover Letter */}
                  {job.coverLetterRequirement?.toUpperCase() !== "OFF" && (
                    <div>
                      <label className="mb-1 block text-xs font-bold tracking-wider text-slate-700 uppercase">
                        Cover Letter / Notes{" "}
                        {job.coverLetterRequirement === "REQUIRED" && (
                          <span className="text-rose-500">*</span>
                        )}
                        {(job.coverLetterRequirement === "OPTIONAL" ||
                          !job.coverLetterRequirement) && (
                          <span className="font-normal text-slate-400 lowercase">(optional)</span>
                        )}
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Tell us what excites you about this role and why you're a great fit..."
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                        {...register("coverLetter")}
                      />
                    </div>
                  )}

                  {/* Screening Questions (if role specifies any) */}
                  {job.screeningQuestions &&
                    Array.isArray(job.screeningQuestions) &&
                    job.screeningQuestions.length > 0 && (
                      <div className="space-y-3 border-t border-slate-100 pt-2">
                        <h5 className="text-xs font-bold tracking-wider text-slate-900 uppercase">
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
                                <label className="flex cursor-pointer items-center gap-1.5">
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
                                <label className="flex cursor-pointer items-center gap-1.5">
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
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
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
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
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
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                  {/* Consent Checkboxes */}
                  <div className="space-y-2 border-t border-slate-100 pt-2">
                    <label className="flex cursor-pointer items-start gap-2.5 text-xs text-slate-600">
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
                          className="font-semibold text-[#1155CC] underline"
                        >
                          Privacy Policy
                        </Link>{" "}
                        and consent to the processing of my application data.{" "}
                        <span className="font-bold text-rose-500">*</span>
                      </span>
                    </label>
                    {errors.privacyConsent && (
                      <p className="text-xs font-semibold text-rose-500">
                        {errors.privacyConsent.message}
                      </p>
                    )}

                    <label className="flex cursor-pointer items-start gap-2.5 text-xs text-slate-600">
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
                <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/90 p-4 backdrop-blur-xs sm:p-5">
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
                    className="rounded-xl bg-[#1155CC] px-6 font-bold text-white shadow-sm hover:bg-[#0d44a4]"
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
