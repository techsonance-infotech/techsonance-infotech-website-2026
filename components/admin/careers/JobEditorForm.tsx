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
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CompletenessChecklist,
  evaluateCompleteness,
  type JobCompletenessState,
} from "./CompletenessChecklist";
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
  location: "Bhubaneswar, India",
  remoteEligibility: "India & APAC",
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
  aboutTeam: "TechSonance Engineering builds scalable, high-throughput web architectures and enterprise platforms.",
  hiringProcess: [
    { step: "01", title: "Profile & Portfolio Review", desc: "Our recruitment leads review your past systems and contributions." },
    { step: "02", title: "Technical Architecture Session", desc: "Hands-on discussion on engineering patterns and problem solving." },
    { step: "03", title: "Team & Values Conversation", desc: "Meet your future peers, learn about team dynamics and culture." },
    { step: "04", title: "Offer & Onboarding", desc: "Formal offer discussion, compensation details, and welcome kit." },
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
  isSaving?: boolean;
  saveStatus?: "idle" | "saving" | "saved" | "error";
  lastSavedAt?: Date | null;
  className?: string;
  isNew?: boolean;
}

export function JobEditorForm({
  initialJob,
  onSave,
  onSubmitForReview,
  onPublish,
  isSaving = false,
  saveStatus = "idle",
  lastSavedAt,
  className = "",
  isNew = false,
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

  const [activeTab, setActiveTab] = useState<
    "basics" | "location" | "content" | "compensation" | "application" | "review"
  >("basics");

  // Temporary input buffers for tag / list additions
  const [newResp, setNewResp] = useState("");
  const [newReq, setNewReq] = useState("");
  const [newPref, setNewPref] = useState("");
  const [newSkill, setNewSkill] = useState("");
  const [newBenefit, setNewBenefit] = useState("");

  const updateField = <K extends keyof JobFormData>(key: K, value: JobFormData[K]) => {
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
        { step: nextStepNum, title: "New Interview Step", desc: "Description of the assessment or meeting." },
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

  const tabs = [
    { id: "basics", label: "1. Basics", icon: Briefcase },
    { id: "location", label: "2. Location & Mode", icon: MapPin },
    { id: "content", label: "3. Content", icon: FileText },
    { id: "compensation", label: "4. Compensation", icon: DollarSign },
    { id: "application", label: "5. Application Settings", icon: Settings2 },
    { id: "review", label: "6. Review & Publish", icon: CheckSquare },
  ] as const;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top Header & Save Status Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#1155CC]/10 text-[#1155CC] flex items-center justify-center font-black font-sora">
            {job.title ? job.title.charAt(0).toUpperCase() : "+"}
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white font-sora flex items-center gap-2">
              <span>{job.title || "Untitled Draft Position"}</span>
              <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider font-bold">
                {job.status || "DRAFT"}
              </Badge>
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
              <span>/{job.slug || "slug-pending"}</span>
              {job.referenceCode && <span>• REF: {job.referenceCode}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* Save status indicator */}
          <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5 mr-2">
            {isSaving || saveStatus === "saving" ? (
              <>
                <Clock className="w-3.5 h-3.5 animate-spin text-[#1155CC]" />
                <span>Saving draft...</span>
              </>
            ) : lastSavedAt ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Saved {lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </>
            ) : (
              <span>All changes local</span>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSave?.(getValues())}
            disabled={isSaving}
            className="rounded-xl text-xs font-bold gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Draft</span>
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/80 dark:bg-slate-800/60 rounded-2xl overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-white dark:bg-slate-900 text-[#1155CC] shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Form Section + Completeness Checklist Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Body (8 cols) */}
        <div className="lg:col-span-8 space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xs">
          {/* TAB 1: BASICS */}
          {activeTab === "basics" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-sora">
                  Role Identity & Overview
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  General role parameters, organizational unit, and card preview summary.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Job Title <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  placeholder="e.g. Lead Distributed Systems Engineer"
                  value={job.title || ""}
                  onChange={(e) => updateField("title", e.target.value)}
                  className="rounded-xl text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    URL Slug
                  </label>
                  <Input
                    placeholder="e.g. lead-distributed-systems-engineer"
                    value={job.slug || ""}
                    onChange={(e) => updateField("slug", slugify(e.target.value))}
                    className="rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Reference Code
                  </label>
                  <Input
                    placeholder="e.g. ENG-2026-04"
                    value={job.referenceCode || ""}
                    onChange={(e) => updateField("referenceCode", e.target.value)}
                    className="rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Department <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={job.department || "Engineering"}
                    onChange={(e) => updateField("department", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-xs font-medium text-slate-900 dark:text-white"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Design">Design & Creative</option>
                    <option value="Product">Product Management</option>
                    <option value="Marketing">Growth & Marketing</option>
                    <option value="Sales">Business Development & Sales</option>
                    <option value="Operations">Operations & Infrastructure</option>
                    <option value="People & Talent">People & Talent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Target Openings Count
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={job.openingsCount ?? 1}
                    onChange={(e) => updateField("openingsCount", Number(e.target.value))}
                    className="rounded-xl text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Role Summary / Snippet (Card & Meta Description)
                </label>
                <textarea
                  rows={3}
                  placeholder="Concise 1-2 sentence overview shown in job cards and Google search results."
                  value={job.summary || ""}
                  onChange={(e) => updateField("summary", e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  onClick={() => setActiveTab("location")}
                  className="rounded-xl bg-[#1155CC] text-white text-xs font-bold gap-1.5"
                >
                  <span>Next: Location & Work Mode</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* TAB 2: LOCATION & MODE */}
          {activeTab === "location" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-sora">
                  Workplace Location & Flexibility
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure office headquarters, remote eligibility boundaries, and visa policies.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Work Mode <span className="text-rose-500">*</span>
                </label>
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
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        job.workMode === mode.value
                          ? "border-[#1155CC] bg-[#1155CC]/5 text-[#1155CC] ring-1 ring-[#1155CC]"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <div className="font-bold text-xs">{mode.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{mode.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Primary Location / City <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  placeholder="e.g. Bhubaneswar, India or Bengaluru, India"
                  value={job.location || ""}
                  onChange={(e) => updateField("location", e.target.value)}
                  className="rounded-xl text-xs font-medium"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Specify a single primary city hub or 'Remote'. Multiple locations must be posted as separate roles.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Remote Eligibility Region
                  </label>
                  <Input
                    placeholder="e.g. India & APAC or Worldwide"
                    value={job.remoteEligibility || ""}
                    onChange={(e) => updateField("remoteEligibility", e.target.value)}
                    className="rounded-xl text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Visa Sponsorship
                  </label>
                  <select
                    value={job.visaSupport || "no"}
                    onChange={(e) => updateField("visaSupport", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-xs font-medium text-slate-900 dark:text-white"
                  >
                    <option value="no">Not provided (Must have local work authorization)</option>
                    <option value="yes">Direct sponsorship supported</option>
                    <option value="case_by_case">Evaluated case-by-case for senior roles</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab("basics")}
                  className="rounded-xl text-xs font-bold gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </Button>
                <Button
                  type="button"
                  onClick={() => setActiveTab("content")}
                  className="rounded-xl bg-[#1155CC] text-white text-xs font-bold gap-1.5"
                >
                  <span>Next: Content & Responsibilities</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* TAB 3: CONTENT */}
          {activeTab === "content" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-sora">
                  Role Description, Requirements & Perks
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Detailed job overview, core deliverables, technical requirements, and agency perks.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Employment Type
                  </label>
                  <select
                    value={job.type || "Full Time"}
                    onChange={(e) => updateField("type", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-xs font-medium text-slate-900 dark:text-white"
                  >
                    <option value="Full Time">Full Time</option>
                    <option value="Part Time">Part Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                    <option value="Freelance">Freelance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Experience Level
                  </label>
                  <select
                    value={job.experienceLevel || "Mid-Senior"}
                    onChange={(e) => updateField("experienceLevel", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-xs font-medium text-slate-900 dark:text-white"
                  >
                    <option value="Entry">Entry Level (0-2 yrs)</option>
                    <option value="Mid">Mid Level (2-5 yrs)</option>
                    <option value="Mid-Senior">Mid-Senior (4-7 yrs)</option>
                    <option value="Senior">Senior Level (6-10 yrs)</option>
                    <option value="Lead">Lead / Staff Architect (8+ yrs)</option>
                    <option value="Executive">Executive / Director</option>
                  </select>
                </div>
              </div>

              {/* Description Markdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Full Role Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="In-depth narrative of the position, team mission, and impact on client systems."
                  value={job.description || ""}
                  onChange={(e) => updateField("description", e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-xs font-medium text-slate-900 dark:text-white leading-relaxed"
                />
              </div>

              {/* Responsibilities list */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Key Responsibilities <span className="text-rose-500">*</span> ({(job.responsibilities || []).length})
                  </label>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a core responsibility or expected impact..."
                    value={newResp}
                    onChange={(e) => setNewResp(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddResponsibility())}
                    className="rounded-xl text-xs"
                  />
                  <Button
                    type="button"
                    onClick={handleAddResponsibility}
                    className="rounded-xl bg-[#1155CC] text-white text-xs font-bold shrink-0 gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </Button>
                </div>

                <div className="space-y-1.5">
                  {(job.responsibilities || []).map((resp, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#1155CC] shrink-0" />
                        <span className="text-slate-700 dark:text-slate-300">{resp}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveResponsibility(idx)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Requirements list */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Requirements & Qualifications <span className="text-rose-500">*</span> ({(job.requirements || []).length})
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a required skill, qualification, or experience..."
                    value={newReq}
                    onChange={(e) => setNewReq(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddRequirement())}
                    className="rounded-xl text-xs"
                  />
                  <Button
                    type="button"
                    onClick={handleAddRequirement}
                    className="rounded-xl bg-[#1155CC] text-white text-xs font-bold shrink-0 gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </Button>
                </div>

                <div className="space-y-1.5">
                  {(job.requirements || []).map((req, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                        <span className="text-slate-700 dark:text-slate-300">{req}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveRequirement(idx)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills Tags */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
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
                    className="rounded-xl bg-slate-800 text-white text-xs font-bold shrink-0 gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Tag</span>
                  </Button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(job.skills || []).map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-slate-400 hover:text-rose-500 rounded-full"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Benefits list */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Agency Perks & Benefits ({(job.benefits || []).length})
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add an agency benefit, health coverage, or allowance..."
                    value={newBenefit}
                    onChange={(e) => setNewBenefit(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddBenefit())}
                    className="rounded-xl text-xs"
                  />
                  <Button
                    type="button"
                    onClick={handleAddBenefit}
                    className="rounded-xl bg-emerald-600 text-white text-xs font-bold shrink-0 gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </Button>
                </div>

                <div className="space-y-1.5">
                  {(job.benefits || []).map((benefit, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="text-slate-700 dark:text-slate-300">{benefit}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveBenefit(idx)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hiring steps builder */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Hiring Steps Journey ({(job.hiringProcess || []).length})
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddHiringStep}
                    className="rounded-xl text-[11px] font-bold h-7 gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Step</span>
                  </Button>
                </div>

                <div className="space-y-2">
                  {(job.hiringProcess || []).map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-[#1155CC]">
                          Step {step.step || String(idx + 1).padStart(2, "0")}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveHiringStep(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

              <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab("location")}
                  className="rounded-xl text-xs font-bold gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </Button>
                <Button
                  type="button"
                  onClick={() => setActiveTab("compensation")}
                  className="rounded-xl bg-[#1155CC] text-white text-xs font-bold gap-1.5"
                >
                  <span>Next: Compensation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* TAB 4: COMPENSATION */}
          {activeTab === "compensation" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-sora">
                  Compensation & Pay Transparency
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set competitive salary bounds, currency, and public card display options.
                </p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Show Compensation Publicly
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Displays salary band on the public careers portal and Schema.org JobPosting JSON-LD.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(job.showSalaryPublicly)}
                  onChange={(e) => updateField("showSalaryPublicly", e.target.checked)}
                  className="w-4 h-4 rounded text-[#1155CC] focus:ring-[#1155CC] cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Currency
                  </label>
                  <select
                    value={job.salaryCurrency || "INR"}
                    onChange={(e) => updateField("salaryCurrency", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-xs font-medium text-slate-900 dark:text-white font-mono"
                  >
                    <option value="INR">INR (₹ Indian Rupee)</option>
                    <option value="USD">USD ($ US Dollar)</option>
                    <option value="EUR">EUR (€ Euro)</option>
                    <option value="GBP">GBP (£ British Pound)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Pay Period
                  </label>
                  <select
                    value={job.salaryPeriod || "year"}
                    onChange={(e) => updateField("salaryPeriod", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-xs font-medium text-slate-900 dark:text-white"
                  >
                    <option value="year">Per Year (Annual)</option>
                    <option value="month">Per Month</option>
                    <option value="hour">Per Hour</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Minimum Salary
                  </label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="e.g. 1200000"
                    value={job.salaryMin ?? ""}
                    onChange={(e) =>
                      updateField("salaryMin", e.target.value ? Number(e.target.value) : undefined)
                    }
                    className="rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Maximum Salary
                  </label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="e.g. 1800000"
                    value={job.salaryMax ?? ""}
                    onChange={(e) =>
                      updateField("salaryMax", e.target.value ? Number(e.target.value) : undefined)
                    }
                    className="rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              {job.salaryMin !== undefined &&
                job.salaryMax !== undefined &&
                job.salaryMin > job.salaryMax && (
                  <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-400 font-bold">
                    Salary minimum cannot exceed maximum. Please adjust bounds.
                  </div>
                )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Compensation Notes & Equity
                </label>
                <Input
                  placeholder="e.g. Annual discretionary performance bonus, equity options for senior bands"
                  value={job.compensationNotes || ""}
                  onChange={(e) => updateField("compensationNotes", e.target.value)}
                  className="rounded-xl text-xs font-medium"
                />
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab("content")}
                  className="rounded-xl text-xs font-bold gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </Button>
                <Button
                  type="button"
                  onClick={() => setActiveTab("application")}
                  className="rounded-xl bg-[#1155CC] text-white text-xs font-bold gap-1.5"
                >
                  <span>Next: Application Settings</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* TAB 5: APPLICATION SETTINGS */}
          {activeTab === "application" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-sora">
                  Candidate Intake & Screening Setup
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select application pipeline routing, resume requirements, and knockout screening criteria.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Application Method
                </label>
                <select
                  value={job.applicationMethod || "builtin"}
                  onChange={(e) => updateField("applicationMethod", e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-xs font-medium text-slate-900 dark:text-white"
                >
                  <option value="builtin">Built-in Agency Portal (Native intake to ATS)</option>
                  <option value="external">External ATS / Greenhouse / Lever URL</option>
                </select>
              </div>

              {job.applicationMethod === "external" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    External Application URL <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="url"
                    placeholder="https://jobs.lever.co/techsonance/..."
                    value={job.externalApplyUrl || ""}
                    onChange={(e) => updateField("externalApplyUrl", e.target.value)}
                    className="rounded-xl text-xs font-mono"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Resume Required
                    </div>
                    <div className="text-[10px] text-slate-400">PDF or DOCX upload strictly required</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={job.resumeRequired !== false}
                    onChange={(e) => updateField("resumeRequired", e.target.checked)}
                    className="w-4 h-4 rounded text-[#1155CC] focus:ring-[#1155CC] cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Cover Letter Policy
                  </label>
                  <select
                    value={job.coverLetterRequirement || "optional"}
                    onChange={(e) => updateField("coverLetterRequirement", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-xs font-medium text-slate-900 dark:text-white"
                  >
                    <option value="optional">Optional (Recommended)</option>
                    <option value="required">Mandatory</option>
                    <option value="off">Off (Hide cover letter field)</option>
                  </select>
                </div>
              </div>

              {/* Custom Screening Questions Builder */}
              <div className="space-y-3 pt-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Custom Screening Questions ({(job.screeningQuestions || []).length})
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Configure custom questions with optional knockout triggers for automated alerts.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddScreeningQuestion}
                    className="rounded-xl bg-[#1155CC] text-white text-xs font-bold gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Question</span>
                  </Button>
                </div>

                <div className="space-y-3">
                  {(job.screeningQuestions || []).map((q, idx) => (
                    <div
                      key={q.id || idx}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          QUESTION {idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveScreeningQuestion(idx)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            Response Type
                          </label>
                          <select
                            value={q.type}
                            onChange={(e) =>
                              handleUpdateScreeningQuestion(idx, {
                                type: e.target.value as any,
                              })
                            }
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-xs font-medium"
                          >
                            <option value="short_text">Short Text</option>
                            <option value="long_text">Long Narrative</option>
                            <option value="boolean">Yes / No (Boolean)</option>
                            <option value="choice">Multiple Choice</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-2 pt-4">
                          <input
                            type="checkbox"
                            checked={Boolean(q.required)}
                            onChange={(e) =>
                              handleUpdateScreeningQuestion(idx, { required: e.target.checked })
                            }
                            className="w-4 h-4 rounded text-[#1155CC] focus:ring-[#1155CC]"
                          />
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            Required Answer
                          </span>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-amber-600 uppercase mb-1">
                            Knockout Answer (Alerts ATS)
                          </label>
                          <Input
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

              <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab("compensation")}
                  className="rounded-xl text-xs font-bold gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </Button>
                <Button
                  type="button"
                  onClick={() => setActiveTab("review")}
                  className="rounded-xl bg-[#1155CC] text-white text-xs font-bold gap-1.5"
                >
                  <span>Next: Review & Publish</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* TAB 6: REVIEW & PUBLISH */}
          {activeTab === "review" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-sora">
                  Review, SEO & Publishing Schedule
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify role readiness, configure SEO metatags, and submit for executive review or publishing.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Role Status
                  </label>
                  <select
                    value={job.status || "DRAFT"}
                    onChange={(e) => updateField("status", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-xs font-bold text-slate-900 dark:text-white font-mono"
                  >
                    <option value="DRAFT">DRAFT (Internal drafting)</option>
                    <option value="IN_REVIEW">IN_REVIEW (Pending approval)</option>
                    <option value="SCHEDULED">SCHEDULED (Automatic release)</option>
                    <option value="PUBLISHED">PUBLISHED (Live on portal)</option>
                    <option value="PAUSED">PAUSED (Temporarily on hold)</option>
                    <option value="CLOSED">CLOSED (Archived / Closed)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Portal Visibility
                  </label>
                  <select
                    value={job.visibility || "public"}
                    onChange={(e) => updateField("visibility", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-xs font-medium text-slate-900 dark:text-white"
                  >
                    <option value="public">Public (Visible in search & sitemap)</option>
                    <option value="unlisted">Unlisted (Direct link only, excluded from sitemap)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Scheduled Publish Date
                  </label>
                  <Input
                    type="datetime-local"
                    value={
                      job.publishAt
                        ? new Date(job.publishAt).toISOString().slice(0, 16)
                        : ""
                    }
                    onChange={(e) =>
                      updateField("publishAt", e.target.value ? new Date(e.target.value) : null)
                    }
                    className="rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Application Deadline (closesAt)
                  </label>
                  <Input
                    type="datetime-local"
                    value={
                      job.closesAt
                        ? new Date(job.closesAt).toISOString().slice(0, 16)
                        : ""
                    }
                    onChange={(e) =>
                      updateField("closesAt", e.target.value ? new Date(e.target.value) : null)
                    }
                    className="rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Featured Position
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Pivots to top of public careers listing with special agency badge.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(job.featured)}
                  onChange={(e) => updateField("featured", e.target.checked)}
                  className="w-4 h-4 rounded text-[#1155CC] focus:ring-[#1155CC] cursor-pointer"
                />
              </div>

              {/* SEO Meta Fields */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  SEO & Social Share Optimization
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Custom SEO Meta Title
                  </label>
                  <Input
                    placeholder="e.g. Senior Fullstack Engineer Careers | TechSonance Infotech"
                    value={job.seoTitle || ""}
                    onChange={(e) => updateField("seoTitle", e.target.value)}
                    className="rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    SEO Meta Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Custom snippet for Google SERP and OpenGraph preview cards."
                    value={job.seoDescription || ""}
                    onChange={(e) => updateField("seoDescription", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab("application")}
                  className="rounded-xl text-xs font-bold gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Completeness Checklist Sidebar (4 cols) */}
        <div className="lg:col-span-4 sticky top-6 space-y-6">
          <CompletenessChecklist
            job={job}
            onSubmitForReview={() => onSubmitForReview?.(getValues())}
            onPublish={() => onPublish?.(getValues())}
            canPublishDirectly={job.status === "DRAFT" || job.status === "IN_REVIEW"}
            isSaving={isSaving}
          />
        </div>
      </div>
    </div>
  );
}
