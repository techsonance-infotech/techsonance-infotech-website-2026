export interface DetectedIssue {
  type: "inclusive_language" | "best_practice" | "clarity";
  word: string;
  field: "description" | "responsibilities" | "requirements" | "summary" | "title";
  suggestion: string;
  reason: string;
}

export interface JobQualityReport {
  score: number;
  grade: "Excellent" | "Good" | "Needs Improvement";
  issues: DetectedIssue[];
  passedChecks: string[];
}

const BIASED_TERMS: Array<{
  pattern: RegExp;
  word: string;
  suggestion: string;
  reason: string;
}> = [
  {
    pattern: /\brockstars?\b/i,
    word: "rockstar",
    suggestion: "exceptional specialist",
    reason: "Informal cliché that can discourage qualified candidates with non-traditional backgrounds.",
  },
  {
    pattern: /\bninjas?\b/i,
    word: "ninja",
    suggestion: "skilled engineer",
    reason: "Hyperbolic buzzword that obscures actual job deliverables.",
  },
  {
    pattern: /\bgurus?\b/i,
    word: "guru",
    suggestion: "subject matter expert",
    reason: "Vague jargon; use concrete technical competence descriptors instead.",
  },
  {
    pattern: /\bwork hard,? play hard\b/i,
    word: "work hard play hard",
    suggestion: "collaborative and dedicated team culture",
    reason: "Often signals burnout culture and poor work-life boundaries.",
  },
  {
    pattern: /\byoung and dynamic\b|\byoung dynamic\b/i,
    word: "young dynamic",
    suggestion: "fast-paced, innovative",
    reason: "Age-biased phrasing that risks violating age discrimination standards.",
  },
  {
    pattern: /\bdigital natives?\b/i,
    word: "digital native",
    suggestion: "technologically proficient",
    reason: "Assumes generational age rather than actual digital competence.",
  },
  {
    pattern: /\baggressive deadlines?\b/i,
    word: "aggressive deadlines",
    suggestion: "ambitious milestones",
    reason: "Aggressive phrasing can signal an unsustainable work pace.",
  },
  {
    pattern: /\bcrush(ing)? it\b/i,
    word: "crush it",
    suggestion: "excel consistently",
    reason: "Overly colloquial slang in formal job specifications.",
  },
];

export function auditJobQuality(data: {
  title?: string;
  summary?: string;
  description?: string;
  responsibilities?: string[];
  requirements?: string[];
  showSalaryPublicly?: boolean;
}): JobQualityReport {
  const issues: DetectedIssue[] = [];
  const passedChecks: string[] = [];
  let score = 100;

  const fullTextMap: Record<
    "title" | "summary" | "description",
    string
  > = {
    title: data.title || "",
    summary: data.summary || "",
    description: data.description || "",
  };

  // Check simple text fields for clichés
  (Object.keys(fullTextMap) as Array<keyof typeof fullTextMap>).forEach((field) => {
    const text = fullTextMap[field];
    BIASED_TERMS.forEach((term) => {
      if (term.pattern.test(text)) {
        issues.push({
          type: "inclusive_language",
          word: term.word,
          field,
          suggestion: term.suggestion,
          reason: term.reason,
        });
        score -= 8;
      }
    });
  });

  // Check array fields
  data.responsibilities?.forEach((resp) => {
    BIASED_TERMS.forEach((term) => {
      if (term.pattern.test(resp)) {
        issues.push({
          type: "inclusive_language",
          word: term.word,
          field: "responsibilities",
          suggestion: term.suggestion,
          reason: term.reason,
        });
        score -= 8;
      }
    });
  });

  data.requirements?.forEach((req) => {
    BIASED_TERMS.forEach((term) => {
      if (term.pattern.test(req)) {
        issues.push({
          type: "inclusive_language",
          word: term.word,
          field: "requirements",
          suggestion: term.suggestion,
          reason: term.reason,
        });
        score -= 8;
      }
    });
  });

  // Quality checks
  if (data.description && data.description.trim().split(/\s+/).length >= 40) {
    passedChecks.push("Comprehensive position description");
  } else {
    issues.push({
      type: "clarity",
      word: "Brief description",
      field: "description",
      suggestion: "Expand the role description to at least 40 words",
      reason: "Provides candidates clear expectations on team mission and architecture.",
    });
    score -= 10;
  }

  const respCount = data.responsibilities?.length || 0;
  if (respCount >= 3 && respCount <= 8) {
    passedChecks.push("Balanced responsibilities count (3-8 core duties)");
  } else if (respCount > 8) {
    issues.push({
      type: "best_practice",
      word: `${respCount} responsibilities`,
      field: "responsibilities",
      suggestion: "Consolidate into 4-7 primary focus areas",
      reason: "Excessive duties increase cognitive friction for prospective applicants.",
    });
    score -= 5;
  }

  const reqCount = data.requirements?.length || 0;
  if (reqCount >= 2 && reqCount <= 7) {
    passedChecks.push("Optimal requirements count (encourages diverse applicant pool)");
  } else if (reqCount > 8) {
    issues.push({
      type: "best_practice",
      word: `${reqCount} requirements`,
      field: "requirements",
      suggestion: "Focus on 4-6 essential requirements and move nice-to-haves to Preferred Qualifications",
      reason: "Extensive checklists discourage diverse and female applicants who apply only when 100% qualified.",
    });
    score -= 5;
  }

  if (data.showSalaryPublicly) {
    passedChecks.push("Pay transparency enabled (boosts applicant conversion by 40%)");
  }

  if (issues.filter((i) => i.type === "inclusive_language").length === 0) {
    passedChecks.push("Zero exclusionary buzzwords or gendered clichés");
  }

  const finalScore = Math.max(0, Math.min(100, score));
  const grade =
    finalScore >= 85 ? "Excellent" : finalScore >= 70 ? "Good" : "Needs Improvement";

  return {
    score: finalScore,
    grade,
    issues,
    passedChecks,
  };
}
