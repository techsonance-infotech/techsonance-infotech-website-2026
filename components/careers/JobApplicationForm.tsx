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
  onSuccess?: (applicationId: string) => void;
}

/**
 * Standard Job Application Form implementing React Hook Form and POST /api/careers/apply.
 */
export function JobApplicationForm({
  jobId,
  jobTitle,
  screeningQuestions = [],
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

    if (!resumeFile) {
      setFileError("Please attach your resume document (PDF or DOCX).");
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

  // 1. Success State
  if (submittedRef) {
    return (
      <div className="p-8 text-center rounded-2xl border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800">
        <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          Application Submitted!
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-md mx-auto">
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
          className="p-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 text-sm text-red-700 flex items-start gap-2.5"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
          <span>{apiError}</span>
        </div>
      )}

      {/* Candidate Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="apply-candidateName"
            className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1"
          >
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            id="apply-candidateName"
            type="text"
            {...register("candidateName", { required: "Full name is required" })}
            placeholder="Jane Doe"
            className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
          {errors.candidateName && (
            <p className="text-xs text-red-500 mt-1">{errors.candidateName.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="apply-email"
            className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1"
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
            className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="apply-phone"
            className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1"
          >
            Phone Number
          </label>
          <input
            id="apply-phone"
            type="tel"
            {...register("phone")}
            placeholder="+91 98765 43210"
            className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="apply-location"
            className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1"
          >
            Current Location
          </label>
          <input
            id="apply-location"
            type="text"
            {...register("currentLocation")}
            placeholder="e.g. Bhubaneswar, India"
            className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Online Profiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label
            htmlFor="apply-portfolio"
            className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1"
          >
            Portfolio / Website URL
          </label>
          <input
            id="apply-portfolio"
            type="url"
            {...register("portfolioUrl")}
            placeholder="https://janedoe.dev"
            className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label
            htmlFor="apply-github"
            className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1"
          >
            GitHub URL
          </label>
          <input
            id="apply-github"
            type="url"
            {...register("githubUrl")}
            placeholder="https://github.com/janedoe"
            className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label
            htmlFor="apply-linkedin"
            className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1"
          >
            LinkedIn URL
          </label>
          <input
            id="apply-linkedin"
            type="url"
            {...register("linkedinUrl")}
            placeholder="https://linkedin.com/in/janedoe"
            className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Resume Document Upload */}
      <div>
        <label
          htmlFor="apply-resume"
          className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1"
        >
          Resume Document (PDF or DOCX, max 5MB) <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-4">
          <input
            id="apply-resume"
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileChange}
            className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-zinc-800 dark:file:text-zinc-200"
          />
        </div>
        {resumeFile && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-1 font-medium">
            <Upload className="w-3.5 h-3.5" /> Selected: {resumeFile.name} (
            {(resumeFile.size / 1024).toFixed(0)} KB)
          </p>
        )}
        {fileError && <p className="text-xs text-red-500 mt-1 font-medium">{fileError}</p>}
      </div>

      {/* Cover Letter */}
      <div>
        <label
          htmlFor="apply-coverletter"
          className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1"
        >
          Cover Letter or Note to Hiring Team (Optional)
        </label>
        <textarea
          id="apply-coverletter"
          rows={3}
          {...register("coverLetter")}
          placeholder="Briefly introduce your engineering philosophy, passion projects, or what excites you about this role..."
          className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Screening Questions (if any) */}
      {screeningQuestions.length > 0 && (
        <div className="space-y-4 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Role-Specific Screening Questions
          </h4>
          {screeningQuestions.map((sq) => (
            <div key={sq.id} className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-800 dark:text-zinc-200">
                {sq.question} {sq.required && <span className="text-red-500">*</span>}
              </label>
              {sq.type === "boolean" ? (
                <div className="flex gap-4">
                  <label className="inline-flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="radio"
                      name={`sq_${sq.id}`}
                      checked={screeningAnswers[sq.id] === true}
                      onChange={() => setScreeningAnswers((prev) => ({ ...prev, [sq.id]: true }))}
                    />
                    Yes
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
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
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
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
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Consent Checkboxes */}
      <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
        <label className="flex items-start gap-2.5 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
          <input
            type="checkbox"
            {...register("privacyConsent", {
              required: "You must agree to the privacy policy to submit your application",
            })}
            className="mt-0.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
          />
          <span>
            I consent to the collection and processing of my personal data for the purpose of
            evaluating my employment application in accordance with the Privacy Policy.{" "}
            <span className="text-red-500">*</span>
          </span>
        </label>
        {errors.privacyConsent && (
          <p className="text-xs text-red-500">{errors.privacyConsent.message}</p>
        )}

        <label className="flex items-start gap-2.5 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
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
        className="w-full py-2.5 px-4 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Submitting Application...</span>
          </>
        ) : (
          <span>Submit Application</span>
        )}
      </button>
    </form>
  );
}
