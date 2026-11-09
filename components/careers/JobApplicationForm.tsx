"use client";

import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { Upload, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { submitCareerApplication } from "@/lib/api/careers.api";

export interface JobApplicationFormData {
  candidateName: string;
  email: string;
  phone: string;
  currentLocation: string;
  portfolioUrl: string;
  githubUrl: string;
  linkedinUrl: string;
  coverLetter: string;
  noticePeriodWeeks: number;
  privacyConsent: boolean;
  talentPoolConsent: boolean;
  website_url?: string;
}

export interface ScreeningQuestionItem {
  id: string;
  question: string;
  type: "boolean" | "choice" | "short_text";
  options?: string[];
  required?: boolean;
}

export interface JobApplicationFormProps {
  jobId: string;
  jobTitle: string;
  screeningQuestions?: ScreeningQuestionItem[];
  resumeRequired?: boolean;
  coverLetterRequirement?: "REQUIRED" | "OPTIONAL" | "OFF" | string;
  onSuccess?: (applicationId: string) => void;
}

const DEFAULT_SCREENING_QUESTIONS: ScreeningQuestionItem[] = [];

/**
 * Standard Job Application Form implementing React Hook Form and POST /api/careers/apply.
 */
export function JobApplicationForm({
  jobId,
  jobTitle,
  screeningQuestions = DEFAULT_SCREENING_QUESTIONS,
  resumeRequired = true,
  coverLetterRequirement = "OPTIONAL",
  onSuccess,
}: JobApplicationFormProps) {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [screeningAnswers, setScreeningAnswers] = useState<Record<string, string | boolean>>({});
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<JobApplicationFormData>({
    defaultValues: {
      candidateName: "",
      email: "",
      phone: "",
      currentLocation: "",
      portfolioUrl: "",
      githubUrl: "",
      linkedinUrl: "",
      coverLetter: "",
      noticePeriodWeeks: 2,
      privacyConsent: false,
      talentPoolConsent: true,
      website_url: "",
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) {
      setResumeFile(null);
      return;
    }

    const lowerName = file.name.toLowerCase();
    const isAllowedExt =
      lowerName.endsWith(".pdf") || lowerName.endsWith(".docx") || lowerName.endsWith(".doc");

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

  const onSubmit = async (values: JobApplicationFormData) => {
    setApiError(null);
    setFileError(null);

    if (resumeRequired !== false && !resumeFile) {
      setFileError("Please attach your resume document (PDF or DOCX).");
      return;
    }

    if (
      coverLetterRequirement === "REQUIRED" &&
      (!values.coverLetter || !values.coverLetter.trim())
    ) {
      setApiError("A cover letter is required for this role.");
      return;
    }

    // Validate required screening questions
    for (const sq of screeningQuestions) {
      if (sq.required) {
        const val = screeningAnswers[sq.id];
        if (val === undefined || val === "") {
          setApiError(`Please answer the screening question: "${sq.question}"`);
          return;
        }
      }
    }

    try {
      const answersPayload =
        screeningQuestions.length > 0
          ? screeningQuestions.map((q) => ({
              questionId: q.id,
              question: q.question,
              answer: screeningAnswers[q.id] ?? "",
            }))
          : undefined;

      const result = await submitCareerApplication({
        jobId,
        candidateName: values.candidateName,
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
        screeningAnswers: answersPayload,
        resumeFile,
        website_url: values.website_url,
      });

      setSubmittedRef(result.applicationId);
      setResumeFile(null);
      setScreeningAnswers({});
      if (fileInputRef.current) fileInputRef.current.value = "";
      reset();

      if (onSuccess) {
        onSuccess(result.applicationId);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setApiError(message);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void handleSubmit(onSubmit)(e);
  };

  // 1. Success State
  if (submittedRef) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-8 text-center dark:border-emerald-800 dark:bg-emerald-950/20">
        <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-600 dark:text-emerald-400" />
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          Application Submitted!
        </h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-zinc-600 dark:text-zinc-400">
          Thank you for applying for the <strong>{jobTitle}</strong> position. Your reference code
          is{" "}
          <code className="font-mono font-semibold text-emerald-700 dark:text-emerald-300">
            {submittedRef}
          </code>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      {/* Bot Honeypot */}
      <input
        type="text"
        {...register("website_url")}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      {apiError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/20"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <span>{apiError}</span>
        </div>
      )}

      {/* Candidate Information */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label
            htmlFor="apply-candidateName"
            className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
          >
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            id="apply-candidateName"
            type="text"
            {...register("candidateName", { required: "Full name is required" })}
            placeholder="Jane Doe"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-900"
          />
          {errors.candidateName && (
            <p className="mt-1 text-xs text-red-500">{errors.candidateName.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="apply-email"
            className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
          >
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            id="apply-email"
            type="email"
            {...register("email", {
              required: "Email address is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email format",
              },
            })}
            placeholder="jane@example.com"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-900"
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label
            htmlFor="apply-phone"
            className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
          >
            Phone Number
          </label>
          <input
            id="apply-phone"
            type="tel"
            {...register("phone")}
            placeholder="+91 98765 43210"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        <div>
          <label
            htmlFor="apply-location"
            className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
          >
            Current Location
          </label>
          <input
            id="apply-location"
            type="text"
            {...register("currentLocation")}
            placeholder="e.g. Surat, Gujarat / Bangalore"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        <div>
          <label
            htmlFor="apply-notice"
            className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
          >
            Notice Period
          </label>
          <select
            id="apply-notice"
            {...register("noticePeriodWeeks", { valueAsNumber: true })}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value={0}>Immediate Joiner (0 days)</option>
            <option value={2}>15 Days (2 weeks)</option>
            <option value={4}>30 Days / 1 Month (Standard)</option>
            <option value={8}>60 Days / 2 Months</option>
            <option value={12}>90 Days / 3 Months</option>
          </select>
        </div>
      </div>

      {/* Online Profiles */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label
            htmlFor="apply-portfolio"
            className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
          >
            Portfolio / Website URL
          </label>
          <input
            id="apply-portfolio"
            type="url"
            {...register("portfolioUrl")}
            placeholder="https://janedoe.dev"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div>
          <label
            htmlFor="apply-github"
            className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
          >
            GitHub URL
          </label>
          <input
            id="apply-github"
            type="url"
            {...register("githubUrl")}
            placeholder="https://github.com/janedoe"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div>
          <label
            htmlFor="apply-linkedin"
            className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
          >
            LinkedIn URL
          </label>
          <input
            id="apply-linkedin"
            type="url"
            {...register("linkedinUrl")}
            placeholder="https://linkedin.com/in/janedoe"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
      </div>

      {/* Resume Document Upload */}
      <div>
        <label
          htmlFor="apply-resume"
          className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
        >
          Resume Document (PDF or DOCX, max 5MB){" "}
          {resumeRequired !== false ? (
            <span className="text-red-500">*</span>
          ) : (
            <span className="font-normal text-zinc-400 lowercase">(optional)</span>
          )}
        </label>
        <div className="flex items-center gap-4">
          <input
            id="apply-resume"
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileChange}
            className="text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-zinc-800 dark:file:text-zinc-200"
          />
        </div>
        {resumeFile && (
          <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <Upload className="h-3.5 w-3.5" /> Selected: {resumeFile.name} (
            {(resumeFile.size / 1024).toFixed(0)} KB)
          </p>
        )}
        {fileError && <p className="mt-1 text-xs font-medium text-red-500">{fileError}</p>}
      </div>

      {/* Cover Letter */}
      {coverLetterRequirement?.toUpperCase() !== "OFF" && (
        <div>
          <label
            htmlFor="apply-coverletter"
            className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
          >
            Cover Letter or Note to Hiring Team{" "}
            {coverLetterRequirement === "REQUIRED" ? (
              <span className="text-red-500">*</span>
            ) : (
              <span className="font-normal text-zinc-400 lowercase">(Optional)</span>
            )}
          </label>
          <textarea
            id="apply-coverletter"
            rows={3}
            {...register("coverLetter")}
            placeholder="Briefly introduce your engineering philosophy, passion projects, or what excites you about this role..."
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
      )}

      {/* Screening Questions (if any) */}
      {screeningQuestions.length > 0 && (
        <div className="space-y-4 border-t border-zinc-200 pt-2 dark:border-zinc-800">
          <h4 className="text-xs font-bold tracking-wider text-zinc-500 uppercase">
            Role-Specific Screening Questions
          </h4>
          {screeningQuestions.map((sq) => (
            <div key={sq.id} className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-800 dark:text-zinc-200">
                {sq.question} {sq.required && <span className="text-red-500">*</span>}
              </label>
              {sq.type === "boolean" ? (
                <div className="flex gap-4">
                  <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300">
                    <input
                      type="radio"
                      name={`sq_${sq.id}`}
                      checked={screeningAnswers[sq.id] === true}
                      onChange={() => setScreeningAnswers((prev) => ({ ...prev, [sq.id]: true }))}
                    />
                    Yes
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300">
                    <input
                      type="radio"
                      name={`sq_${sq.id}`}
                      checked={screeningAnswers[sq.id] === false}
                      onChange={() => setScreeningAnswers((prev) => ({ ...prev, [sq.id]: false }))}
                    />
                    No
                  </label>
                </div>
              ) : sq.type === "choice" && sq.options ? (
                <select
                  value={String(screeningAnswers[sq.id] ?? "")}
                  onChange={(e) =>
                    setScreeningAnswers((prev) => ({ ...prev, [sq.id]: e.target.value }))
                  }
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                >
                  <option value="">Select an option...</option>
                  {sq.options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={String(screeningAnswers[sq.id] ?? "")}
                  onChange={(e) =>
                    setScreeningAnswers((prev) => ({ ...prev, [sq.id]: e.target.value }))
                  }
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Consent Checkboxes */}
      <div className="space-y-2 border-t border-zinc-200 pt-2 dark:border-zinc-800">
        <label className="flex cursor-pointer items-start gap-2.5 text-xs text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            {...register("privacyConsent", {
              required: "You must agree to the privacy policy to submit your application",
            })}
            className="mt-0.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
          />
          <span>
            I consent to the collection and processing of my personal data for the purpose of
            evaluating my employment application in accordance with the Privacy Policy and
            applicable data protection regulations (including the India Digital Personal Data
            Protection Act 2023). <span className="text-red-500">*</span>
          </span>
        </label>
        {errors.privacyConsent && (
          <p className="text-xs text-red-500">{errors.privacyConsent.message}</p>
        )}

        <label className="flex cursor-pointer items-start gap-2.5 text-xs text-zinc-600 dark:text-zinc-400">
          <input
            type="checkbox"
            {...register("talentPoolConsent")}
            className="mt-0.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
          />
          <span>
            Consider me for other matching engineering roles and retain my resume in the TechSonance
            Talent Pool for future opportunities.
          </span>
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-all hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Submitting Application...</span>
          </>
        ) : (
          <span>Submit Application</span>
        )}
      </button>
    </form>
  );
}
