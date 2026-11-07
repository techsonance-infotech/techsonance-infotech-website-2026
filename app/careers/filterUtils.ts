import type { JobPosting } from "@/lib/content/types";

export interface FilterOptions {
  search?: string;
  department?: string;
  location?: string;
  workMode?: string;
  type?: string;
  experienceLevel?: string;
  sortBy?: "newest" | "closing_soon" | "title";
}

export type JobFilterCriteria = FilterOptions;

export function filterJobs(jobs: JobPosting[], filters: FilterOptions): JobPosting[] {
  if (!jobs || !Array.isArray(jobs)) return [];

  const searchKeyword = (filters.search || "").trim().toLowerCase();
  const departmentFilter = (filters.department || "").trim().toLowerCase();
  const locationFilter = (filters.location || "").trim().toLowerCase();
  const workModeFilter = (filters.workMode || "").trim().toLowerCase();
  const typeFilter = (filters.type || "").trim().toLowerCase();
  const experienceFilter = (filters.experienceLevel || "").trim().toLowerCase();

  const filtered = jobs.filter((job) => {
    if (!job || typeof job !== "object") return false;

    // 1. Department filter
    if (departmentFilter && departmentFilter !== "all") {
      if ((job.department || "").toLowerCase() !== departmentFilter) {
        return false;
      }
    }

    // 2. Location filter
    if (locationFilter && locationFilter !== "all") {
      const loc = (job.location || "").toLowerCase();
      if (!loc.includes(locationFilter)) {
        return false;
      }
    }

    // 3. Work Mode filter
    if (workModeFilter && workModeFilter !== "all") {
      const mode = (job.workMode || "").toLowerCase();
      const loc = (job.location || "").toLowerCase();
      if (workModeFilter === "remote") {
        if (mode !== "remote" && !loc.includes("remote")) {
          return false;
        }
      } else if (workModeFilter === "hybrid") {
        if (mode !== "hybrid" && !loc.includes("hybrid")) {
          return false;
        }
      } else if (workModeFilter === "on_site") {
        if (mode !== "on_site" && mode !== "onsite") {
          return false;
        }
      } else if (mode !== workModeFilter) {
        return false;
      }
    }

    // 4. Employment Type filter
    if (typeFilter && typeFilter !== "all") {
      const normType = (job.type || "").toLowerCase().replace(/[\s_-]/g, "");
      const normFilter = typeFilter.replace(/[\s_-]/g, "");
      if (normType !== normFilter) {
        return false;
      }
    }

    // 5. Experience Level filter
    if (experienceFilter && experienceFilter !== "all") {
      const exp = (job.experienceLevel || "").toLowerCase();
      if (!exp.includes(experienceFilter)) {
        return false;
      }
    }

    // 6. Search query across title, description, skills, department, and location
    if (searchKeyword) {
      const inTitle = (job.title || "").toLowerCase().includes(searchKeyword);
      const inDept = (job.department || "").toLowerCase().includes(searchKeyword);
      const inLoc = (job.location || "").toLowerCase().includes(searchKeyword);
      const inDesc = (job.description || "").toLowerCase().includes(searchKeyword);
      const inSummary = (job.summary || "").toLowerCase().includes(searchKeyword);
      const inSkills = Array.isArray(job.skills)
        ? job.skills.some((s) => typeof s === "string" && s.toLowerCase().includes(searchKeyword))
        : false;

      if (!inTitle && !inDept && !inLoc && !inDesc && !inSummary && !inSkills) {
        return false;
      }
    }

    return true;
  });

  // Sort
  if (filters.sortBy === "closing_soon") {
    return filtered.toSorted((a, b) => {
      const aDate = a.closesAt ? new Date(a.closesAt).getTime() : NaN;
      const bDate = b.closesAt ? new Date(b.closesAt).getTime() : NaN;
      const aTime = Number.isFinite(aDate) ? aDate : Infinity;
      const bTime = Number.isFinite(bDate) ? bDate : Infinity;
      return aTime - bTime;
    });
  }

  if (filters.sortBy === "title") {
    return filtered.toSorted((a, b) => (a.title || "").localeCompare(b.title || ""));
  }

  // Default: newest first (if dates are available)
  return filtered.toSorted((a, b) => {
    const aDate = a.publishedAt ? new Date(a.publishedAt).getTime() : NaN;
    const bDate = b.publishedAt ? new Date(b.publishedAt).getTime() : NaN;
    const aTime = Number.isFinite(aDate) ? aDate : 0;
    const bTime = Number.isFinite(bDate) ? bDate : 0;
    return bTime - aTime;
  });
}
