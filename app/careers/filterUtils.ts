import type { JobPosting } from "@/lib/content/types";

export interface FilterOptions {
  search?: string;
  department?: string;
  workMode?: string;
  type?: string;
  experienceLevel?: string;
}

export type JobFilterCriteria = FilterOptions;

export function filterJobs(jobs: JobPosting[], filters: FilterOptions): JobPosting[] {
  if (!jobs || !Array.isArray(jobs)) return [];

  const searchKeyword = (filters.search || "").trim().toLowerCase();
  const departmentFilter = (filters.department || "").trim().toLowerCase();
  const workModeFilter = (filters.workMode || "").trim().toLowerCase();
  const typeFilter = (filters.type || "").trim().toLowerCase();
  const experienceFilter = (filters.experienceLevel || "").trim().toLowerCase();

  return jobs.filter((job) => {
    // 1. Department filter
    if (departmentFilter && departmentFilter !== "all") {
      if ((job.department || "").toLowerCase() !== departmentFilter) {
        return false;
      }
    }

    // 2. Work Mode filter
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

    // 3. Employment Type filter
    if (typeFilter && typeFilter !== "all") {
      const normType = (job.type || "").toLowerCase().replace(/[\s_-]/g, "");
      const normFilter = typeFilter.replace(/[\s_-]/g, "");
      if (normType !== normFilter) {
        return false;
      }
    }

    // 4. Experience Level filter
    if (experienceFilter && experienceFilter !== "all") {
      const exp = (job.experienceLevel || "").toLowerCase();
      if (!exp.includes(experienceFilter)) {
        return false;
      }
    }

    // 5. Search query across title, description, skills, department, and location
    if (searchKeyword) {
      const inTitle = (job.title || "").toLowerCase().includes(searchKeyword);
      const inDept = (job.department || "").toLowerCase().includes(searchKeyword);
      const inLoc = (job.location || "").toLowerCase().includes(searchKeyword);
      const inDesc = (job.description || "").toLowerCase().includes(searchKeyword);
      const inSummary = (job.summary || "").toLowerCase().includes(searchKeyword);
      const inSkills = Array.isArray(job.skills)
        ? job.skills.some((s) => s.toLowerCase().includes(searchKeyword))
        : false;

      if (!inTitle && !inDept && !inLoc && !inDesc && !inSummary && !inSkills) {
        return false;
      }
    }

    return true;
  });
}
