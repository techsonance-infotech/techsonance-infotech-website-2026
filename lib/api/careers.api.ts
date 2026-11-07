import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";

export interface ScreeningAnswerItem {
  questionId: string;
  question: string;
  answer: string | boolean;
}

export interface CareerApplicationPayload {
  jobId: string;
  candidateName: string;
  email: string;
  phone?: string;
  currentLocation?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  coverLetter?: string;
  noticePeriodWeeks?: number | string;
  privacyConsent: boolean;
  talentPoolConsent?: boolean;
  source?: string;
  screeningAnswers?: ScreeningAnswerItem[];
  resumeFile?: File | null;
  website_url?: string;
}

export interface CareerApplicationResult {
  applicationId: string;
  status: string;
}

/**
 * Submits a candidate job application with an attached resume.
 * Endpoint: POST /api/careers/apply
 * Contract: careerApplyContract
 */
export async function submitCareerApplication(
  payload: CareerApplicationPayload,
): Promise<CareerApplicationResult> {
  const formData = new FormData();

  // Honeypot field for bot defeat
  if (payload.website_url) {
    formData.append("website_url", payload.website_url);
  }

  formData.append("jobId", payload.jobId);
  formData.append("candidateName", payload.candidateName.trim());
  formData.append("email", payload.email.trim());

  if (payload.phone?.trim()) formData.append("phone", payload.phone.trim());
  if (payload.currentLocation?.trim()) {
    formData.append("currentLocation", payload.currentLocation.trim());
  }
  if (payload.portfolioUrl?.trim()) formData.append("portfolioUrl", payload.portfolioUrl.trim());
  if (payload.githubUrl?.trim()) formData.append("githubUrl", payload.githubUrl.trim());
  if (payload.linkedinUrl?.trim()) formData.append("linkedinUrl", payload.linkedinUrl.trim());
  if (payload.coverLetter?.trim()) formData.append("coverLetter", payload.coverLetter.trim());

  formData.append("noticePeriodWeeks", String(payload.noticePeriodWeeks ?? 0));
  formData.append("privacyConsent", payload.privacyConsent ? "true" : "false");
  formData.append("talentPoolConsent", payload.talentPoolConsent ? "true" : "false");
  formData.append("source", payload.source || "careers_page");

  if (payload.screeningAnswers && payload.screeningAnswers.length > 0) {
    formData.append("screeningAnswers", JSON.stringify(payload.screeningAnswers));
  }

  if (payload.resumeFile) {
    formData.append("resumeFile", payload.resumeFile);
  }

  const response = await fetch(API_ENDPOINTS.CAREERS.APPLY, {
    method: "POST",
    body: formData,
  });

  const json = await response.json();

  if (!response.ok || !json.ok) {
    if (response.status === 409) {
      throw new Error(
        "You have already submitted an application for this opening. Our talent acquisition team is actively reviewing your submission.",
      );
    }
    const errMessage =
      typeof json.error === "string"
        ? json.error
        : json.error?.message ||
          json.errorPayload?.message ||
          "Failed to submit application. Please verify your details.";
    throw new Error(errMessage);
  }

  return (
    json.data || {
      applicationId: json.applicationId,
      status: json.status,
    }
  );
}

export interface TalentPoolPayload {
  name: string;
  email: string;
  phone?: string;
  preferredRole?: string;
  experienceLevel?: "entry" | "mid" | "senior" | "lead" | "executive" | string;
  skills?: string[] | string;
  portfolioUrl?: string;
  notes?: string;
  privacyConsent: boolean;
  resumeFile?: File;
  website_url?: string;
}

export interface TalentPoolResult {
  id: string;
  name?: string;
  email?: string;
}

/**
 * Submits a candidate profile into the general talent pool.
 * Endpoint: POST /api/careers/talent-pool
 * Contract: talentPoolContract
 */
export async function submitTalentPool(payload: TalentPoolPayload): Promise<TalentPoolResult> {
  const url = API_ENDPOINTS.CAREERS.TALENT_POOL;

  let response: Response;

  if (payload.resumeFile) {
    const formData = new FormData();
    if (payload.website_url) formData.append("website_url", payload.website_url);
    formData.append("name", payload.name.trim());
    formData.append("email", payload.email.trim());
    if (payload.phone?.trim()) formData.append("phone", payload.phone.trim());
    if (payload.preferredRole?.trim())
      formData.append("preferredRole", payload.preferredRole.trim());
    if (payload.experienceLevel) formData.append("experienceLevel", payload.experienceLevel);
    if (payload.portfolioUrl?.trim()) formData.append("portfolioUrl", payload.portfolioUrl.trim());
    if (payload.notes?.trim()) formData.append("notes", payload.notes.trim());
    formData.append("privacyConsent", payload.privacyConsent ? "true" : "false");

    if (Array.isArray(payload.skills)) {
      formData.append("skills", payload.skills.join(", "));
    } else if (payload.skills?.trim()) {
      formData.append("skills", payload.skills.trim());
    }

    formData.append("resumeFile", payload.resumeFile);

    response = await fetch(url, {
      method: "POST",
      body: formData,
    });
  } else {
    const skillsArray = Array.isArray(payload.skills)
      ? payload.skills
      : payload.skills
        ? payload.skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: payload.name.trim(),
        email: payload.email.trim(),
        phone: payload.phone?.trim() || undefined,
        preferredRole: payload.preferredRole?.trim() || undefined,
        experienceLevel: payload.experienceLevel || "mid",
        skills: skillsArray,
        portfolioUrl: payload.portfolioUrl?.trim() || undefined,
        notes: payload.notes?.trim() || undefined,
        privacyConsent: payload.privacyConsent,
        website_url: payload.website_url || undefined,
      }),
    });
  }

  const json = await response.json();

  if (!response.ok || !json.ok) {
    const errMessage =
      typeof json.error === "string"
        ? json.error
        : json.error?.message ||
          json.errorPayload?.message ||
          "Failed to join talent pool. Please verify your details.";
    throw new Error(errMessage);
  }

  return (
    json.data || {
      id: json.id,
      name: json.name,
      email: json.email,
    }
  );
}
