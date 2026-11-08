"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import {
  Briefcase,
  MapPin,
  FileText,
  DollarSign,
  Settings2,
  CheckSquare,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  HelpCircle,
  ExternalLink,
  Shield,
  Layers,
  Save,
  Copy,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { evaluateCompleteness, type JobCompletenessState } from "./CompletenessChecklist";
import { StructuredListInput } from "./StructuredListInput";
import { JobReviewSummary } from "./JobReviewSummary";
import { FormSelect } from "./FormSelect";
import { JobQualityWidget } from "./JobQualityWidget";
import type { DetectedIssue } from "@/lib/utils/job-quality-assistant";
import type { ScreeningQuestion } from "@/lib/validations/careers";

export interface JobFormData extends JobCompletenessState {
  id?: string;
  siteId?: string;
  referenceCode?: string;
  openingsCount?: number;
  ownerId?: string;
  hiringManagerId?: string;
  remoteEligibility?: string;
  visaSupport?: string;
  experienceLevel?: string;
  preferredQualifications?: string[];
  skills?: string[];
  aboutTeam?: string;
  hiringProcess?: Array<{ step: string; title: string; desc?: string }>;
  salaryCurrency?: string;
  salaryPeriod?: string;
  showSalaryPublicly?: boolean;
  compensationNotes?: string;
  applicationMethod?: string;
  externalApplyUrl?: string;
  resumeRequired?: boolean;
  coverLetterRequirement?: string;
  screeningQuestions?: ScreeningQuestion[];
  status?: string;
  approvalStatus?: string;
  approvalComment?: string;
  versionId?: number;
  publishAt?: string | Date | null;
  visibility?: string;
  featured?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: string;
}

export const DEFAULT_JOB_FORM: JobFormData = {
  title: "",
  slug: "",
  referenceCode: "",
  department: "Engineering",
  openingsCount: 1,
  summary: "",
  workMode: "hybrid",
  location: "Surat, Gujarat, India",
  remoteEligibility: "Pan-India Remote",
  visaSupport: "no",
  type: "Full Time",
  experienceLevel: "Mid-Senior",
  description: "",
  responsibilities: [],
  requirements: [],
  preferredQualifications: [],
  skills: [],
  benefits: [
    "Competitive health insurance & wellness allowance",
    "MacBook Pro workstation & home-office setup stipend",
    "Annual learning & conference allowance",
    "Flexible hybrid schedule with remote Fridays",
  ],
  aboutTeam:
    "TechSonance Engineering builds scalable, high-throughput web architectures and enterprise platforms.",
  hiringProcess: [
    {
      step: "01",
      title: "Profile & Portfolio Review",
      desc: "Our recruitment leads review your past systems and contributions.",
    },
    {
      step: "02",
      title: "Technical Architecture Session",
      desc: "Hands-on discussion on engineering patterns and problem solving.",
    },
    {
      step: "03",
      title: "Team & Values Conversation",
      desc: "Meet your future peers, learn about team dynamics and culture.",
    },
    {
      step: "04",
      title: "Offer & Onboarding",
      desc: "Formal offer discussion, compensation details, and welcome kit.",
    },
  ],
  equalOpportunityStatement:
    "TechSonance Infotech LLP is an equal opportunity employer. We celebrate diversity and are committed to creating an inclusive environment for all employees regardless of race, gender, background, or identity.",
  salaryCurrency: "INR",
  salaryPeriod: "year",
  showSalaryPublicly: true,
  salaryMin: 1200000,
  salaryMax: 1800000,
  compensationNotes: "Annual performance bonus and stock options based on tier.",
  applicationMethod: "builtin",
  externalApplyUrl: "",
  resumeRequired: true,
  coverLetterRequirement: "optional",
  screeningQuestions: [],
  status: "DRAFT",
  visibility: "public",
  featured: false,
};

interface JobEditorFormProps {
  initialJob?: Partial<JobFormData>;
  onSave?: (jobData: JobFormData) => Promise<void> | void;
  onSubmitForReview?: (jobData: JobFormData) => Promise<void> | void;
  onPublish?: (jobData: JobFormData) => Promise<void> | void;
  onDuplicate?: (jobData: JobFormData) => Promise<void> | void;
  isSaving?: boolean;
  isDuplicating?: boolean;
  saveStatus?: "idle" | "saving" | "saved" | "error";
  lastSavedAt?: Date | null;
  className?: string;
  isNew?: boolean;
  hasBlockingError?: boolean;
  onClearError?: () => void;
  onRetrySave?: () => void;
}

export function JobEditorForm({
  initialJob,
  onSave,
  onSubmitForReview,
  onPublish,
  onDuplicate,
  isSaving = false,
  isDuplicating = false,
  saveStatus = "idle",
  lastSavedAt,
  className = "",
  isNew = false,
  hasBlockingError = false,
  onClearError,
  onRetrySave,
}: JobEditorFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors, isDirty },
  } = useForm<JobFormData>({
    defaultValues: {
      ...DEFAULT_JOB_FORM,
      ...initialJob,
      responsibilities: initialJob?.responsibilities || DEFAULT_JOB_FORM.responsibilities,
      requirements: initialJob?.requirements || DEFAULT_JOB_FORM.requirements,
      preferredQualifications: initialJob?.preferredQualifications || [],
      skills: initialJob?.skills || [],
      benefits: initialJob?.benefits || DEFAULT_JOB_FORM.benefits,
      screeningQuestions: initialJob?.screeningQuestions || [],
      hiringProcess: initialJob?.hiringProcess || DEFAULT_JOB_FORM.hiringProcess,
    },
  });

  const job = watch();

  useEffect(() => {
    if (initialJob) {
      reset({
        ...DEFAULT_JOB_FORM,
        ...initialJob,
        responsibilities: initialJob?.responsibilities || DEFAULT_JOB_FORM.responsibilities,
        requirements: initialJob?.requirements || DEFAULT_JOB_FORM.requirements,
        preferredQualifications: initialJob?.preferredQualifications || [],
        skills: initialJob?.skills || [],
        benefits: initialJob?.benefits || DEFAULT_JOB_FORM.benefits,
        screeningQuestions: initialJob?.screeningQuestions || [],
        hiringProcess: initialJob?.hiringProcess || DEFAULT_JOB_FORM.hiringProcess,
      });
    }
  }, [initialJob, reset]);

  // Unsaved changes browser navigation guard (Finding 24)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Manual save model: Auto-save disabled to prevent disruptive background network validation errors while typing.
  // Changes are persisted explicitly via "Save Draft" or upon publishing.
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [requirementsModalOpen, setRequirementsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "basics" | "location" | "content" | "compensation" | "application" | "review"
  >("basics");

  const handleApplyQualityFix = (issue: DetectedIssue) => {
    const regex = new RegExp(`\\b${issue.word}\\b`, "gi");
    if (issue.field === "description") {
      const current = getValues("description") || "";
      setValue("description", current.replace(regex, issue.suggestion), { shouldDirty: true });
    } else if (issue.field === "summary") {
      const current = getValues("summary") || "";
      setValue("summary", current.replace(regex, issue.suggestion), { shouldDirty: true });
    } else if (issue.field === "title") {
      const current = getValues("title") || "";
      updateField("title", current.replace(regex, issue.suggestion));
    } else if (issue.field === "responsibilities") {
      const current = getValues("responsibilities") || [];
      const updated = current.map((r) => r.replace(regex, issue.suggestion));
      setValue("responsibilities", updated, { shouldDirty: true });
    } else if (issue.field === "requirements") {
      const current = getValues("requirements") || [];
      const updated = current.map((r) => r.replace(regex, issue.suggestion));
      setValue("requirements", updated, { shouldDirty: true });
    }
  };

  // Temporary input buffers for tag / list additions
  const [newResp, setNewResp] = useState("");
  const [newReq, setNewReq] = useState("");
  const [newPref, setNewPref] = useState("");
  const [newSkill, setNewSkill] = useState("");
  const [newBenefit, setNewBenefit] = useState("");

  const updateField = <K extends keyof JobFormData>(key: K, value: JobFormData[K]) => {
    if (hasBlockingError) {
      onClearError?.();
    }
    setValue(key as any, value as any, { shouldDirty: true });
    if (key === "title" && typeof value === "string") {
      const currentSlug = getValues("slug");
      if (!currentSlug || currentSlug === slugify(getValues("title") || "")) {
        setValue("slug", slugify(value), { shouldDirty: true });
      }
    }
  };

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // Add items to arrays
  const handleAddResponsibility = () => {
    if (!newResp.trim()) return;
    const current = getValues("responsibilities") || [];
    setValue("responsibilities", [...current, newResp.trim()], { shouldDirty: true });
    setNewResp("");
  };

  const handleRemoveResponsibility = (index: number) => {
    const current = getValues("responsibilities") || [];
    setValue(
      "responsibilities",
      current.filter((_, i) => i !== index),
      { shouldDirty: true },
    );
  };

  const handleAddRequirement = () => {
    if (!newReq.trim()) return;
    const current = getValues("requirements") || [];
    setValue("requirements", [...current, newReq.trim()], { shouldDirty: true });
    setNewReq("");
  };

  const handleRemoveRequirement = (index: number) => {
    const current = getValues("requirements") || [];
    setValue(
      "requirements",
      current.filter((_, i) => i !== index),
      { shouldDirty: true },
    );
  };

  const handleAddPreferred = () => {
    if (!newPref.trim()) return;
    const current = getValues("preferredQualifications") || [];
    setValue("preferredQualifications", [...current, newPref.trim()], { shouldDirty: true });
    setNewPref("");
  };

  const handleRemovePreferred = (index: number) => {
    const current = getValues("preferredQualifications") || [];
    setValue(
      "preferredQualifications",
      current.filter((_, i) => i !== index),
      { shouldDirty: true },
    );
  };

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    const cleaned = newSkill.trim();
    const current = getValues("skills") || [];
    if (!current.includes(cleaned)) {
      setValue("skills", [...current, cleaned], { shouldDirty: true });
    }
    setNewSkill("");
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const current = getValues("skills") || [];
    setValue(
      "skills",
      current.filter((s) => s !== skillToRemove),
      { shouldDirty: true },
    );
  };

  const handleAddBenefit = () => {
    if (!newBenefit.trim()) return;
    const current = getValues("benefits") || [];
    setValue("benefits", [...current, newBenefit.trim()], { shouldDirty: true });
    setNewBenefit("");
  };

  const handleRemoveBenefit = (index: number) => {
    const current = getValues("benefits") || [];
    setValue(
      "benefits",
      current.filter((_, i) => i !== index),
      { shouldDirty: true },
    );
  };

  // Screening questions management
  const handleAddScreeningQuestion = () => {
    const newQuestion: ScreeningQuestion = {
      id: `sq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      question: "How many years of relevant production experience do you possess?",
      type: "short_text",
      required: true,
    };
    const current = getValues("screeningQuestions") || [];
    setValue("screeningQuestions", [...current, newQuestion], { shouldDirty: true });
  };

  const handleUpdateScreeningQuestion = (index: number, updates: Partial<ScreeningQuestion>) => {
    const current = [...(getValues("screeningQuestions") || [])];
    if (current[index]) {
      current[index] = { ...current[index], ...updates };
      setValue("screeningQuestions", current, { shouldDirty: true });
    }
  };

  const handleRemoveScreeningQuestion = (index: number) => {
    const current = getValues("screeningQuestions") || [];
    setValue(
      "screeningQuestions",
      current.filter((_, i) => i !== index),
      { shouldDirty: true },
    );
  };

  // Hiring Process Step Management
  const handleAddHiringStep = () => {
    const currentSteps = getValues("hiringProcess") || [];
    const nextStepNum = String(currentSteps.length + 1).padStart(2, "0");
    setValue(
      "hiringProcess",
      [
        ...currentSteps,
        {
          step: nextStepNum,
          title: "New Interview Step",
          desc: "Description of the assessment or meeting.",
        },
      ],
      { shouldDirty: true },
    );
  };

  const handleUpdateHiringStep = (index: number, updates: { title?: string; desc?: string }) => {
    const steps = [...(getValues("hiringProcess") || [])];
    if (steps[index]) {
      steps[index] = { ...steps[index], ...updates };
      setValue("hiringProcess", steps, { shouldDirty: true });
    }
  };

  const handleRemoveHiringStep = (index: number) => {
    const current = getValues("hiringProcess") || [];
    setValue(
      "hiringProcess",
      current.filter((_, i) => i !== index),
      { shouldDirty: true },
    );
  };

  const completeness = evaluateCompleteness(job);
  const isAlreadyPublished = job.status === "PUBLISHED" || job.status === "OPEN";
  const canPublishDirectly =
    job.status === "DRAFT" || job.status === "IN_REVIEW" || !job.status || isAlreadyPublished;
  const isPublishDisabled = isSaving || saveStatus === "saving" || hasBlockingError;

  const getFieldTab = (
    field: string,
  ): "basics" | "location" | "content" | "compensation" | "application" | "review" => {
    const f = field.toLowerCase();
    if (f.includes("title") || f.includes("department") || f.includes("opening")) return "basics";
    if (f.includes("location") || f.includes("work mode")) return "location";
    if (f.includes("description") || f.includes("responsibilit") || f.includes("requirement"))
      return "content";
    if (f.includes("salary")) return "compensation";
    if (f.includes("external") || f.includes("apply url")) return "application";
    if (f.includes("deadline")) return "review";
    return "basics";
  };

  const handlePublishClick = () => {
    if (!completeness.isComplete) {
      setRequirementsModalOpen(true);
    } else {
      setPublishConfirmOpen(true);
    }
  };

  const getTabStatus = (tabId: string): "complete" | "incomplete" | "error" => {
    switch (tabId) {
      case "basics": {
        if (!job.title || job.title.trim().length < 3) return "incomplete";
        if (!job.department || job.department.trim().length < 2) return "incomplete";
        if (job.openingsCount !== undefined && job.openingsCount < 1) return "error";
        return "complete";
      }
      case "location": {
        if (!job.location || job.location.trim().length < 2) return "incomplete";
        if (!job.workMode) return "incomplete";
        return "complete";
      }
      case "content": {
        if (!job.description || job.description.trim().length < 10) return "incomplete";
        if (!job.responsibilities || job.responsibilities.length < 1) return "incomplete";
        if (!job.requirements || job.requirements.length < 1) return "incomplete";
        return "complete";
      }
      case "compensation": {
        if (
          job.salaryMin !== undefined &&
          job.salaryMax !== undefined &&
          job.salaryMin > 0 &&
          job.salaryMax > 0 &&
          job.salaryMin > job.salaryMax
        ) {
          return "error";
        }
        return "complete";
      }
      case "application": {
        if (
          job.applicationMethod === "external" &&
          (!job.externalApplyUrl || job.externalApplyUrl.trim().length < 5)
        ) {
          return "incomplete";
        }
        return "complete";
      }
      case "review": {
        if (completeness.isComplete) return "complete";
        return "incomplete";
      }
      default:
        return "incomplete";
    }
  };

  const formatCompensationPreview = () => {
    const currency = job.salaryCurrency || "INR";
    const period = job.salaryPeriod || "year";
    const min = job.salaryMin;
    const max = job.salaryMax;

    if (min === undefined && max === undefined) {
      return "Compensation not disclosed";
    }

    const fmt = (val: number) => {
      try {
        return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
          style: "currency",
          currency,
          maximumFractionDigits: 0,
        }).format(val);
      } catch {
        return `${currency} ${val.toLocaleString()}`;
      }
    };

    const periodStr = period === "year" ? "yr" : period === "month" ? "mo" : "hr";
    const isLpaApplicable = currency === "INR" && period === "year";

    const formatLpa = (val: number) => {
      const lpa = val / 100_000;
      return Number.isInteger(lpa) ? `${lpa} LPA` : `${lpa.toFixed(1)} LPA`;
    };

    if (min !== undefined && max !== undefined) {
      if (isLpaApplicable && min >= 100_000 && max >= 100_000) {
        return `${fmt(min)} – ${fmt(max)} (${formatLpa(min)} – ${formatLpa(max)}) / ${periodStr}`;
      }
      return `${fmt(min)} – ${fmt(max)} / ${periodStr}`;
    }
    if (min !== undefined) {
      if (isLpaApplicable && min >= 100_000) {
        return `From ${fmt(min)} (${formatLpa(min)}) / ${periodStr}`;
      }
      return `From ${fmt(min)} / ${periodStr}`;
    }
    if (isLpaApplicable && max! >= 100_000) {
      return `Up to ${fmt(max!)} (${formatLpa(max!)}) / ${periodStr}`;
    }
    return `Up to ${fmt(max!)} / ${periodStr}`;
  };

  const tabs = [
    { id: "basics", label: "1. Basics", icon: Briefcase },
    { id: "location", label: "2. Location & Mode", icon: MapPin },
    { id: "content", label: "3. Content", icon: FileText },
    { id: "compensation", label: "4. Compensation", icon: DollarSign },
    { id: "application", label: "5. Application Settings", icon: Settings2 },
    { id: "review", label: "6. Review & Publish", icon: CheckSquare },
  ] as const;

  const tabKeys = [
    "basics",
    "location",
    "content",
    "compensation",
    "application",
    "review",
  ] as const;
  const currentTabIndex = tabKeys.indexOf(activeTab);
  const isFirstTab = currentTabIndex === 0;
  const isLastTab = currentTabIndex === tabKeys.length - 1;
  const handleNextTab = () => {
    if (!isLastTab) {
      const nextTab = tabKeys[currentTabIndex + 1];
      if (nextTab) {
        setActiveTab(nextTab);
      }
    }
  };
  const handlePrevTab = () => {
    if (!isFirstTab) {
      const prevTab = tabKeys[currentTabIndex - 1];
      if (prevTab) {
        setActiveTab(prevTab);
      }
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Top Header & Save Status Bar */}
      <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1155CC]/10 font-sora text-sm font-black text-[#1155CC]">
            {job.title ? job.title.charAt(0).toUpperCase() : "+"}
          </div>
          <div>
            <h2 className="flex items-center gap-2 font-sora text-sm font-black text-slate-900 dark:text-white">
              <span>{job.title || "Untitled Draft Position"}</span>
              <Badge
                variant="outline"
                className="font-mono text-[10px] font-bold tracking-wider uppercase"
              >
                {job.status || "DRAFT"}
              </Badge>
            </h2>
            <div className="mt-0.5 flex items-center gap-2 font-mono text-[10px] text-slate-400">
              <span>/{job.slug || "slug-pending"}</span>
              {job.referenceCode && <span>• REF: {job.referenceCode}</span>}
            </div>
          </div>
        </div>

        <div className="flex w-full items-center justify-end gap-2.5 sm:w-auto">
          {/* Unified Save Status Indicator (Finding 3, Spec 4.1) */}
          <div
            className="mr-1 flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400"
            aria-live="polite"
          >
            {isSaving || saveStatus === "saving" ? (
              <>
                <Clock className="h-3.5 w-3.5 animate-spin text-[#1155CC]" />
                <span className="font-semibold text-[#1155CC]">Saving…</span>
              </>
            ) : saveStatus === "error" ? (
              <>
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-500" />
                <span className="text-rose-600 dark:text-rose-400">
                  Couldn&apos;t save,{" "}
                  <button
                    type="button"
                    onClick={() => {
                      onClearError?.();
                      if (onRetrySave) {
                        onRetrySave();
                      } else {
                        onSave?.(getValues());
                      }
                    }}
                    className="cursor-pointer font-bold underline hover:text-rose-700"
                  >
                    retry
                  </button>
                </span>
              </>
            ) : isDirty ? (
              <>
                <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                <span className="font-medium text-amber-600 dark:text-amber-400">
                  Unsaved changes
                </span>
              </>
            ) : lastSavedAt ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span>
                  Saved at{" "}
                  {lastSavedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                </span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                <span>Draft ready</span>
              </>
            )}
          </div>

          {!isNew && onDuplicate && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onDuplicate(getValues())}
              disabled={isSaving || isDuplicating}
              className="h-8 cursor-pointer gap-1.5 rounded-xl text-xs font-bold"
              title="Clone this role into a new draft"
            >
              <Copy className="h-3.5 w-3.5 text-slate-500" />
              <span>{isDuplicating ? "Duplicating…" : "Duplicate"}</span>
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSave?.(getValues())}
            disabled={isSaving || saveStatus === "saving"}
            className="h-8 cursor-pointer gap-1.5 rounded-xl text-xs font-bold"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save Draft</span>
          </Button>

          {canPublishDirectly ? (
            <Button
              type="button"
              size="sm"
              onClick={handlePublishClick}
              disabled={isPublishDisabled}
              className="h-8 cursor-pointer gap-1.5 rounded-xl bg-emerald-600 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Publish Role Now</span>
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={() => onSubmitForReview?.(getValues())}
              disabled={isPublishDisabled}
              className="h-8 cursor-pointer gap-1.5 rounded-xl bg-[#1155CC] text-xs font-bold text-white hover:bg-blue-700"
            >
              <ArrowRight className="h-3.5 w-3.5" />
              <span>Submit for Review</span>
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Navigation (Finding 14, 21, Spec 4.2) */}
      <div
        role="tablist"
        aria-label="Job editor wizard steps"
        className="flex scrollbar-none items-center gap-1.5 overflow-x-auto rounded-xl bg-slate-100/90 p-1 dark:bg-slate-800/70"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const status = getTabStatus(tab.id);
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-current={isActive ? "step" : undefined}
              id={`tab-${tab.id}`}
              aria-controls={`panel-${tab.id}`}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-[#1155CC] focus-visible:outline-hidden ${
                isActive
                  ? "bg-white dark:bg-slate-900 text-[#1155CC] shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
              <span
                aria-label={`Status: ${status}`}
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  status === "complete"
                    ? "bg-emerald-500"
                    : status === "error"
                      ? "bg-rose-500"
                      : "bg-amber-400"
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Main Form Body */}
      <div className="w-full space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs sm:p-5 dark:border-slate-800 dark:bg-slate-900">
        {/* TAB 1: BASICS */}
        {activeTab === "basics" && (
          <div className="space-y-3.5 duration-200 animate-in fade-in">
            <div>
              <h3 className="font-sora text-sm font-bold text-slate-900 dark:text-white">
                Role Identity &amp; Overview
              </h3>
              <p className="mt-0.5 text-[11px] text-slate-500">
                General role parameters, organizational unit, and card preview summary.
              </p>
            </div>

            <div>
              <label
                htmlFor="job-title-input"
                className="mb-1.5 block text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300"
              >
                Job Title <span className="text-rose-500">*</span>
              </label>
              <Input
                id="job-title-input"
                required
                placeholder="e.g. Lead Distributed Systems Engineer"
                value={job.title || ""}
                onChange={(e) => updateField("title", e.target.value)}
                className="rounded-xl text-xs font-medium"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="job-slug-input"
                  className="mb-1.5 block text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300"
                >
                  URL Slug
                </label>
                <Input
                  id="job-slug-input"
                  placeholder="e.g. lead-distributed-systems-engineer"
                  value={job.slug || ""}
                  onChange={(e) => updateField("slug", slugify(e.target.value))}
                  className="rounded-xl font-mono text-xs"
                />
                <p className="mt-1 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                  Public preview: /careers/{job.slug || "slug-pending"}
                </p>
              </div>
              <div>
                <label
                  htmlFor="job-refcode-input"
                  className="mb-1.5 block text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300"
                >
                  Reference Code{" "}
                  <span className="font-normal text-slate-400 lowercase">(optional)</span>
                </label>
                <Input
                  id="job-refcode-input"
                  placeholder="e.g. ENG-2026-04"
                  value={job.referenceCode || ""}
                  onChange={(e) => updateField("referenceCode", e.target.value)}
                  className="rounded-xl font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormSelect
                label="Department"
                required
                value={job.department || "Engineering"}
                onChange={(e) => updateField("department", e.target.value)}
              >
                <option value="Engineering">Engineering</option>
                <option value="Design">Design &amp; Creative</option>
                <option value="Product">Product Management</option>
                <option value="Marketing">Growth &amp; Marketing</option>
                <option value="Sales">Business Development &amp; Sales</option>
                <option value="Operations">Operations &amp; Infrastructure</option>
                <option value="People & Talent">People &amp; Talent</option>
              </FormSelect>

              <div>
                <label className="mb-1.5 block text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                  Target Openings Count{" "}
                  <span className="font-normal text-slate-400 lowercase">(default 1)</span>
                </label>
                <Input
                  type="number"
                  min={1}
                  max={999}
                  value={job.openingsCount ?? 1}
                  onChange={(e) => updateField("openingsCount", Number(e.target.value))}
                  className="rounded-xl text-xs font-medium"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="job-summary-textarea"
                  className="text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300"
                >
                  Role Summary (Job Card Snippet)
                </label>
                <span
                  className={`font-mono text-[10px] ${
                    (job.summary?.length || 0) > 300
                      ? "text-amber-500 font-bold"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {job.summary?.length || 0} / 300 characters
                </span>
              </div>
              <Textarea
                id="job-summary-textarea"
                rows={3}
                placeholder="Concise 1-2 sentence overview shown in job cards, search snippets, and mobile summaries."
                value={job.summary || ""}
                onChange={(e) => updateField("summary", e.target.value)}
                className="rounded-xl text-xs font-medium"
              />
              <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                Displayed on careers index cards and role previews. Separate from the Google SERP
                meta description in Step 6.
              </p>
            </div>

            {/* Step Requirement Notice (User request) */}
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-[11px] text-slate-600 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
              <span className="font-bold text-rose-500">*</span>
              <span>Job Title and Department are mandatory fields in this step to publish.</span>
            </div>
          </div>
        )}

        {/* TAB 2: LOCATION & MODE */}
        {activeTab === "location" && (
          <div className="space-y-3.5 duration-200 animate-in fade-in">
            <div>
              <h3 className="font-sora text-sm font-bold text-slate-900 dark:text-white">
                Workplace Location & Flexibility
              </h3>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Configure office headquarters and remote eligibility boundaries.
              </p>
            </div>

            <div>
              <span className="mb-2 block text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                Work Mode <span className="text-rose-500">*</span>
              </span>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "on_site", label: "On-site", desc: "100% in-office hub" },
                  { value: "hybrid", label: "Hybrid", desc: "Flexible office + remote" },
                  { value: "remote", label: "Remote", desc: "Fully remote flexibility" },
                ].map((mode) => (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => updateField("workMode", mode.value)}
                    className={`cursor-pointer rounded-2xl border p-3.5 text-left transition-all ${
                      job.workMode === mode.value
                        ? "border-[#1155CC] bg-[#1155CC]/5 text-[#1155CC] ring-1 ring-[#1155CC]"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="text-xs font-bold">{mode.label}</div>
                    <div className="mt-0.5 text-[10px] text-slate-400">{mode.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="job-location-input"
                className="mb-1.5 block text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300"
              >
                Primary Location / City <span className="text-rose-500">*</span>
              </label>
              <Input
                id="job-location-input"
                required
                placeholder="e.g. Surat, Gujarat, India or Bengaluru, India"
                value={job.location || ""}
                onChange={(e) => updateField("location", e.target.value)}
                className="rounded-xl text-xs font-medium"
              />
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                  Quick hubs:
                </span>
                {[
                  "Bhubaneswar, India",
                  "Bengaluru, India",
                  "Hyderabad, India",
                  "Pune, India",
                  "Remote",
                ].map((hub) => (
                  <button
                    key={hub}
                    type="button"
                    onClick={() => {
                      updateField("location", hub);
                      if (hub === "Remote") {
                        updateField("workMode", "remote");
                      }
                    }}
                    className={`cursor-pointer rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all ${
                      job.location === hub
                        ? "bg-[#1155CC] text-white border-[#1155CC]"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {hub}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[10px] text-slate-400">
                Specify a primary city hub or choose 'Remote'.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="job-remote-eligibility"
                  className="mb-1.5 block text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300"
                >
                  Remote Eligibility Region (India)
                </label>
                <Input
                  id="job-remote-eligibility"
                  placeholder="e.g. Pan-India, Gujarat or Hybrid"
                  value={job.remoteEligibility || ""}
                  onChange={(e) => updateField("remoteEligibility", e.target.value)}
                  className="rounded-xl text-xs font-medium"
                />
              </div>

              <FormSelect
                label="Visa &amp; Work Authorization"
                value={job.visaSupport || "no"}
                onChange={(e) => updateField("visaSupport", e.target.value)}
              >
                <option value="no">No visa sponsorship (Domestic authorization required)</option>
                <option value="yes">Visa sponsorship / transfer available</option>
                <option value="case_by_case">Evaluated on a case-by-case basis</option>
              </FormSelect>
            </div>

            {/* Step Requirement Notice (User request) */}
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-[11px] text-slate-600 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
              <span className="font-bold text-rose-500">*</span>
              <span>
                Work Mode and Primary Location are mandatory fields to publish this position.
              </span>
            </div>
          </div>
        )}

        {/* TAB 3: CONTENT */}
        {activeTab === "content" && (
          <div className="space-y-3.5 duration-200 animate-in fade-in">
            <div>
              <h3 className="font-sora text-sm font-bold text-slate-900 dark:text-white">
                Role Description, Requirements & Perks
              </h3>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Detailed job overview, core deliverables, technical requirements, and agency perks.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormSelect
                label="Employment Type"
                value={job.type || "Full Time"}
                onChange={(e) => updateField("type", e.target.value)}
              >
                <option value="Full Time">Full Time</option>
                <option value="Part Time">Part Time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
                <option value="Freelance">Freelance</option>
              </FormSelect>

              <FormSelect
                label="Experience Level"
                value={job.experienceLevel || "Mid-Senior"}
                onChange={(e) => updateField("experienceLevel", e.target.value)}
              >
                <option value="Entry">Entry Level (0-2 yrs)</option>
                <option value="Mid">Mid Level (2-5 yrs)</option>
                <option value="Mid-Senior">Mid-Senior (4-7 yrs)</option>
                <option value="Senior">Senior Level (6-10 yrs)</option>
                <option value="Lead">Lead / Staff Architect (8+ yrs)</option>
                <option value="Executive">Executive / Director</option>
              </FormSelect>
            </div>

            {/* Role Quality & Inclusive Language Assistant */}
            <JobQualityWidget
              data={{
                title: job.title,
                summary: job.summary,
                description: job.description,
                responsibilities: job.responsibilities,
                requirements: job.requirements,
                showSalaryPublicly: job.showSalaryPublicly,
              }}
              onApplyFix={handleApplyQualityFix}
            />

            {/* Description Markdown */}
            <div>
              <label
                htmlFor="job-description-textarea"
                className="mb-1.5 block text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300"
              >
                Full Role Description <span className="text-rose-500">*</span>
              </label>
              <Textarea
                id="job-description-textarea"
                rows={6}
                required
                placeholder="In-depth narrative of the position, team mission, and impact on client systems."
                value={job.description || ""}
                onChange={(e) => updateField("description", e.target.value)}
                className="rounded-xl text-xs leading-relaxed font-medium"
              />
            </div>

            {/* Responsibilities Structured Input */}
            <StructuredListInput
              label="Key Responsibilities"
              items={job.responsibilities || []}
              onChange={(items) => updateField("responsibilities", items)}
              required
              placeholder="e.g. Design and maintain high-throughput distributed microservices..."
              helperText="Paste multi-line text or bulleted lists (•, -, *). Each row can be edited, reordered, or removed with undo."
            />

            {/* Requirements Structured Input */}
            <StructuredListInput
              label="Requirements & Qualifications"
              items={job.requirements || []}
              onChange={(items) => updateField("requirements", items)}
              required
              placeholder="e.g. 5+ years building production applications in TypeScript or Go..."
              helperText="Core technical prerequisites, experience bands, and domain expertise."
            />

            {/* Preferred Qualifications Structured Input */}
            <StructuredListInput
              label="Preferred Qualifications (Nice-to-Have)"
              items={job.preferredQualifications || []}
              onChange={(items) => updateField("preferredQualifications", items)}
              placeholder="e.g. Prior experience with Kubernetes operator development..."
              helperText="Optional bonuses that make candidate profiles stand out."
            />

            {/* Skills Tags */}
            <div className="space-y-3">
              <label className="block text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                Tech Stack & Skills Tags ({(job.skills || []).length})
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. Next.js 16, TypeScript, PostgreSQL, AWS..."
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
                  className="rounded-xl text-xs"
                />
                <Button
                  type="button"
                  onClick={handleAddSkill}
                  className="shrink-0 cursor-pointer gap-1 rounded-xl bg-slate-800 text-xs font-bold text-white"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Tag</span>
                </Button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {(job.skills || []).map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="cursor-pointer rounded-full text-slate-400 hover:text-rose-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Agency Perks & Benefits Structured Input */}
            <StructuredListInput
              label="Agency Perks & Benefits"
              items={job.benefits || []}
              onChange={(items) => updateField("benefits", items)}
              placeholder="e.g. Comprehensive health coverage, MacBook Pro setup stipend..."
              helperText="Wellness perks, equipment allowances, and team benefits."
            />

            {/* Hiring steps builder */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                  Hiring Steps Journey ({(job.hiringProcess || []).length})
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddHiringStep}
                  className="h-7 gap-1 rounded-xl text-[11px] font-bold"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add Step</span>
                </Button>
              </div>

              <div className="space-y-2">
                {(job.hiringProcess || []).map((step, idx) => (
                  <div
                    key={idx}
                    className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/30"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-[#1155CC]">
                        Step {step.step || String(idx + 1).padStart(2, "0")}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveHiringStep(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <Input
                      value={step.title}
                      onChange={(e) => handleUpdateHiringStep(idx, { title: e.target.value })}
                      placeholder="Step title (e.g. Technical Discovery)"
                      className="rounded-xl text-xs font-bold"
                    />
                    <Input
                      value={step.desc || ""}
                      onChange={(e) => handleUpdateHiringStep(idx, { desc: e.target.value })}
                      placeholder="Brief summary of what happens during this step"
                      className="rounded-xl text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>
            {/* Step Requirement Notice (User request) */}
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-[11px] text-slate-600 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
              <span className="font-bold text-rose-500">*</span>
              <span>
                Role Description (min 10 chars), at least 1 Responsibility, and at least 1
                Requirement are mandatory to publish.
              </span>
            </div>
          </div>
        )}

        {/* TAB 4: COMPENSATION */}
        {activeTab === "compensation" && (
          <div className="space-y-3.5 duration-200 animate-in fade-in">
            <div>
              <h3 className="font-sora text-sm font-bold text-slate-900 dark:text-white">
                Compensation &amp; Pay Transparency
              </h3>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Set competitive salary bounds, currency, and public card display options.
              </p>
            </div>

            {/* Live Compensation Preview Banner (Finding 14, Spec 4.5) */}
            <div className="flex items-center justify-between rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-slate-50 p-4 dark:border-slate-800 dark:from-slate-800/40 dark:to-slate-800/20">
              <div>
                <span className="block font-mono text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Public Candidate Display Preview
                </span>
                <div className="mt-0.5 font-sora text-base font-extrabold text-[#1155CC] dark:text-blue-400">
                  {job.showSalaryPublicly
                    ? formatCompensationPreview()
                    : "Competitive / Not Disclosed Publicly"}
                </div>
              </div>
              <Badge
                variant={job.showSalaryPublicly ? "default" : "outline"}
                className="font-mono text-xs font-bold"
              >
                {job.showSalaryPublicly ? "Public Band" : "Confidential"}
              </Badge>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Show Compensation Publicly
                </div>
                <div className="mt-0.5 text-[11px] text-slate-400">
                  Displays salary band on the public careers portal and Schema.org JobPosting
                  JSON-LD.
                </div>
              </div>
              <input
                type="checkbox"
                checked={Boolean(job.showSalaryPublicly)}
                onChange={(e) => updateField("showSalaryPublicly", e.target.checked)}
                className="h-4 w-4 cursor-pointer rounded text-[#1155CC] focus:ring-[#1155CC]"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormSelect
                label="Currency"
                value={job.salaryCurrency || "INR"}
                onChange={(e) => updateField("salaryCurrency", e.target.value)}
                className="font-mono font-bold"
              >
                <option value="INR">INR (₹ Indian Rupee)</option>
                <option value="USD">USD ($ US Dollar)</option>
                <option value="EUR">EUR (€ Euro)</option>
                <option value="GBP">GBP (£ British Pound)</option>
              </FormSelect>

              <FormSelect
                label="Pay Period"
                value={job.salaryPeriod || "year"}
                onChange={(e) => updateField("salaryPeriod", e.target.value)}
              >
                <option value="year">Per Year (Annual)</option>
                <option value="month">Per Month</option>
                <option value="hour">Per Hour</option>
              </FormSelect>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="job-salary-min-input"
                  className="mb-1.5 block text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300"
                >
                  Minimum Salary
                </label>
                <Input
                  id="job-salary-min-input"
                  type="number"
                  min={0}
                  placeholder="e.g. 1200000"
                  value={job.salaryMin ?? ""}
                  onChange={(e) =>
                    updateField("salaryMin", e.target.value ? Number(e.target.value) : undefined)
                  }
                  className={`rounded-xl font-mono text-xs ${
                    job.salaryMin !== undefined &&
                    job.salaryMax !== undefined &&
                    job.salaryMin > job.salaryMax
                      ? "border-rose-500 ring-1 ring-rose-500"
                      : ""
                  }`}
                />
              </div>

              <div>
                <label
                  htmlFor="job-salary-max-input"
                  className="mb-1.5 block text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300"
                >
                  Maximum Salary
                </label>
                <Input
                  id="job-salary-max-input"
                  type="number"
                  min={0}
                  placeholder="e.g. 1800000"
                  value={job.salaryMax ?? ""}
                  onChange={(e) =>
                    updateField("salaryMax", e.target.value ? Number(e.target.value) : undefined)
                  }
                  className={`rounded-xl font-mono text-xs ${
                    job.salaryMin !== undefined &&
                    job.salaryMax !== undefined &&
                    job.salaryMin > job.salaryMax
                      ? "border-rose-500 ring-1 ring-rose-500"
                      : ""
                  }`}
                />
              </div>
            </div>

            {/* Live Locale-Aware Compensation Display Preview (Finding 15, Spec 4.3 Step 4) */}
            <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-800/40">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                  Live Candidate Display Preview
                </span>
                <div className="flex items-center gap-2 font-mono text-sm font-black text-slate-900 dark:text-white">
                  <span>{formatCompensationPreview()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {job.showSalaryPublicly ? (
                  <Badge
                    variant="outline"
                    className="border-emerald-200 bg-emerald-50 text-[10px] font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                  >
                    Publicly Disclosed (Card &amp; JSON-LD)
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-[10px] font-medium text-slate-500 dark:text-slate-400"
                  >
                    Undisclosed on Card
                  </Badge>
                )}
              </div>
            </div>

            {job.salaryMin !== undefined &&
              job.salaryMax !== undefined &&
              job.salaryMin > job.salaryMax && (
                <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Salary minimum cannot exceed maximum. Please adjust bounds.</span>
                </div>
              )}

            <div>
              <label
                htmlFor="job-compensation-notes"
                className="mb-1.5 block text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300"
              >
                Compensation Notes &amp; Equity
              </label>
              <Textarea
                id="job-compensation-notes"
                rows={3}
                placeholder="e.g. Annual discretionary performance bonus, equity options for senior bands, health perks"
                value={job.compensationNotes || ""}
                onChange={(e) => updateField("compensationNotes", e.target.value)}
                className="rounded-xl text-xs font-medium"
              />
            </div>

            {/* Step Requirement Notice (User request) */}
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-[11px] text-slate-600 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
              <span className="font-bold text-rose-500">*</span>
              <span>
                Compensation details are optional for drafting. If configured, Minimum Salary cannot
                exceed Maximum Salary.
              </span>
            </div>
          </div>
        )}

        {/* TAB 5: APPLICATION SETTINGS */}
        {activeTab === "application" && (
          <div className="space-y-3.5 duration-200 animate-in fade-in">
            <div>
              <h3 className="font-sora text-sm font-bold text-slate-900 dark:text-white">
                Candidate Intake &amp; Screening Setup
              </h3>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Select application pipeline routing, resume requirements, and knockout screening
                criteria.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormSelect
                label="Application Intake Method"
                value={job.applicationMethod || "builtin"}
                onChange={(e) => updateField("applicationMethod", e.target.value)}
              >
                <option value="builtin">Built-in Careers Portal (Native intake to ATS)</option>
                <option value="external">External ATS / Greenhouse / Lever URL</option>
              </FormSelect>

              <FormSelect
                label="Cover Letter Policy"
                value={job.coverLetterRequirement || "optional"}
                onChange={(e) => updateField("coverLetterRequirement", e.target.value)}
              >
                <option value="optional">Optional (Recommended)</option>
                <option value="required">Mandatory</option>
                <option value="off">Off (Hide cover letter field)</option>
              </FormSelect>
            </div>

            {job.applicationMethod === "external" && (
              <div>
                <label
                  htmlFor="job-external-apply-url"
                  className="mb-1.5 block text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300"
                >
                  External Application URL <span className="text-rose-500">*</span>
                </label>
                <Input
                  id="job-external-apply-url"
                  type="url"
                  placeholder="https://jobs.lever.co/techsonance/..."
                  value={job.externalApplyUrl || ""}
                  onChange={(e) => updateField("externalApplyUrl", e.target.value)}
                  className="rounded-xl font-mono text-xs"
                />
              </div>
            )}

            <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Resume Required
                </div>
                <div className="text-[10px] text-slate-400">
                  PDF or DOCX upload strictly required from candidate
                </div>
              </div>
              <input
                type="checkbox"
                checked={job.resumeRequired !== false}
                onChange={(e) => updateField("resumeRequired", e.target.checked)}
                className="h-4 w-4 cursor-pointer rounded text-[#1155CC] focus:ring-[#1155CC]"
              />
            </div>

            {/* Custom Screening Questions Builder */}
            <div className="space-y-3 pt-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold tracking-wider text-slate-900 uppercase dark:text-white">
                    Custom Screening Questions ({(job.screeningQuestions || []).length})
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Configure custom questions with optional knockout triggers for automated alerts.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={handleAddScreeningQuestion}
                  className="gap-1 rounded-xl bg-[#1155CC] text-xs font-bold text-white"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Question</span>
                </Button>
              </div>

              <div className="space-y-3">
                {(job.screeningQuestions || []).map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/30"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-slate-400">
                        QUESTION {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveScreeningQuestion(idx)}
                        className="p-1 text-slate-400 transition-colors hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <Input
                      value={q.question}
                      onChange={(e) =>
                        handleUpdateScreeningQuestion(idx, { question: e.target.value })
                      }
                      placeholder="Enter screening question prompt..."
                      className="rounded-xl text-xs font-medium"
                    />

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <FormSelect
                        label="Response Type"
                        value={q.type}
                        onChange={(e) =>
                          handleUpdateScreeningQuestion(idx, {
                            type: e.target.value as any,
                          })
                        }
                      >
                        <option value="short_text">Short Text</option>
                        <option value="long_text">Long Narrative</option>
                        <option value="boolean">Yes / No (Boolean)</option>
                        <option value="choice">Multiple Choice</option>
                      </FormSelect>

                      <div className="flex items-center gap-2 pt-6">
                        <input
                          type="checkbox"
                          checked={Boolean(q.required)}
                          onChange={(e) =>
                            handleUpdateScreeningQuestion(idx, { required: e.target.checked })
                          }
                          className="h-4 w-4 cursor-pointer rounded text-[#1155CC] focus:ring-[#1155CC]"
                        />
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          Required Answer
                        </span>
                      </div>

                      <div>
                        <label
                          htmlFor={`knockout-input-${idx}`}
                          className="mb-1 block text-[10px] font-bold text-amber-600 uppercase"
                        >
                          Knockout Answer (Alerts ATS)
                        </label>
                        <Input
                          id={`knockout-input-${idx}`}
                          placeholder="Optional disqualifying value"
                          value={String(q.knockoutAnswer ?? "")}
                          onChange={(e) =>
                            handleUpdateScreeningQuestion(idx, {
                              knockoutAnswer: e.target.value || undefined,
                            })
                          }
                          className="rounded-xl text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step Requirement Notice (User request) */}
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-[11px] text-slate-600 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
              <span className="font-bold text-rose-500">*</span>
              <span>
                External Application URL is mandatory when Application Method is set to External
                ATS.
              </span>
            </div>
          </div>
        )}

        {/* TAB 6: REVIEW & PUBLISH (Finding 17, 18, 19, 20) */}
        {activeTab === "review" && (
          <div className="space-y-3.5 duration-200 animate-in fade-in">
            <JobReviewSummary
              job={job}
              updateField={updateField}
              onNavigateToTab={(targetTab) => setActiveTab(targetTab)}
            />
          </div>
        )}

        {/* Sticky Action Navigation Bar (Finding 13, Spec 4.5) */}
        <div className="sticky bottom-0 z-20 mt-8 flex items-center justify-between gap-3 border-t border-slate-200 bg-white/95 pt-4 pb-1 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrevTab}
              disabled={isFirstTab}
              className="cursor-pointer gap-1.5 rounded-xl text-xs font-bold disabled:opacity-40"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </Button>
            <span className="hidden font-mono text-[11px] font-bold text-slate-500 sm:inline-block dark:text-slate-400">
              Step {currentTabIndex + 1} of 6
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onSave?.(getValues())}
              disabled={isSaving || saveStatus === "saving"}
              className="cursor-pointer gap-1.5 rounded-xl text-xs font-bold"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save Draft</span>
            </Button>

            {!isLastTab ? (
              <Button
                type="button"
                size="sm"
                onClick={handleNextTab}
                className="cursor-pointer gap-1.5 rounded-xl bg-[#1155CC] text-xs font-bold text-white shadow-xs hover:bg-blue-700"
              >
                <span>Next: {tabs[currentTabIndex + 1]?.label.replace(/^\d+\.\s*/, "")}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : canPublishDirectly ? (
              <Button
                type="button"
                size="sm"
                onClick={handlePublishClick}
                disabled={isPublishDisabled}
                className="cursor-pointer gap-1.5 rounded-xl bg-emerald-600 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{isAlreadyPublished ? "Update Published Role" : "Publish Role Now"}</span>
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={() => onSubmitForReview?.(getValues())}
                disabled={isPublishDisabled}
                className="cursor-pointer gap-1.5 rounded-xl bg-[#1155CC] text-xs font-bold text-white hover:bg-blue-700"
              >
                <span>Submit for Review</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Pre-Publish Confirmation Dialog (Finding 2, 25) */}
      <Dialog open={publishConfirmOpen} onOpenChange={setPublishConfirmOpen}>
        <DialogContent className="max-w-md rounded-2xl p-5">
          <DialogHeader className="space-y-1.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 font-bold text-emerald-600">
              <Sparkles className="h-4 w-4" />
            </div>
            <DialogTitle className="font-sora text-base font-black text-slate-900 dark:text-white">
              Publish Role to Careers Portal?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              You are about to publish{" "}
              <strong className="text-slate-900 dark:text-white">{job.title || "this role"}</strong>{" "}
              directly to the public careers portal. It will become live immediately for applicants.
            </DialogDescription>
          </DialogHeader>

          <div className="my-2 space-y-1.5 rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs dark:border-slate-800 dark:bg-slate-800/60">
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span className="text-slate-400">Public URL:</span>
              <span className="font-bold text-[#1155CC]">
                /careers/{job.slug || "slug-pending"}
              </span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span className="text-slate-400">Department:</span>
              <span>{job.department || "Engineering"}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span className="text-slate-400">Work Mode:</span>
              <span className="uppercase">{job.workMode || "Hybrid"}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-2 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPublishConfirmOpen(false)}
              className="cursor-pointer rounded-xl text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={async () => {
                setPublishConfirmOpen(false);
                if (isDirty) {
                  await onSave?.(getValues());
                }
                await onPublish?.(getValues());
              }}
              disabled={isSaving}
              className="cursor-pointer rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700"
            >
              Confirm &amp; Publish Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Missing Requirements Modal Dialog (User Request & Spec 4.6) */}
      <Dialog open={requirementsModalOpen} onOpenChange={setRequirementsModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-5">
          <DialogHeader className="space-y-1.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 font-bold text-amber-600">
              <AlertCircle className="h-4 w-4" />
            </div>
            <DialogTitle className="font-sora text-base font-black text-slate-900 dark:text-white">
              Requirements Needed to Publish
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              Please complete the following mandatory fields before publishing{" "}
              <strong className="text-slate-900 dark:text-white">{job.title || "this role"}</strong>{" "}
              to the public careers portal:
            </DialogDescription>
          </DialogHeader>

          <div className="my-2 max-h-60 space-y-2 overflow-y-auto pr-1">
            {completeness.missingFields.map((field) => {
              const targetTab = getFieldTab(field);
              return (
                <div
                  key={field}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs dark:border-slate-800 dark:bg-slate-800/60"
                >
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {field}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRequirementsModalOpen(false);
                      setActiveTab(targetTab);
                    }}
                    className="h-7 cursor-pointer rounded-lg border-[#1155CC]/30 text-[11px] font-bold text-[#1155CC] hover:bg-[#1155CC]/10"
                  >
                    Go to {tabs.find((t) => t.id === targetTab)?.label.replace(/^\d+\.\s*/, "")}
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end border-t border-slate-100 pt-3 dark:border-slate-800">
            <Button
              type="button"
              size="sm"
              onClick={() => setRequirementsModalOpen(false)}
              className="h-8 cursor-pointer rounded-xl bg-[#1155CC] text-xs font-bold text-white"
            >
              Close &amp; Complete Fields
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
