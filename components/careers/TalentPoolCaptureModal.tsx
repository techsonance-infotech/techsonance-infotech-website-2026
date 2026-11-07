"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { X, Sparkles, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitTalentPool } from "@/lib/api/careers.api";

export interface TalentPoolFormData {
  name: string;
  email: string;
  phone: string;
  preferredRole: string;
  experienceLevel: "entry" | "mid" | "senior" | "lead" | "executive";
  skills: string;
  portfolioUrl: string;
  notes: string;
  privacyConsent: boolean;
  website_url?: string;
}

interface TalentPoolCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TalentPoolCaptureModal({ isOpen, onClose }: TalentPoolCaptureModalProps) {
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TalentPoolFormData>({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      preferredRole: "",
      experienceLevel: "mid",
      skills: "",
      portfolioUrl: "",
      notes: "",
      privacyConsent: false,
      website_url: "",
    },
  });

  if (!isOpen) return null;

  const onSubmit = async (values: TalentPoolFormData) => {
    setApiError(null);

    try {
      await submitTalentPool({
        name: values.name,
        email: values.email,
        phone: values.phone || undefined,
        preferredRole: values.preferredRole || undefined,
        experienceLevel: values.experienceLevel,
        skills: values.skills,
        portfolioUrl: values.portfolioUrl || undefined,
        notes: values.notes || undefined,
        privacyConsent: values.privacyConsent,
        website_url: values.website_url,
      });

      setSuccess(true);
      reset();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setApiError(message);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setApiError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold font-sora text-slate-900 dark:text-white">
              You're in our Talent Pool!
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
              Thank you for connecting with TechSonance Infotech. Our recruiting team will reach out
              directly when roles matching your skill set become available.
            </p>
            <div className="pt-4">
              <Button onClick={handleClose} className="rounded-xl px-6">
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Honeypot field for bot defeat */}
            <input
              type="text"
              {...register("website_url")}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Future Opportunities</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-sora text-slate-900 dark:text-white">
                Join our Global Talent Pool
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Don't see an exact match right now? Share your details and we'll keep you in mind
                for upcoming projects.
              </p>
            </div>

            {apiError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{apiError}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label
                  htmlFor="talent-name"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Full Name *
                </label>
                <input
                  id="talent-name"
                  type="text"
                  {...register("name", { required: "Full name is required" })}
                  placeholder="e.g. Maya Lin"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="talent-email"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Email *
                  </label>
                  <input
                    id="talent-email"
                    type="email"
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email format",
                      },
                    })}
                    placeholder="maya@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.email && (
                    <p className="text-xs text-rose-500 mt-1">{errors.email.message}</p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="talent-phone"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Phone (Optional)
                  </label>
                  <input
                    id="talent-phone"
                    type="tel"
                    {...register("phone")}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="talent-role"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Desired Role
                  </label>
                  <input
                    id="talent-role"
                    type="text"
                    {...register("preferredRole")}
                    placeholder="e.g. Senior Frontend Dev"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="talent-exp"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Experience Level
                  </label>
                  <select
                    id="talent-exp"
                    {...register("experienceLevel")}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="entry">Entry-Level / Fresher</option>
                    <option value="mid">Mid-Level (2-5 yrs)</option>
                    <option value="senior">Senior (5-8 yrs)</option>
                    <option value="lead">Lead / Architect (8+ yrs)</option>
                    <option value="executive">Director / Executive</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="talent-skills"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Key Skills (comma separated)
                </label>
                <input
                  id="talent-skills"
                  type="text"
                  {...register("skills")}
                  placeholder="React, TypeScript, GraphQL, Node.js"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="talent-portfolio"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Portfolio / LinkedIn / GitHub URL
                </label>
                <input
                  id="talent-portfolio"
                  type="url"
                  {...register("portfolioUrl")}
                  placeholder="https://github.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("privacyConsent", {
                      required: "You must accept the privacy policy to join the talent pool",
                    })}
                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>
                    I consent to TechSonance storing my submitted profile and contacting me
                    regarding relevant employment opportunities in accordance with privacy laws. *
                  </span>
                </label>
                {errors.privacyConsent && (
                  <p className="text-xs text-rose-500 mt-1">{errors.privacyConsent.message}</p>
                )}
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-[#1155CC] hover:bg-[#0d44a4] text-white font-bold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Join Talent Pool</span>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default TalentPoolCaptureModal;
