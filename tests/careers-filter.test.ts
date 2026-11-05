import { describe, it, expect } from "vitest";
import { filterJobs, type FilterOptions } from "@/app/careers/filterUtils";
import type { JobPosting } from "@/lib/content/types";

describe("filterJobs", () => {
  const mockJobs: JobPosting[] = [
    {
      id: "1",
      slug: "frontend-lead",
      title: "Frontend Lead",
      department: "Engineering",
      location: "Remote",
      workMode: "remote",
      type: "Full Time",
      experienceLevel: "Senior",
      description: "Next.js architecture and React components",
      responsibilities: ["Lead team"],
      requirements: ["TypeScript"],
      skills: ["React", "Next.js", "TypeScript"],
      benefits: ["Equity"],
      status: "PUBLISHED",
    },
    {
      id: "2",
      slug: "brand-designer",
      title: "Brand Designer",
      department: "Design",
      location: "Bhubaneswar",
      workMode: "on_site",
      type: "Contract",
      experienceLevel: "Mid",
      description: "Visual identity",
      responsibilities: ["Figma"],
      requirements: ["Design"],
      skills: ["Figma", "Design Systems"],
      benefits: ["Flexible"],
      status: "PUBLISHED",
    },
    {
      id: "3",
      slug: "backend-engineer",
      title: "Backend Engineer",
      department: "Engineering",
      location: "Bhubaneswar",
      workMode: "hybrid",
      type: "Contract",
      experienceLevel: "Senior",
      description: "Building scalable Go and Node services",
      responsibilities: ["API development"],
      requirements: ["Node.js", "PostgreSQL"],
      skills: ["Node.js", "PostgreSQL"],
      benefits: ["Health insurance"],
      status: "PUBLISHED",
    },
  ];

  it("filters accurately by keyword search across title, description, and department", () => {
    const res = filterJobs(mockJobs, { search: "Frontend" });
    expect(res).toHaveLength(1);
    expect(res[0].slug).toBe("frontend-lead");
  });

  it("filters by department", () => {
    const res = filterJobs(mockJobs, { department: "Design" });
    expect(res).toHaveLength(1);
    expect(res[0].slug).toBe("brand-designer");
  });

  it("filters by workMode", () => {
    const res = filterJobs(mockJobs, { workMode: "remote" });
    expect(res).toHaveLength(1);
    expect(res[0].slug).toBe("frontend-lead");
  });

  it("filters by type", () => {
    const res = filterJobs(mockJobs, { type: "Contract" });
    expect(res).toHaveLength(2);
    expect(res.map((j) => j.slug)).toEqual(["brand-designer", "backend-engineer"]);
  });

  it("filters by skill keywords in search", () => {
    const res = filterJobs(mockJobs, { search: "PostgreSQL" });
    expect(res).toHaveLength(1);
    expect(res[0].slug).toBe("backend-engineer");
  });

  it("filters by experienceLevel", () => {
    const res = filterJobs(mockJobs, { experienceLevel: "Mid" });
    expect(res).toHaveLength(1);
    expect(res[0].slug).toBe("brand-designer");
  });

  it("combines multiple filters accurately (department + workMode + type)", () => {
    const res = filterJobs(mockJobs, {
      department: "Engineering",
      workMode: "hybrid",
      type: "Contract",
    });
    expect(res).toHaveLength(1);
    expect(res[0].slug).toBe("backend-engineer");
  });

  it("returns empty array when no jobs match filter criteria", () => {
    const res = filterJobs(mockJobs, { search: "NonExistentJobRole123" });
    expect(res).toHaveLength(0);
  });

  it("handles 'all' option across department, workMode, type, and experienceLevel", () => {
    const res = filterJobs(mockJobs, {
      department: "all",
      workMode: "all",
      type: "all",
      experienceLevel: "all",
    });
    expect(res).toHaveLength(3);
  });

  it("returns all when no filters active", () => {
    const res = filterJobs(mockJobs, {});
    expect(res).toHaveLength(3);
  });
});
